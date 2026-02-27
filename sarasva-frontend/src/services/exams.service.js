/**
 * Exams service — Firestore implementation.
 * Each exam is one Firestore doc with nested subjects + chapters arrays.
 * withVirtuals and enrichExam are pure functions consumed by the hook.
 */
import { addDoc, updateDoc } from "firebase/firestore";
import { userCol, userDoc } from "@/firebase/config.js";

/** Mirrors chapterSchema virtuals (priorityScore, overallProgress). */
export function withVirtuals(chapter) {
  const overall  = Math.round((chapter.theoryProgress + chapter.practiceProgress) / 2);
  const priority = Math.round((100 - overall) * chapter.weightage);
  return { ...chapter, overallProgress: overall, priorityScore: priority };
}

export function enrichExam(exam) {
  return {
    ...exam,
    subjects: (exam.subjects ?? []).map((s) => ({
      ...s,
      chapters: (s.chapters ?? []).map(withVirtuals),
    })),
  };
}

export const examsService = {
  async create(uid, { name }) {
    const ref = await addDoc(userCol(uid, "exams"), {
      name,
      archived:  false,
      subjects:  [],
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  },

  async update(uid, id, patch) {
    await updateDoc(userDoc(uid, "exams", id), patch);
  },

  async archive(uid, id) {
    await updateDoc(userDoc(uid, "exams", id), { archived: true });
  },
};
