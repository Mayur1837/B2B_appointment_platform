import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Business from "../models/Business.js";
import User from "../models/User.js";
import Service from "../models/Service.js";
import Availability from "../models/Availability.js";
import Appointment from "../models/Appointment.js";
import ReservationSlot from "../models/ReservationSlot.js";
import { AppError } from "../utils/AppError.js";
const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
export async function listBusinesses(req, res) {
  res.json({ businesses: await Business.find().sort({ createdAt: -1 }) });
}
export async function createBusiness(req, res) {
  const { name, email, phone, timezone, adminName, adminEmail, adminPassword } = req.body;

  if (!name?.trim()) throw new AppError("Business name is required", 400);
  if (!adminName?.trim()) throw new AppError("Admin name is required", 400);
  if (!adminEmail?.trim() || !/^\S+@\S+\.\S+$/.test(adminEmail))
    throw new AppError("A valid admin email is required", 400);
  if (!adminPassword || adminPassword.length < 8)
    throw new AppError("Admin password must be at least 8 characters", 400);

  const normalizedAdminEmail = adminEmail.trim().toLowerCase();
  if (await User.exists({ email: normalizedAdminEmail }))
    throw new AppError("An account with this admin email already exists", 409);

  let slug = slugify(name),
    base = slug,
    i = 1;
  while (await Business.exists({ slug })) slug = `${base}-${i++}`;

  const session = await mongoose.startSession();
  let business;
  try {
    await session.withTransaction(async () => {
      const [createdBusiness] = await Business.create(
        [{ name: name.trim(), email, phone, timezone, slug }],
        { session },
      );
      business = createdBusiness;

      await User.create(
        [{
          name: adminName.trim(),
          email: normalizedAdminEmail,
          passwordHash: await bcrypt.hash(adminPassword, 12),
          role: "BUSINESS_ADMIN",
          tenantId: business._id,
          isActive: true,
        }],
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  res.status(201).json({ business, adminCreated: true });
}
export async function deleteBusiness(req, res) {
  const business = await Business.findById(req.params.id);
  if (!business) throw new AppError("Business not found", 404);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const appointments = await Appointment.find({ tenantId: business._id })
        .select("_id")
        .session(session);
      if (appointments.length)
        await ReservationSlot.deleteMany(
          { appointmentId: { $in: appointments.map((a) => a._id) } },
          { session },
        );
      await Appointment.deleteMany({ tenantId: business._id }, { session });
      await Availability.deleteMany({ tenantId: business._id }, { session });
      await Service.deleteMany({ tenantId: business._id }, { session });
      await User.deleteMany({ tenantId: business._id }, { session });
      await Business.deleteOne({ _id: business._id }, { session });
    });
  } finally {
    await session.endSession();
  }
  res.status(204).end();
}

export async function setBusinessStatus(req, res) {
  const b = await Business.findById(req.params.id);
  if (!b) throw new AppError("Business not found", 404);
  b.status = req.body.status;
  await b.save();
  if (b.status === "DISABLED")
    await User.updateMany({ tenantId: b._id }, { $set: { isActive: false } });
  else
    await User.updateMany(
      { tenantId: b._id, role: "BUSINESS_ADMIN" },
      { $set: { isActive: true } },
    );
  res.json({ business: b });
}
export async function getBusiness(req, res) {
  const b = await Business.findById(req.params.id);
  if (!b) throw new AppError("Business not found", 404);
  res.json({ business: b });
}
