import User from "../models/User.js";
import { verifyToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";

export async function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  if (!h.startsWith("Bearer "))
    return next(new AppError("Authentication required", 401));
  try {
    const p = verifyToken(h.slice(7));
    const u = await User.findById(p.sub);
    if (!u || !u.isActive)
      throw new AppError("Account is inactive or missing", 401);
    req.user = u;
    next();
  } catch (e) {
    next(
      e instanceof AppError ? e : new AppError("Invalid or expired token", 401),
    );
  }
}
export const requireRole =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user.role)
      ? next()
      : next(new AppError("Forbidden", 403));
export function tenantOnly(req, res, next) {
  if (req.user.role === "SYSTEM_OWNER") return next();
  if (!req.user.tenantId) return next(new AppError("Tenant missing", 403));
  req.tenantId = req.user.tenantId.toString();
  next();
}
