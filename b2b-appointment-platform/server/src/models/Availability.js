// import mongoose from "mongoose";

// const schema = new mongoose.Schema(
//   {
//     tenantId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Business",
//       required: true,
//       index: true,
//     },
//     serviceId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Service",
//       required: true,
//       index: true,
//     },
//     date: {
//       type: String,
//       required: true,
//       match: /^\d{4}-\d{2}-\d{2}$/,
//       index: true,
//     },
//     startTime: {
//       type: String,
//       required: true,
//       match: /^([01]\d|2[0-3]):[0-5]\d$/,
//     },
//     endTime: {
//       type: String,
//       required: true,
//       match: /^([01]\d|2[0-3]):[0-5]\d$/,
//     },
//     active: { type: Boolean, default: true },
//   },
//   { timestamps: true },
// );

// schema.index(
//   { tenantId: 1, serviceId: 1, date: 1, startTime: 1 },
//   { unique: true },
// );

// export default mongoose.model("Availability", schema);
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
      index: true,
    },

    mode: {
      type: String,
      enum: ["DATE", "WEEKLY"],
      default: "DATE",
      required: true,
      index: true,
    },

    date: {
      type: String,
      match: /^\d{4}-\d{2}-\d{2}$/,
      default: null,
      index: true,
      required: function () {
        return this.mode === "DATE";
      },
    },

    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      default: null,
      required: function () {
        return this.mode === "WEEKLY";
      },
    },

    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },

    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

schema.index(
  { tenantId: 1, serviceId: 1, date: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: { mode: "DATE" },
  },
);

schema.index(
  { tenantId: 1, serviceId: 1, dayOfWeek: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: { mode: "WEEKLY" },
  },
);

export default mongoose.model("Availability", schema);
