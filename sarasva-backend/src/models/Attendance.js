import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";

const VALID_STATUSES = ["present", "absent", "cancelled", "extra"];

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    // Stored as "YYYY-MM-DD" string to avoid UTC timezone drift.
    // A student in IST (+5:30) calling today() gets the correct local date.
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format"],
    },
    status: {
      type: String,
      enum: VALID_STATUSES,
      required: true,
    },
    locked: { type: Boolean, default: true }, // immutable once created
  },
  { timestamps: true }
);

// Database-level constraint: one record per (user, subject, date)
attendanceSchema.index(
  { user: 1, subject: 1, date: 1 },
  { unique: true }
);

// Fast range queries: attendance log for a user across a date range
attendanceSchema.index({ user: 1, date: 1 });

// DB-side mirror of canEditAttendance() from attendanceRules.js.
// status cannot be changed after creation.
attendanceSchema.pre("save", function (next) {
  if (!this.isNew && this.isModified("status")) {
    return next(new ApiError(403, "Attendance records are locked and cannot be edited."));
  }
  next();
});

export default mongoose.model("Attendance", attendanceSchema);
