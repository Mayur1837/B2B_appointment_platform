import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    resourceKey: { type: String, required: true },
    slotAt: { type: Date, required: true },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
  },
  { timestamps: true },
);

schema.index({ tenantId: 1, resourceKey: 1, slotAt: 1 }, { unique: true });
schema.index({ appointmentId: 1 });

export default mongoose.model("ReservationSlot", schema);
