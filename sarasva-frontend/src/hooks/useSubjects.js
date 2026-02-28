import { useState, useEffect, useCallback } from "react";
import { onSnapshot, addDoc, updateDoc } from "firebase/firestore";
import { userCol, userDoc } from "@/firebase/config.js";
import { useAuth } from "@/context/AuthContext.jsx";

/**
 * Real-time subjects hook backed by Firestore onSnapshot.
 * Page components are unchanged — same return shape as the localStorage version.
 */
export function useSubjects({ archived = false } = {}) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      userCol(user.id, "subjects"),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s) => archived ? s.archived === true : s.archived !== true)
          .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
        setSubjects(list);
        setLoading(false);
      },
      (err) => { setError(err.message); setLoading(false); }
    );
    return unsub;
  }, [user, archived]);

  const create = useCallback(async (name) => {
    if (!user) return;
    try {
      await addDoc(userCol(user.id, "subjects"), {
        name,
        archived:  false,
        chapters:  [],
        createdAt: new Date().toISOString(),
      });
    } catch (err) { setError(err.message); }
  }, [user]);

  const update = useCallback(async (id, patch) => {
    if (!user) return;
    try { await updateDoc(userDoc(user.id, "subjects", id), patch); }
    catch (err) { setError(err.message); }
  }, [user]);

  const archive = useCallback(async (id) => {
    await update(id, { archived: true });
  }, [update]);

  const addChapter = useCallback(async (subjectId, name) => {
    if (!user) return;
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    const chapter = { id: crypto.randomUUID(), name: name.trim() };
    const chapters = [...(subject.chapters ?? []), chapter];
    try { await updateDoc(userDoc(user.id, "subjects", subjectId), { chapters }); }
    catch (err) { setError(err.message); }
  }, [user, subjects]);

  const updateChapter = useCallback(async (subjectId, chapterId, name) => {
    if (!user) return;
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    const chapters = (subject.chapters ?? []).map((c) =>
      c.id === chapterId ? { ...c, name: name.trim() } : c
    );
    try { await updateDoc(userDoc(user.id, "subjects", subjectId), { chapters }); }
    catch (err) { setError(err.message); }
  }, [user, subjects]);

  const deleteChapter = useCallback(async (subjectId, chapterId) => {
    if (!user) return;
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    const chapters = (subject.chapters ?? []).filter((c) => c.id !== chapterId);
    try { await updateDoc(userDoc(user.id, "subjects", subjectId), { chapters }); }
    catch (err) { setError(err.message); }
  }, [user, subjects]);

  /** Import a shared subject (from P2P) into the user's own subject list. */
  const importSubject = useCallback(async ({ name, chapters = [] }) => {
    if (!user) return;
    try {
      await addDoc(userCol(user.id, "subjects"), {
        name,
        archived:  false,
        chapters:  chapters.map((c) => ({ id: crypto.randomUUID(), name: c.name })),
        createdAt: new Date().toISOString(),
      });
    } catch (err) { setError(err.message); }
  }, [user]);

  // refresh is a no-op — onSnapshot keeps the list live
  const refresh = useCallback(() => {}, []);

  return { subjects, loading, error, refresh, create, update, archive, addChapter, updateChapter, deleteChapter, importSubject };
}
