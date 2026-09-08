import { Router } from "express";
import {
  listPublicBusinesses,
  getPublicBusiness,
  slots,
  createAppointment,
  listCustomerAppointments,
  cancelCustomerAppointmentById,
  getCustomerAppointment,
  cancelCustomerAppointment,
} from "../controllers/publicController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
const r = Router();
r.get("/businesses", asyncHandler(listPublicBusinesses));
r.get("/businesses/:slug", asyncHandler(getPublicBusiness));
r.get("/businesses/:slug/slots", asyncHandler(slots));
r.post(
  "/businesses/:slug/appointments",
  requireAuth,
  requireRole("CUSTOMER"),
  asyncHandler(createAppointment),
);
r.get(
  "/customer/appointments",
  requireAuth,
  requireRole("CUSTOMER"),
  asyncHandler(listCustomerAppointments),
);
r.post(
  "/customer/appointments/:id/cancel",
  requireAuth,
  requireRole("CUSTOMER"),
  asyncHandler(cancelCustomerAppointmentById),
);
r.get("/appointments/:token", asyncHandler(getCustomerAppointment));
r.post("/appointments/:token/cancel", asyncHandler(cancelCustomerAppointment));
export default r;
