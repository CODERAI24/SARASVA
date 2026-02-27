/**
 * Subjects service — Firestore implementation.
 */
import { addDoc, updateDoc } from "firebase/firestore";
import { userCol, userDoc } from "@/firebase/config.js";

export const subjectsService = {
  async create(uid, { name }) {
    const ref = await addDoc(userCol(uid, "subjects"), {
      name,
      archived:  false,
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  },

  async update(uid, id, patch) {
    await updateDoc(userDoc(uid, "subjects", id), patch);
  },

  async archive(uid, id) {
    await updateDoc(userDoc(uid, "subjects", id), { archived: true });
  },
};
