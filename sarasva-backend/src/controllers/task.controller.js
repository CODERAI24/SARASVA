import Task from "../models/Task.js";
import ApiError from "../utils/ApiError.js";

// GET /api/v1/tasks?completed=&archived=&priority=
export async function getTasks(req, res, next) {
  try {
    const filter = { user: req.user._id };

    if (req.query.completed !== undefined) {
      filter.completed = req.query.completed === "true";
    }
    if (req.query.archived !== undefined) {
      filter.archived = req.query.archived === "true";
    }
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/tasks
export async function createTask(req, res, next) {
  try {
    const { title, description, dueDate, priority } = req.body;
    const task = await Task.create({
      user: req.user._id,
      title,
      description: description || "",
      dueDate:     dueDate     || null,
      priority:    priority    || "medium",
    });
    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/tasks/:id
export async function updateTask(req, res, next) {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) throw new ApiError(404, "Task not found.");

    const { title, description, dueDate, priority, completed, archived } = req.body;
    if (title       !== undefined) task.title       = title;
    if (description !== undefined) task.description = description;
    if (dueDate     !== undefined) task.dueDate     = dueDate;
    if (priority    !== undefined) task.priority    = priority;
    if (completed   !== undefined) task.completed   = completed;
    if (archived    !== undefined) task.archived    = archived;

    await task.save();
    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/tasks/:id  (soft delete)
export async function deleteTask(req, res, next) {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) throw new ApiError(404, "Task not found.");

    task.archived = true;
    await task.save();
    res.json({ success: true, message: "Task archived." });
  } catch (err) {
    next(err);
  }
}
