import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema(
  {
    name:             { type: String, required: true, trim: true },
    theoryProgress:   { type: Number, default: 0, min: 0, max: 100 },
    practiceProgress: { type: Number, default: 0, min: 0, max: 100 },
    weightage:        { type: Number, default: 1, min: 0 },
  },
  { _id: true }
);

// Virtual: priorityScore — migrated from exams.js priorityScore().
// Depends only on the chapter's own fields, correct home for this logic.
chapterSchema.virtual("priorityScore").get(function () {
  const completion = (this.theoryProgress + this.practiceProgress) / 2;
  return Math.round((100 - completion) * this.weightage);
});

// Virtual: overallProgress — migrated from exams.js overallProgress().
chapterSchema.virtual("overallProgress").get(function () {
  return Math.round((this.theoryProgress + this.practiceProgress) / 2);
});

// Expose virtuals when the API serializes to JSON
chapterSchema.set("toJSON", { virtuals: true });

const examSubjectSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    chapters: { type: [chapterSchema], default: [] },
  },
  { _id: false }
);

const examSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name:     { type: String, required: true, trim: true },
    archived: { type: Boolean, default: false },
    subjects: { type: [examSubjectSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Exam", examSchema);
