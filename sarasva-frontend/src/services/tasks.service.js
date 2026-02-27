/**
 * Tasks service — Firestore implementation.
 */
import { addDoc, updateDoc } from "firebase/firestore";
import { userCol, userDoc } from "@/firebase/config.js";

export const tasksService = {
  async create(uid, { title, description = "", dueDate = null, priority = "medium" }) {
    const ref = await addDoc(userCol(uid, "tasks"), {
      title,
      description,
      dueDate,
      priority,
      completed: false,
      archived:  false,
      subtasks:  [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return ref.id;
  },

  async update(uid, id, patch) {
    await updateDoc(userDoc(uid, "tasks", id), {
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  },

  async archive(uid, id) {
    await updateDoc(userDoc(uid, "tasks", id), {
      archived:  true,
      updatedAt: new Date().toISOString(),
    });
  },

  async addSubtask(uid, taskId, existingSubtasks, title) {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const subtasks = [...(existingSubtasks || []), { id, title, completed: false }];
    await updateDoc(userDoc(uid, "tasks", taskId), {
      subtasks,
      updatedAt: new Date().toISOString(),
    });
  },

  async toggleSubtask(uid, taskId, existingSubtasks, subtaskId) {
    const subtasks = (existingSubtasks || []).map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    await updateDoc(userDoc(uid, "tasks", taskId), {
      subtasks,
      updatedAt: new Date().toISOString(),
    });
  },

  async deleteSubtask(uid, taskId, existingSubtasks, subtaskId) {
    const subtasks = (existingSubtasks || []).filter((s) => s.id !== subtaskId);
    await updateDoc(userDoc(uid, "tasks", taskId), {
      subtasks,
      updatedAt: new Date().toISOString(),
    });
  },
};
