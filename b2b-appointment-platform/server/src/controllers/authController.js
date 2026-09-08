import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";

function issueAuth(u) {
  return {
    token: signToken({
      sub: u._id.toString(),
      role: u.role,
      tenantId: u.tenantId?.toString() || null,
    }),
    user: {
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      tenantId: u.tenantId,
    },
  };
}

export async function login(req, res) {
  const { email, password } = req.body;
  const u = await User.findOne({
    email: String(email || "")
      .trim()
      .toLowerCase(),
  });
  if (!u || !u.isActive || !(await bcrypt.compare(password, u.passwordHash)))
    throw new AppError("Invalid credentials", 401);
  res.json(issueAuth(u));
}

export async function registerCustomer(req, res) {
  const { name, email, password } = req.body;
  if (!name?.trim() || name.trim().length < 2)
    throw new AppError("Name is required", 400);
  if (!/^\S+@\S+\.\S+$/.test(email || ""))
    throw new AppError("A valid email is required", 400);
  if (!password || password.length < 8)
    throw new AppError("Password must be at least 8 characters", 400);
  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail }))
    throw new AppError("An account with this email already exists", 409);
  const passwordHash = await bcrypt.hash(password, 12);
  const u = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: "CUSTOMER",
    tenantId: null,
    isActive: true,
  });
  res.status(201).json(issueAuth(u));
}

export async function me(req, res) {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      tenantId: req.user.tenantId,
    },
  });
}
