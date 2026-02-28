import { useState, useEffect, useCallback } from "react";
import { query, where, onSnapshot } from "firebase/firestore";
import { userCol } from "@/firebase/config.js";
import { useAuth } from "@/context/AuthContext.jsx";
import { habitsService } from "@/services/habits.service.js";
import { todayString } from "@/services/attendance.service.js";

/**
 * Real-time habits hook.
 * Returns active habits + today's completion state.
 */
export function useHabits() {
  const { user } = useAuth();
  const [habits,    setHabits]    = useState([]);
  const [todayLogs, setTodayLogs] = useState({}); // habitId → done boolean
  const [loading,   setLoading]   = useState(true);

  /* Listen to active habits */
  useEffect(() => {
    if (!user) return;
    const q = query(userCol(user.id, "habits"), where("active", "==", true));
    return onSnapshot(q, (snap) => {
      setHabits(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""))
      );
      setLoading(false);
    });
  }, [user]);

  /* Listen to today's habit logs */
  useEffect(() => {
    if (!user) return;
    const todayStr = todayString();
    const q = query(userCol(user.id, "habitLogs"), where("date", "==", todayStr));
    return onSnapshot(q, (snap) => {
      const map = {};
      snap.docs.forEach((d) => { map[d.data().habitId] = d.data().done; });
      setTodayLogs(map);
    });
  }, [user]);

  const addHabit = useCallback(async (name) => {
    if (!user || !name.trim()) return;
    await habitsService.addHabit(user.id, name.trim());
  }, [user]);

  const archiveHabit = useCallback(async (habitId) => {
    if (!user) return;
    await habitsService.archiveHabit(user.id, habitId);
  }, [user]);

  const toggleToday = useCallback(async (habitId) => {
    if (!user) return;
    const current = todayLogs[habitId] ?? false;
    await habitsService.toggleToday(user.id, habitId, current);
  }, [user, todayLogs]);

  return { habits, todayLogs, loading, addHabit, archiveHabit, toggleToday };
}
