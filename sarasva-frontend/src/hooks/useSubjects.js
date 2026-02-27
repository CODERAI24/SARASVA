import { useState, useEffect, useCallback } from "react";
import { query, where, onSnapshot, addDoc, updateDoc } from "firebase/firestore";
import { db, userCol, userDoc } from "@/firebase/config.js";
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
    const q = query(userCol(user.id, "subjects"), where("archived", "==", archived));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
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

  // refresh is a no-op — onSnapshot keeps the list live
  const refresh = useCallback(() => {}, []);

  return { subjects, loading, error, refresh, create, update, archive };
}
