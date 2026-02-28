import { useState, useEffect, useCallback } from "react";
import { onSnapshot, updateDoc } from "firebase/firestore";
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
    return onSnapshot(
      userCol(user.id, "exams"),
      (snap) => {
        const list = snap.docs
          .map((d) => enrichExam({ id: d.id, ...d.data() }))
          .filter((e) => e.archived !== true)
          .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
        setExams(list);
        setLoading(false);
      },
      (err) => { setError(err.message); setLoading(false); }
    );
  }, [user]);

  const create = useCallback(async ({ name, examDate }) => {
    if (!user) return;
    try { await examsService.create(user.id, { name, examDate }); }
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

  /** Add a subject. Pass initialChapters[] (from subject doc) to pre-populate. */
  const addSubject = useCallback(async (examId, subjectId, initialChapters = []) => {
    if (!user) return;
    try {
      const exam = exams.find((e) => e.id === examId);
      if (!exam) return;
      if (exam.subjects.find((s) => s.subjectId === subjectId))
        throw new Error("Subject already added.");
      // Convert subject chapters (name only) → exam chapters with progress fields
      const chapters = initialChapters.map((c) => ({
        id:               c.id,
        name:             c.name,
        theoryProgress:   0,
        practiceProgress: 0,
        weightage:        1,
      }));
      const subjects = [...exam.subjects, { subjectId, chapters, dueDate: null }];
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

  /** Move a subject up or down in the list. */
  const moveSubject = useCallback(async (examId, subjectId, direction) => {
    if (!user) return;
    try {
      const exam = exams.find((e) => e.id === examId);
      if (!exam) return;
      const idx = exam.subjects.findIndex((s) => s.subjectId === subjectId);
      if (idx < 0) return;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= exam.subjects.length) return;
      const subjects = [...exam.subjects];
      [subjects[idx], subjects[newIdx]] = [subjects[newIdx], subjects[idx]];
      await updateDoc(userDoc(user.id, "exams", examId), { subjects });
    } catch (err) { setError(err.message); }
  }, [user, exams]);

  /** Set or clear a due date for a subject within an exam. */
  const setSubjectDueDate = useCallback(async (examId, subjectId, dueDate) => {
    if (!user) return;
    try {
      const exam = exams.find((e) => e.id === examId);
      if (!exam) return;
      const subjects = exam.subjects.map((s) =>
        s.subjectId === subjectId ? { ...s, dueDate: dueDate || null } : s
      );
      await updateDoc(userDoc(user.id, "exams", examId), { subjects });
    } catch (err) { setError(err.message); }
  }, [user, exams]);

  return {
    exams, loading, error,
    create, update, archive,
    addSubject, removeSubject, moveSubject, setSubjectDueDate,
    addChapter, updateChapter, deleteChapter,
  };
}
