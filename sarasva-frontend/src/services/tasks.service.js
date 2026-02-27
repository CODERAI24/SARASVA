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
};
