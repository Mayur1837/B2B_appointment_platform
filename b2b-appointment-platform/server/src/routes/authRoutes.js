import { Router } from "express";
import { login, registerCustomer, me } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const r = Router();
r.post("/login", asyncHandler(login));
r.post("/customer/register", asyncHandler(registerCustomer));
r.get("/me", requireAuth, asyncHandler(me));
export default r;
