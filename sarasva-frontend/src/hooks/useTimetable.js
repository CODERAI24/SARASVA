import { useState, useEffect, useCallback } from "react";
import { query, where, onSnapshot, addDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db, userCol, userDoc } from "@/firebase/config.js";
import { useAuth } from "@/context/AuthContext.jsx";

/**
 * Real-time timetable hook backed by Firestore onSnapshot.
 * activate() uses writeBatch to enforce the single-active rule atomically.
 */
export function useTimetable() {
  const { user } = useAuth();
  const [timetables, setTimetables] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    if (!user) return;
    const q = query(userCol(user.id, "timetables"), where("archived", "==", false));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        setTimetables(list);
        setLoading(false);
      },
      (err) => { setError(err.message); setLoading(false); }
    );
    return unsub;
  }, [user]);

  const create = useCallback(async ({ name }) => {
    if (!user) return;
    try {
      await addDoc(userCol(user.id, "timetables"), {
        name,
        active:    false,
        archived:  false,
        slots:     [],
        createdAt: new Date().toISOString(),
      });
    } catch (err) { setError(err.message); }
  }, [user]);

  /** Atomically deactivate all, then activate the target. */
  const activate = useCallback(async (id) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      timetables.forEach((tt) => {
        batch.update(userDoc(user.id, "timetables", tt.id), { active: tt.id === id });
      });
      await batch.commit();
    } catch (err) { setError(err.message); }
  }, [user, timetables]);

  const archive = useCallback(async (id) => {
    if (!user) return;
    try {
      await updateDoc(userDoc(user.id, "timetables", id), { archived: true, active: false });
    } catch (err) { setError(err.message); }
  }, [user]);

  /** Uses hook's current slots state to avoid an extra Firestore read. */
  const addSlot = useCallback(async (timetableId, slotData) => {
    if (!user) return;
    try {
      const tt = timetables.find((t) => t.id === timetableId);
      if (!tt) return;
      const newSlot = { id: crypto.randomUUID(), ...slotData };
      await updateDoc(userDoc(user.id, "timetables", timetableId), {
        slots: [...(tt.slots ?? []), newSlot],
      });
    } catch (err) { setError(err.message); }
  }, [user, timetables]);

  const deleteSlot = useCallback(async (timetableId, slotId) => {
    if (!user) return;
    try {
      const tt = timetables.find((t) => t.id === timetableId);
      if (!tt) return;
      await updateDoc(userDoc(user.id, "timetables", timetableId), {
        slots: (tt.slots ?? []).filter((s) => s.id !== slotId),
      });
    } catch (err) { setError(err.message); }
  }, [user, timetables]);

  return { timetables, loading, error, create, activate, archive, addSlot, deleteSlot };
}
