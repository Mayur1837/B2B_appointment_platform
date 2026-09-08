import mongoose from "mongoose";
import Business from "../models/Business.js";
import Service from "../models/Service.js";
import Availability from "../models/Availability.js";
import Appointment from "../models/Appointment.js";
import ReservationSlot from "../models/ReservationSlot.js";
import { AppError } from "../utils/AppError.js";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = ["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"];

function assertTimeRange(startTime, endTime) {
  if (!TIME_RE.test(startTime || "") || !TIME_RE.test(endTime || ""))
    throw new AppError("Times must use HH:mm format", 400);
  if (startTime >= endTime)
    throw new AppError("End time must be after start time", 400);
}

function validateAvailabilityItem(item) {
  if (!DATE_RE.test(item.date || ""))
    throw new AppError("Availability date must use YYYY-MM-DD format", 400);
  const parsed = new Date(`${item.date}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== item.date
  )
    throw new AppError("Invalid availability date", 400);
  assertTimeRange(item.startTime, item.endTime);
}

export async function getProfile(req, res) {
  const business = await Business.findById(req.tenantId);
  if (!business) throw new AppError("Business not found", 404);
  res.json({ business });
}

export async function updateProfile(req, res) {
  const allowed = ["name", "email", "phone", "timezone"];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowed.includes(key)),
  );
  if (updates.name !== undefined && !updates.name.trim())
    throw new AppError("Business name is required", 400);
  if (updates.timezone) {
    try {
      Intl.DateTimeFormat("en-US", { timeZone: updates.timezone }).format();
    } catch {
      throw new AppError("Invalid IANA timezone", 400);
    }
  }
  const business = await Business.findByIdAndUpdate(req.tenantId, updates, {
    new: true,
    runValidators: true,
  });
  res.json({ business });
}

export async function listServices(req, res) {
  const services = await Service.find({ tenantId: req.tenantId })
    .sort({ createdAt: -1 })
    .lean();
  const ids = services.map((s) => s._id);
  const availability = await Availability.find({
    tenantId: req.tenantId,
    serviceId: { $in: ids },
  })
    .sort({ date: 1, startTime: 1 })
    .lean();
  const byService = availability.reduce((acc, item) => {
    (acc[item.serviceId.toString()] ||= []).push(item);
    return acc;
  }, {});
  res.json({
    services: services.map((s) => ({
      ...s,
      availability: byService[s._id.toString()] || [],
    })),
  });
}

export async function createService(req, res) {
  const { name, description, durationMinutes, availability = [] } = req.body;
  if (!name?.trim()) throw new AppError("Service name is required", 400);
  const duration = Number(durationMinutes);
  if (
    !Number.isInteger(duration) ||
    duration < 5 ||
    duration > 1440 ||
    duration % 5 !== 0
  ) {
    throw new AppError(
      "Duration must be a whole number of minutes, from 5 to 1440, in 5-minute increments",
      400,
    );
  }
  if (!Array.isArray(availability) || availability.length > 50)
    throw new AppError(
      "Availability must be an array with at most 50 entries",
      400,
    );
  availability.forEach(validateAvailabilityItem);

  const session = await mongoose.startSession();
  let service;
  try {
    await session.withTransaction(async () => {
      [service] = await Service.create(
        [
          {
            tenantId: req.tenantId,
            name,
            description,
            durationMinutes: duration,
          },
        ],
        { session },
      );
      if (availability.length) {
        await Availability.insertMany(
          availability.map((item) => ({
            ...item,
            tenantId: req.tenantId,
            serviceId: service._id,
            active: true,
          })),
          { session, ordered: true },
        );
      }
    });
  } catch (error) {
    if (error?.code === 11000)
      throw new AppError(
        "Duplicate availability window for this service and date",
        409,
      );
    throw error;
  } finally {
    await session.endSession();
  }

  const populated = await Service.findById(service._id).lean();
  res.status(201).json({ service: populated });
}

export async function updateService(req, res) {
  const updates = { ...req.body };
  delete updates.tenantId;
  delete updates.availability;
  if (updates.durationMinutes !== undefined) {
    const duration = Number(updates.durationMinutes);
    if (
      !Number.isInteger(duration) ||
      duration < 5 ||
      duration > 1440 ||
      duration % 5 !== 0
    )
      throw new AppError("Invalid duration", 400);
    updates.durationMinutes = duration;
  }
  const service = await Service.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.tenantId },
    updates,
    { new: true, runValidators: true },
  );
  if (!service) throw new AppError("Service not found", 404);
  res.json({ service });
}

export async function deleteService(req, res) {
  const service = await Service.findOne({
    _id: req.params.id,
    tenantId: req.tenantId,
  }).lean();
  if (!service) throw new AppError("Service not found", 404);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Availability.deleteMany(
        { tenantId: req.tenantId, serviceId: service._id },
        { session },
      );
      await Appointment.updateMany(
        { tenantId: req.tenantId, serviceId: service._id, status: "CONFIRMED" },
        { $set: { status: "CANCELLED" } },
        { session },
      );
      const appointments = await Appointment.find({
        tenantId: req.tenantId,
        serviceId: service._id,
      })
        .select("_id")
        .session(session);
      if (appointments.length)
        await ReservationSlot.deleteMany(
          { appointmentId: { $in: appointments.map((a) => a._id) } },
          { session },
        );
      await Service.deleteOne(
        { _id: service._id, tenantId: req.tenantId },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  res.status(204).end();
}

export async function listAvailability(req, res) {
  const query = { tenantId: req.tenantId };
  if (req.query.serviceId) query.serviceId = req.query.serviceId;
  res.json({
    availability: await Availability.find(query)
      .populate("serviceId", "name")
      .sort({ date: 1, startTime: 1 })
      .lean(),
  });
}

export async function createAvailability(req, res) {
  const { serviceId, date, startTime, endTime } = req.body;
  if (!(await Service.exists({ _id: serviceId, tenantId: req.tenantId })))
    throw new AppError("Service not found", 404);
  validateAvailabilityItem({ date, startTime, endTime });
  try {
    const availability = await Availability.create({
      tenantId: req.tenantId,
      serviceId,
      date,
      startTime,
      endTime,
      active: true,
    });
    res.status(201).json({ availability });
  } catch (error) {
    if (error?.code === 11000)
      throw new AppError(
        "This service already has the same availability window on this date",
        409,
      );
    throw error;
  }
}

export async function deleteAvailability(req, res) {
  const a = await Availability.findOneAndDelete({
    _id: req.params.id,
    tenantId: req.tenantId,
  });
  if (!a) throw new AppError("Availability not found", 404);
  res.status(204).end();
}

export async function listAppointments(req, res) {
  const q = { tenantId: req.tenantId };
  if (req.query.status) q.status = req.query.status;
  if (req.query.date) {
    if (!DATE_RE.test(req.query.date)) throw new AppError("Invalid date", 400);
    const d = new Date(`${req.query.date}T00:00:00.000Z`);
    const e = new Date(d);
    e.setUTCDate(e.getUTCDate() + 1);
    q.startAt = { $gte: d, $lt: e };
  }
  res.json({
    appointments: await Appointment.find(q)
      .populate("serviceId", "name durationMinutes")
      .sort({ startAt: 1 }),
  });
}

export async function updateAppointment(req, res) {
  if (!STATUSES.includes(req.body.status))
    throw new AppError("Invalid appointment status", 400);
  const appointment = await Appointment.findOne({
    _id: req.params.id,
    tenantId: req.tenantId,
  });
  if (!appointment) throw new AppError("Appointment not found", 404);
  if (appointment.status === req.body.status) return res.json({ appointment });
  if (appointment.status === "CANCELLED" && req.body.status !== "CONFIRMED")
    throw new AppError("Cancelled appointments can only be reconfirmed", 400);
  if (appointment.status !== "CONFIRMED" && req.body.status === "CONFIRMED") {
    const locks = [];
    for (
      let cursor = appointment.startAt.getTime();
      cursor < appointment.endAt.getTime();
      cursor += 5 * 60000
    ) {
      locks.push({
        tenantId: appointment.tenantId,
        resourceKey: "GENERAL",
        slotAt: new Date(cursor),
        appointmentId: appointment._id,
      });
    }
    try {
      await ReservationSlot.insertMany(locks, { ordered: true });
    } catch (error) {
      if (error?.code === 11000)
        throw new AppError("The appointment time is already occupied", 409);
      throw error;
    }
  }
  appointment.status = req.body.status;
  await appointment.save();
  if (req.body.status === "CANCELLED")
    await ReservationSlot.deleteMany({ appointmentId: appointment._id });
  res.json({ appointment });
}
