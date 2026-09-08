import { Router } from "express";
import {
  createBusiness,
  getBusiness,
  listBusinesses,
  setBusinessStatus,
  deleteBusiness,
} from "../controllers/ownerController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const r = Router();
r.use(requireAuth, requireRole("SYSTEM_OWNER"));
r.get("/", asyncHandler(listBusinesses));
r.post("/", asyncHandler(createBusiness));
r.get("/:id", asyncHandler(getBusiness));
r.patch("/:id/status", asyncHandler(setBusinessStatus));
r.delete("/:id", asyncHandler(deleteBusiness));
export default r;
