import bcrypt from "bcryptjs";
import { connectDb } from "./config/db.js";
import User from "./models/User.js";
await connectDb();
const email = "owner@example.com";
if (!(await User.exists({ email }))) {
  await User.create({
    name: "Platform Owner",
    email,
    passwordHash: await bcrypt.hash("Owner@12345", 12),
    role: "SYSTEM_OWNER",
  });
  console.log("Seeded owner: owner@example.com / Owner@12345");
} else console.log("Owner already exists");
process.exit(0);
