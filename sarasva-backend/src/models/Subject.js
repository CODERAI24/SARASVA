import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name:     { type: String, required: true, trim: true },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Fast lookup: all active subjects for a user
subjectSchema.index({ user: 1, archived: 1 });

export default mongoose.model("Subject", subjectSchema);
