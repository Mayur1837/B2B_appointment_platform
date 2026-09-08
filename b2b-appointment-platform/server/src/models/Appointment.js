import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    customerName: { type: String, required: true, trim: true },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    customerPhone: { type: String, trim: true },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"],
      default: "CONFIRMED",
    },
    cancelToken: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true },
);
schema.index({ tenantId: 1, startAt: 1, endAt: 1, status: 1 });
schema.index({ customerId: 1, startAt: -1 });
export default mongoose.model("Appointment", schema);
