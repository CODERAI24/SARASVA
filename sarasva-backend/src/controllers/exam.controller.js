import Exam from "../models/Exam.js";
import Subject from "../models/Subject.js";
import ApiError from "../utils/ApiError.js";

// GET /api/v1/exams
export async function getExams(req, res, next) {
  try {
    const exams = await Exam.find({ user: req.user._id })
      .populate("subjects.subject", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: exams.length, exams });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/exams
export async function createExam(req, res, next) {
  try {
    const { name } = req.body;
    const exam = await Exam.create({ user: req.user._id, name });
    res.status(201).json({ success: true, exam });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/exams/:id
export async function updateExam(req, res, next) {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, user: req.user._id });
    if (!exam) throw new ApiError(404, "Exam not found.");

    const { name, archived } = req.body;
    if (name     !== undefined) exam.name     = name;
    if (archived !== undefined) exam.archived = archived;

    await exam.save();
    res.json({ success: true, exam });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/exams/:id
export async function deleteExam(req, res, next) {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, user: req.user._id });
    if (!exam) throw new ApiError(404, "Exam not found.");

    exam.archived = true;
    await exam.save();
    res.json({ success: true, message: "Exam archived." });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/exams/:id/subjects
// Mirrors the "Add subject to exam" form from exams.js
export async function addSubjectToExam(req, res, next) {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, user: req.user._id });
    if (!exam) throw new ApiError(404, "Exam not found.");

    const { subjectId } = req.body;

    // Verify subject belongs to user
    const subject = await Subject.findOne({ _id: subjectId, user: req.user._id });
    if (!subject) throw new ApiError(404, "Subject not found.");

    // Prevent duplicate subject in the same exam
    const alreadyAdded = exam.subjects.some(
      (s) => s.subject.toString() === subjectId
    );
    if (alreadyAdded) throw new ApiError(409, "Subject already added to this exam.");

    exam.subjects.push({ subject: subjectId, chapters: [] });
    await exam.save();

    res.status(201).json({ success: true, exam });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/exams/:id/subjects/:subjectId
export async function removeSubjectFromExam(req, res, next) {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, user: req.user._id });
    if (!exam) throw new ApiError(404, "Exam not found.");

    const originalLength = exam.subjects.length;
    exam.subjects = exam.subjects.filter(
      (s) => s.subject.toString() !== req.params.subjectId
    );
    if (exam.subjects.length === originalLength) {
      throw new ApiError(404, "Subject not found in this exam.");
    }

    await exam.save();
    res.json({ success: true, exam });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/exams/:id/subjects/:subjectId/chapters
// Mirrors the "Add chapter" form from exams.js
export async function addChapter(req, res, next) {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, user: req.user._id });
    if (!exam) throw new ApiError(404, "Exam not found.");

    const subEntry = exam.subjects.find(
      (s) => s.subject.toString() === req.params.subjectId
    );
    if (!subEntry) throw new ApiError(404, "Subject not found in this exam.");

    const { name, theoryProgress, practiceProgress, weightage } = req.body;
    subEntry.chapters.push({
      name,
      theoryProgress:   theoryProgress   ?? 0,
      practiceProgress: practiceProgress ?? 0,
      weightage:        weightage        ?? 1,
    });

    await exam.save();
    res.status(201).json({ success: true, chapters: subEntry.chapters });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/exams/:id/subjects/:subjectId/chapters/:chapterId
export async function updateChapter(req, res, next) {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, user: req.user._id });
    if (!exam) throw new ApiError(404, "Exam not found.");

    const subEntry = exam.subjects.find(
      (s) => s.subject.toString() === req.params.subjectId
    );
    if (!subEntry) throw new ApiError(404, "Subject not found in this exam.");

    const chapter = subEntry.chapters.id(req.params.chapterId);
    if (!chapter) throw new ApiError(404, "Chapter not found.");

    const { name, theoryProgress, practiceProgress, weightage } = req.body;
    if (name             !== undefined) chapter.name             = name;
    if (theoryProgress   !== undefined) chapter.theoryProgress   = theoryProgress;
    if (practiceProgress !== undefined) chapter.practiceProgress = practiceProgress;
    if (weightage        !== undefined) chapter.weightage        = weightage;

    await exam.save();
    res.json({ success: true, chapter });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/exams/:id/subjects/:subjectId/chapters/:chapterId
export async function deleteChapter(req, res, next) {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, user: req.user._id });
    if (!exam) throw new ApiError(404, "Exam not found.");

    const subEntry = exam.subjects.find(
      (s) => s.subject.toString() === req.params.subjectId
    );
    if (!subEntry) throw new ApiError(404, "Subject not found in this exam.");

    const originalLength = subEntry.chapters.length;
    subEntry.chapters = subEntry.chapters.filter(
      (c) => c._id.toString() !== req.params.chapterId
    );
    if (subEntry.chapters.length === originalLength) {
      throw new ApiError(404, "Chapter not found.");
    }

    await exam.save();
    res.json({ success: true, message: "Chapter deleted." });
  } catch (err) {
    next(err);
  }
}
