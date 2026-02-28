/**
 * Subjects service — Firestore implementation.
 * Chapters are stored as a `chapters: []` array inside the subject doc.
 */
import { addDoc, updateDoc, getDoc } from "firebase/firestore";
import { userCol, userDoc } from "@/firebase/config.js";

export const subjectsService = {
  async create(uid, { name }) {
    const ref = await addDoc(userCol(uid, "subjects"), {
      name,
      archived:  false,
      chapters:  [],
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

  /** Add a chapter to a subject. Returns updated chapters array. */
  async addChapter(uid, subjectId, name, currentChapters) {
    const chapter = { id: crypto.randomUUID(), name: name.trim() };
    const chapters = [...currentChapters, chapter];
    await updateDoc(userDoc(uid, "subjects", subjectId), { chapters });
    return chapters;
  },

  /** Rename a chapter. */
  async updateChapter(uid, subjectId, chapterId, name, currentChapters) {
    const chapters = currentChapters.map((c) =>
      c.id === chapterId ? { ...c, name: name.trim() } : c
    );
    await updateDoc(userDoc(uid, "subjects", subjectId), { chapters });
  },

  /** Delete a chapter. */
  async deleteChapter(uid, subjectId, chapterId, currentChapters) {
    const chapters = currentChapters.filter((c) => c.id !== chapterId);
    await updateDoc(userDoc(uid, "subjects", subjectId), { chapters });
  },
};
