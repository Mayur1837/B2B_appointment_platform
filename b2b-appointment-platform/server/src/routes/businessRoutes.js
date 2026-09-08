import { Router } from "express";
import {
  getProfile,
  updateProfile,
  listServices,
  createService,
  updateService,
  deleteService,
  listAvailability,
  createAvailability,
  deleteAvailability,
  listAppointments,
  updateAppointment,
} from "../controllers/businessController.js";
import { requireAuth, requireRole, tenantOnly } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const r = Router();
r.use(requireAuth, requireRole("BUSINESS_ADMIN"), tenantOnly);
r.get("/profile", asyncHandler(getProfile));
r.patch("/profile", asyncHandler(updateProfile));
r.get("/services", asyncHandler(listServices));
r.post("/services", asyncHandler(createService));
r.patch("/services/:id", asyncHandler(updateService));
r.delete("/services/:id", asyncHandler(deleteService));
r.get("/availability", asyncHandler(listAvailability));
r.post("/availability", asyncHandler(createAvailability));
r.delete("/availability/:id", asyncHandler(deleteAvailability));
r.get("/appointments", asyncHandler(listAppointments));
r.patch("/appointments/:id", asyncHandler(updateAppointment));
export default r;
