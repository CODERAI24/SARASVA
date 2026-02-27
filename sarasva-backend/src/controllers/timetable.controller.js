import Timetable from "../models/Timetable.js";
import ApiError from "../utils/ApiError.js";

// GET /api/v1/timetables
export async function getTimetables(req, res, next) {
  try {
    const timetables = await Timetable.find({ user: req.user._id })
      .populate("slots.subject", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: timetables.length, timetables });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/timetables
export async function createTimetable(req, res, next) {
  try {
    const { name, slots } = req.body;
    const timetable = await Timetable.create({
      user: req.user._id,
      name,
      slots: slots || [],
    });
    res.status(201).json({ success: true, timetable });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/timetables/:id
export async function getTimetable(req, res, next) {
  try {
    const timetable = await Timetable.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("slots.subject", "name");

    if (!timetable) throw new ApiError(404, "Timetable not found.");
    res.json({ success: true, timetable });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/timetables/:id
export async function updateTimetable(req, res, next) {
  try {
    const timetable = await Timetable.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!timetable) throw new ApiError(404, "Timetable not found.");

    const { name, archived } = req.body;
    if (name     !== undefined) timetable.name     = name;
    if (archived !== undefined) timetable.archived = archived;
    // Archiving sets active:false via the pre-save hook in the model.

    await timetable.save();
    res.json({ success: true, timetable });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/timetables/:id
export async function deleteTimetable(req, res, next) {
  try {
    const timetable = await Timetable.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!timetable) throw new ApiError(404, "Timetable not found.");

    timetable.archived = true; // soft delete
    await timetable.save();
    res.json({ success: true, message: "Timetable archived." });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/timetables/:id/activate
// The model's pre-save hook deactivates all other timetables for this user.
export async function activateTimetable(req, res, next) {
  try {
    const timetable = await Timetable.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!timetable) throw new ApiError(404, "Timetable not found.");
    if (timetable.archived) throw new ApiError(400, "Cannot activate an archived timetable.");

    timetable.active = true;
    await timetable.save();
    res.json({ success: true, timetable });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/timetables/:id/slots
export async function addSlot(req, res, next) {
  try {
    const timetable = await Timetable.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!timetable) throw new ApiError(404, "Timetable not found.");

    const { day, subject, startTime, endTime } = req.body;
    timetable.slots.push({ day, subject, startTime, endTime });
    await timetable.save();

    res.status(201).json({ success: true, slots: timetable.slots });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/timetables/:id/slots/:slotId
export async function deleteSlot(req, res, next) {
  try {
    const timetable = await Timetable.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!timetable) throw new ApiError(404, "Timetable not found.");

    const originalLength = timetable.slots.length;
    timetable.slots = timetable.slots.filter(
      (s) => s._id.toString() !== req.params.slotId
    );

    if (timetable.slots.length === originalLength) {
      throw new ApiError(404, "Slot not found.");
    }

    await timetable.save();
    res.json({ success: true, slots: timetable.slots });
  } catch (err) {
    next(err);
  }
}
