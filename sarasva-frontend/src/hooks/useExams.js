import { useState, useEffect, useCallback } from "react";
import { query, where, onSnapshot, updateDoc } from "firebase/firestore";
import { userCol, userDoc } from "@/firebase/config.js";
import { useAuth } from "@/context/AuthContext.jsx";
import { examsService, enrichExam } from "@/services/exams.service.js";

/**
 * Real-time exams hook backed by Firestore onSnapshot.
 * Nested subject/chapter mutations read the current hook state,
 * compute the new subjects array, and write it back in one updateDoc call.
 */
export function useExams() {
  const { user } = useAuth();
  const [exams,   setExams]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!user) return;
    const q = query(userCol(user.id, "exams"), where("archived", "==", false));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => enrichExam({ id: d.id, ...d.data() }))
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        setExams(list);
        setLoading(false);
      },
      (err) => { setError(err.message); setLoading(false); }
    );
  }, [user]);

  const create = useCallback(async ({ name }) => {
    if (!user) return;
    try { await examsService.create(user.id, { name }); }
    catch (err) { setError(err.message); }
  }, [user]);

  const update = useCallback(async (id, patch) => {
    if (!user) return;
    try { await examsService.update(user.id, id, patch); }
    catch (err) { setError(err.message); }
  }, [user]);

  const archive = useCallback(async (id) => {
    if (!user) return;
    try { await examsService.archive(user.id, id); }
    catch (err) { setError(err.message); }
  }, [user]);

  /* ── Subject mutations (read current state → compute new array → write) ── */

  const addSubject = useCallback(async (examId, subjectId) => {
    if (!user) return;
    try {
      const exam = exams.find((e) => e.id === examId);
      if (!exam) return;
      if (exam.subjects.find((s) => s.subjectId === subjectId))
        throw new Error("Subject already added.");
      const subjects = [...exam.subjects, { subjectId, chapters: [] }];
      await updateDoc(userDoc(user.id, "exams", examId), { subjects });
    } catch (err) { setError(err.message); }
  }, [user, exams]);

  const removeSubject = useCallback(async (examId, subjectId) => {
    if (!user) return;
    try {
      const exam = exams.find((e) => e.id === examId);
      if (!exam) return;
      const subjects = exam.subjects.filter((s) => s.subjectId !== subjectId);
      await updateDoc(userDoc(user.id, "exams", examId), { subjects });
    } catch (err) { setError(err.message); }
  }, [user, exams]);

  /* ── Chapter mutations ───────────────────────────────────────────────── */

  const addChapter = useCallback(async (examId, subjectId, data) => {
    if (!user) return;
    try {
      const exam = exams.find((e) => e.id === examId);
      if (!exam) return;
      const chapter = {
        id:               crypto.randomUUID(),
        name:             data.name,
        theoryProgress:   data.theoryProgress   ?? 0,
        practiceProgress: data.practiceProgress ?? 0,
        weightage:        data.weightage        ?? 1,
      };
      const subjects = exam.subjects.map((s) =>
        s.subjectId === subjectId
          ? { ...s, chapters: [...s.chapters, chapter] }
          : s
      );
      await updateDoc(userDoc(user.id, "exams", examId), { subjects });
    } catch (err) { setError(err.message); }
  }, [user, exams]);

  const updateChapter = useCallback(async (examId, subjectId, chapterId, patch) => {
    if (!user) return;
    try {
      const exam = exams.find((e) => e.id === examId);
      if (!exam) return;
      const subjects = exam.subjects.map((s) =>
        s.subjectId === subjectId
          ? {
              ...s,
              chapters: s.chapters.map((c) =>
                c.id === chapterId ? { ...c, ...patch } : c
              ),
            }
          : s
      );
      await updateDoc(userDoc(user.id, "exams", examId), { subjects });
    } catch (err) { setError(err.message); }
  }, [user, exams]);

  const deleteChapter = useCallback(async (examId, subjectId, chapterId) => {
    if (!user) return;
    try {
      const exam = exams.find((e) => e.id === examId);
      if (!exam) return;
      const subjects = exam.subjects.map((s) =>
        s.subjectId === subjectId
          ? { ...s, chapters: s.chapters.filter((c) => c.id !== chapterId) }
          : s
      );
      await updateDoc(userDoc(user.id, "exams", examId), { subjects });
    } catch (err) { setError(err.message); }
  }, [user, exams]);

  return {
    exams, loading, error,
    create, update, archive,
    addSubject, removeSubject,
    addChapter, updateChapter, deleteChapter,
  };
}
