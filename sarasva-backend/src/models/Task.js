import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    dueDate:     { type: Date, default: null },
    priority:    {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    completed: { type: Boolean, default: false },
    archived:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Fast filtered list queries
taskSchema.index({ user: 1, completed: 1, archived: 1 });

export default mongoose.model("Task", taskSchema);
