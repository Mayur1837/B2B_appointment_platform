import crypto from "crypto";
import mongoose from "mongoose";
import Business from "../models/Business.js";
import Service from "../models/Service.js";
import Appointment from "../models/Appointment.js";
import ReservationSlot from "../models/ReservationSlot.js";
import { getAvailableSlots } from "../services/slotService.js";
import { dateInTimeZone, combineInTimeZone } from "../utils/booking.js";
import { AppError } from "../utils/AppError.js";

export async function listPublicBusinesses(req, res) {
  const businesses = await Business.find({ status: "ACTIVE" })
    .select("name phone timezone slug")
    .sort({ name: 1 })
    .lean();
  const ids = businesses.map((b) => b._id);
  const services = await Service.find({
    tenantId: { $in: ids },
    status: "ACTIVE",
  })
    .select("tenantId name description durationMinutes status")
    .sort({ name: 1 })
    .lean();
  const grouped = services.reduce((acc, service) => {
    (acc[service.tenantId.toString()] ||= []).push(service);
    return acc;
  }, {});
  res.json({
    businesses: businesses.map((b) => ({
      ...b,
      services: grouped[b._id.toString()] || [],
    })),
  });
}

export async function getPublicBusiness(req, res) {
  const b = await Business.findOne({
    slug: req.params.slug,
    status: "ACTIVE",
  }).select("name email phone timezone slug");
  if (!b) throw new AppError("Business not found or disabled", 404);
  const services = await Service.find({
    tenantId: b._id,
    status: "ACTIVE",
  }).sort({ name: 1 });
  res.json({ business: b, services });
}

export async function slots(req, res) {
  const b = await Business.findOne({ slug: req.params.slug, status: "ACTIVE" });
  if (!b) throw new AppError("Business not found or disabled", 404);
  const s = await Service.findOne({
    _id: req.query.serviceId,
    tenantId: b._id,
    status: "ACTIVE",
  });
  if (!s) throw new AppError("Service not found", 404);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.query.date || ""))
    throw new AppError("A valid date is required", 400);
  const available = await getAvailableSlots({
    tenantId: b._id,
    service: s,
    date: req.query.date,
    timeZone: b.timezone,
  });
  res.json({ slots: available, timezone: b.timezone });
}

export async function createAppointment(req, res) {
  if (!req.user || req.user.role !== "CUSTOMER")
    throw new AppError("Customer authentication is required to book", 401);
  const { serviceId, customerPhone, startAt } = req.body;
  const b = await Business.findOne({ slug: req.params.slug, status: "ACTIVE" });
  if (!b) throw new AppError("Business not found or disabled", 404);
  const s = await Service.findOne({
    _id: serviceId,
    tenantId: b._id,
    status: "ACTIVE",
  });
  if (!s) throw new AppError("Service not found", 404);

  const start = new Date(startAt);
  if (Number.isNaN(start.getTime()) || start <= new Date())
    throw new AppError("Invalid or past appointment time", 400);
  const date = dateInTimeZone(start, b.timezone);
  const end = new Date(start.getTime() + s.durationMinutes * 60000);
  if (dateInTimeZone(end, b.timezone) !== date)
    throw new AppError(
      "Appointments cannot cross a business day boundary",
      400,
    );

  const slots = await getAvailableSlots({
    tenantId: b._id,
    service: s,
    date,
    timeZone: b.timezone,
  });
  if (!slots.some((x) => x.startAt === start.toISOString()))
    throw new AppError("Selected slot is no longer available", 409);

  const session = await mongoose.startSession();
  let appointment;
  try {
    await session.withTransaction(async () => {
      const cancelToken = crypto.randomBytes(32).toString("hex");
      const [created] = await Appointment.create(
        [
          {
            tenantId: b._id,
            serviceId,
            customerId: req.user._id,
            customerName: req.user.name.trim(),
            customerEmail: req.user.email.trim().toLowerCase(),
            customerPhone: customerPhone?.trim(),
            startAt: start,
            endAt: end,
            cancelToken,
          },
        ],
        { session },
      );

      const locks = [];
      for (
        let cursor = start.getTime();
        cursor < end.getTime();
        cursor += 5 * 60000
      ) {
        locks.push({
          tenantId: b._id,
          resourceKey: "GENERAL",
          slotAt: new Date(cursor),
          appointmentId: created._id,
        });
      }
      await ReservationSlot.insertMany(locks, { session, ordered: true });
      appointment = created;
    });
  } catch (error) {
    if (error?.code === 11000)
      throw new AppError("Selected slot is already booked", 409);
    throw error;
  } finally {
    await session.endSession();
  }

  res.status(201).json({
    appointment: {
      id: appointment._id,
      serviceId: appointment.serviceId,
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      startAt: appointment.startAt,
      endAt: appointment.endAt,
      status: appointment.status,
      cancelToken: appointment.cancelToken,
    },
    timezone: b.timezone,
  });
}

export async function listCustomerAppointments(req, res) {
  const appointments = await Appointment.find({ customerId: req.user._id })
    .populate("serviceId", "name durationMinutes")
    .populate("tenantId", "name timezone slug status")
    .sort({ startAt: -1 });
  res.json({ appointments });
}

export async function cancelCustomerAppointmentById(req, res) {
  const a = await Appointment.findOne({
    _id: req.params.id,
    customerId: req.user._id,
  })
    .populate("serviceId", "name durationMinutes")
    .populate("tenantId", "name timezone slug");
  if (!a) throw new AppError("Appointment not found", 404);
  if (a.status === "CANCELLED") return res.json({ appointment: a });
  if (a.startAt <= new Date())
    throw new AppError("Past appointments cannot be cancelled", 400);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      a.status = "CANCELLED";
      await a.save({ session });
      await ReservationSlot.deleteMany({ appointmentId: a._id }, { session });
    });
  } finally {
    await session.endSession();
  }
  res.json({ appointment: a });
}

export async function getCustomerAppointment(req, res) {
  const a = await Appointment.findOne({ cancelToken: req.params.token })
    .populate("serviceId", "name durationMinutes")
    .populate("tenantId", "name timezone slug");
  if (!a) throw new AppError("Booking not found", 404);
  if (
    req.user &&
    req.user.role === "CUSTOMER" &&
    a.customerId &&
    a.customerId.toString() !== req.user._id.toString()
  )
    throw new AppError("Booking not found", 404);
  res.json({ appointment: a });
}

export async function cancelCustomerAppointment(req, res) {
  const a = await Appointment.findOne({ cancelToken: req.params.token });
  if (!a) throw new AppError("Booking not found", 404);
  if (
    req.user?.role === "CUSTOMER" &&
    a.customerId &&
    a.customerId.toString() !== req.user._id.toString()
  )
    throw new AppError("Booking not found", 404);
  if (a.status === "CANCELLED") return res.json({ appointment: a });
  if (a.startAt <= new Date())
    throw new AppError("Past appointments cannot be cancelled", 400);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      a.status = "CANCELLED";
      await a.save({ session });
      await ReservationSlot.deleteMany({ appointmentId: a._id }, { session });
    });
  } finally {
    await session.endSession();
  }
  res.json({ appointment: a });
}
