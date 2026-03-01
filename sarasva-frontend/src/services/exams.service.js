/**
 * Exams service — Firestore implementation.
 * Chapter model: { id, name, theoryDone: bool, practiceCount: number, notes: string }
 * Subject virtuals (theoryProgress, practiceProgress, overallProgress, allDone) are
 * computed from chapters on every read — nothing extra is stored in Firestore.
 */
import { addDoc, updateDoc } from "firebase/firestore";
import { userCol, userDoc } from "@/firebase/config.js";

/**
 * Normalize a chapter, handling legacy data that used
 * theoryProgress (0-100) and practiceProgress (0-100) numbers.
 */
export function withVirtuals(chapter) {
  const theoryDone    = chapter.theoryDone    ?? (typeof chapter.theoryProgress   === "number" ? chapter.theoryProgress   >= 100 : false);
  const practiceCount = chapter.practiceCount ?? (typeof chapter.practiceProgress === "number" && chapter.practiceProgress > 0 ? 1 : 0);
  return { ...chapter, theoryDone, practiceCount };
}

/** Enrich an exam: normalize chapters and compute subject-level virtual fields. */
export function enrichExam(exam) {
  const subjects = (exam.subjects ?? []).map((s) => {
    const chapters         = (s.chapters ?? []).map(withVirtuals);
    const total            = chapters.length;
    const theoryProgress   = total === 0 ? 0 : Math.round(chapters.filter((c) => c.theoryDone).length / total * 100);
    const practiceProgress = total === 0 ? 0 : Math.round(chapters.filter((c) => (c.practiceCount ?? 0) > 0).length / total * 100);
    const overallProgress  = Math.round((theoryProgress + practiceProgress) / 2);
    const allDone          = total > 0 && theoryProgress === 100 && practiceProgress === 100;
    return { ...s, chapters, theoryProgress, practiceProgress, overallProgress, allDone };
  });
  return { ...exam, subjects };
}

export const examsService = {
  async create(uid, { name, examDate }) {
    const ref = await addDoc(userCol(uid, "exams"), {
      name,
      examDate:  examDate ?? null,
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
