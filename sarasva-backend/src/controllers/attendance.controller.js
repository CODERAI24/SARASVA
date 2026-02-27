import Attendance from "../models/Attendance.js";
import Timetable from "../models/Timetable.js";
import Subject from "../models/Subject.js";
import ApiError from "../utils/ApiError.js";
import {
  buildAttendanceSummary,
  todayString,
} from "../utils/attendanceUtils.js";

const DAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];

/**
 * GET /api/v1/attendance/today
 * Returns subjects scheduled today (from the active timetable) and
 * whether attendance has already been marked for each.
 * Mirrors subjectsScheduledToday() + the today-marking logic from attendance.js.
 */
export async function getToday(req, res, next) {
  try {
    const userId  = req.user._id;
    const date    = todayString();
    const dayName = DAYS[new Date().getDay()];

    // Find the active timetable for this user
    const activeTT = await Timetable.findOne({ user: userId, active: true })
      .populate("slots.subject", "name archived");

    // Determine which subjects are scheduled today
    let scheduledSubjectIds;
    if (activeTT) {
      scheduledSubjectIds = activeTT.slots
        .filter((s) => s.day === dayName && !s.subject.archived)
        .map((s) => s.subject._id.toString());
    } else {
      // No active timetable: fall back to all active subjects (original app behavior)
      const allActive = await Subject.find({ user: userId, archived: false });
      scheduledSubjectIds = allActive.map((s) => s._id.toString());
    }

    // Fetch today's attendance records for those subjects
    const records = await Attendance.find({
      user:    userId,
      date,
      subject: { $in: scheduledSubjectIds },
    }).populate("subject", "name");

    const markedMap = {};
    records.forEach((r) => {
      markedMap[r.subject._id.toString()] = r.status;
    });

    const subjects = await Subject.find({
      _id:      { $in: scheduledSubjectIds },
      archived: false,
    });

    const today = subjects.map((s) => ({
      subject:       { id: s._id, name: s.name },
      markedStatus:  markedMap[s._id.toString()] || null,
      alreadyMarked: !!markedMap[s._id.toString()],
    }));

    res.json({ success: true, date, day: dayName, today });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/attendance/mark
 * Body: { subjectId, status, date? }
 * Marks attendance for a subject. Immutable once created (unique index + pre-save lock).
 */
export async function markAttendance(req, res, next) {
  try {
    const { subjectId, status, date } = req.body;
    const userId = req.user._id;
    const attendanceDate = date || todayString();

    // Verify subject belongs to this user
    const subject = await Subject.findOne({ _id: subjectId, user: userId });
    if (!subject) throw new ApiError(404, "Subject not found.");

    const record = await Attendance.create({
      user:    userId,
      subject: subjectId,
      date:    attendanceDate,
      status,
      locked:  true,
    });

    res.status(201).json({ success: true, record });
  } catch (err) {
    // Duplicate key = already marked for this (user, subject, date)
    if (err.code === 11000) {
      return next(new ApiError(409, "Attendance already marked for this subject today."));
    }
    next(err);
  }
}

/**
 * GET /api/v1/attendance/summary
 * Returns per-subject stats including zone and classesNeededFor75.
 * Mirrors the "Attendance Intelligence" panel from the original UI.
 */
export async function getSummary(req, res, next) {
  try {
    const userId = req.user._id;
    const subjects = await Subject.find({ user: userId, archived: false });

    const summaries = await Promise.all(
      subjects.map(async (s) => {
        const records = await Attendance.find({ user: userId, subject: s._id });
        const summary = buildAttendanceSummary(records);
        return { subject: { id: s._id, name: s.name }, ...summary };
      })
    );

    // Overall stats across all records
    const allRecords = await Attendance.find({ user: userId });
    const overall = buildAttendanceSummary(allRecords);

    res.json({ success: true, overall, subjects: summaries });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/attendance?subjectId=&from=&to=
 * Paginated attendance log with optional filters.
 */
export async function getAttendanceLog(req, res, next) {
  try {
    const { subjectId, from, to } = req.query;
    const filter = { user: req.user._id };

    if (subjectId) filter.subject = subjectId;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to)   filter.date.$lte = to;
    }

    const records = await Attendance.find(filter)
      .populate("subject", "name")
      .sort({ date: -1 });

    res.json({ success: true, count: records.length, records });
  } catch (err) {
    next(err);
  }
}
