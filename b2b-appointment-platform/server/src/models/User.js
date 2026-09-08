import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["SYSTEM_OWNER", "BUSINESS_ADMIN", "CUSTOMER"],
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      default: null,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
schema.index({ email: 1, tenantId: 1 }, { unique: true });
export default mongoose.model("User", schema);
