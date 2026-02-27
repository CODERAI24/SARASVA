import Subject from "../models/Subject.js";
import ApiError from "../utils/ApiError.js";

// GET /api/v1/subjects?archived=false
export async function getSubjects(req, res, next) {
  try {
    const filter = { user: req.user._id };

    if (req.query.archived !== undefined) {
      filter.archived = req.query.archived === "true";
    }

    const subjects = await Subject.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: subjects.length, subjects });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/subjects
export async function createSubject(req, res, next) {
  try {
    const { name } = req.body;
    const subject = await Subject.create({ user: req.user._id, name });
    res.status(201).json({ success: true, subject });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/subjects/:id
export async function updateSubject(req, res, next) {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });
    if (!subject) throw new ApiError(404, "Subject not found.");

    const { name, archived } = req.body;
    if (name     !== undefined) subject.name     = name;
    if (archived !== undefined) subject.archived = archived;

    await subject.save();
    res.json({ success: true, subject });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/subjects/:id  (soft delete)
export async function deleteSubject(req, res, next) {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });
    if (!subject) throw new ApiError(404, "Subject not found.");

    subject.archived = true;
    await subject.save();
    res.json({ success: true, message: "Subject archived." });
  } catch (err) {
    next(err);
  }
}
