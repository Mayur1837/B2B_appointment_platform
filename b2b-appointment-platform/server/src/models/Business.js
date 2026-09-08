import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    timezone: { type: String, default: "Asia/Kolkata" },
    status: { type: String, enum: ["ACTIVE", "DISABLED"], default: "ACTIVE" },
    slug: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true },
);
export default mongoose.model("Business", schema);
