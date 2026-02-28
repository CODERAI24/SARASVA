import { useState, useEffect, useCallback } from "react";
import { onSnapshot, addDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db, userCol, userDoc } from "@/firebase/config.js";
import { useAuth } from "@/context/AuthContext.jsx";

/**
 * Real-time timetable hook backed by Firestore onSnapshot.
 * activate() toggles a timetable; max 2 can be active simultaneously.
 * If a 3rd is activated, the oldest-activated one is deactivated.
 */
export function useTimetable() {
  const { user } = useAuth();
  const [timetables, setTimetables] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      userCol(user.id, "timetables"),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((tt) => tt.archived !== true)
          .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
        setTimetables(list);
        setLoading(false);
      },
      (err) => { setError(err.message); setLoading(false); }
    );
    return unsub;
  }, [user]);

  const create = useCallback(async ({ name, startDate }) => {
    if (!user) return;
    try {
      await addDoc(userCol(user.id, "timetables"), {
        name,
        startDate: startDate || null,
        active:    false,
        archived:  false,
        slots:     [],
        createdAt: new Date().toISOString(),
      });
    } catch (err) { setError(err.message); }
  }, [user]);

  /**
   * Toggle active state. Max 2 timetables can be active at once.
   * Activating a 3rd deactivates the oldest-activated one.
   */
  const activate = useCallback(async (id) => {
    if (!user) return;
    try {
      const target = timetables.find((t) => t.id === id);
      if (!target) return;
      const batch = writeBatch(db);

      if (target.active) {
        // Deactivate this timetable
        batch.update(userDoc(user.id, "timetables", id), { active: false });
      } else {
        // Activate — if 2 are already active, deactivate the oldest activated one
        const activeOnes = timetables.filter((t) => t.active);
        if (activeOnes.length >= 2) {
          const oldest = [...activeOnes].sort((a, b) =>
            (a.activatedAt ?? a.createdAt ?? "").localeCompare(b.activatedAt ?? b.createdAt ?? "")
          )[0];
          batch.update(userDoc(user.id, "timetables", oldest.id), { active: false });
        }
        batch.update(userDoc(user.id, "timetables", id), {
          active:      true,
          activatedAt: new Date().toISOString(),
        });
      }
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

  /** Import a shared timetable (from P2P) into the user's own timetable list. */
  const importTimetable = useCallback(async ({ name, slots = [] }) => {
    if (!user) return;
    try {
      await addDoc(userCol(user.id, "timetables"), {
        name,
        startDate: null,
        active:    false,
        archived:  false,
        slots:     slots.map((s) => ({ ...s, id: crypto.randomUUID() })),
        createdAt: new Date().toISOString(),
      });
    } catch (err) { setError(err.message); }
  }, [user]);

  return { timetables, loading, error, create, activate, archive, addSlot, deleteSlot, importTimetable };
}
