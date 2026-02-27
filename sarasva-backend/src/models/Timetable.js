import mongoose from "mongoose";

const VALID_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const slotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: VALID_DAYS,
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, "startTime must be in HH:mm format"],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, "endTime must be in HH:mm format"],
    },
  },
  { _id: true } // keep _id so individual slots can be deleted
);

const timetableSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name:     { type: String, required: true, trim: true },
    active:   { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    slots:    { type: [slotSchema], default: [] },
  },
  { timestamps: true }
);

// Mirror of setActiveTimetable() from timetableRules.js.
// When this timetable is set active, deactivate all others for the same user.
timetableSchema.pre("save", async function (next) {
  if (this.isModified("active") && this.active === true) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { $set: { active: false } }
    );
  }
  next();
});

// Archiving a timetable must also deactivate it (mirrors archiveTimetable rule)
timetableSchema.pre("save", function (next) {
  if (this.isModified("archived") && this.archived === true) {
    this.active = false;
  }
  next();
});

timetableSchema.index({ user: 1, active: 1 });

export default mongoose.model("Timetable", timetableSchema);
