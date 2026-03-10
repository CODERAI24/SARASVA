import { useState, useEffect, useCallback } from "react";
import { query, where, onSnapshot } from "firebase/firestore";
import { userCol } from "@/firebase/config.js";
import { useAuth } from "@/context/AuthContext.jsx";
import { habitsService } from "@/services/habits.service.js";
import { todayString } from "@/services/attendance.service.js";

/**
 * Compute consecutive-day streak for a habit given a Set of YYYY-MM-DD dates it was done.
 * Starts from today if done, else yesterday.
 */
function computeStreak(doneDates) {
  if (!doneDates || doneDates.size === 0) return 0;
  function toStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  const today = new Date();
  const check = new Date(today);
  if (!doneDates.has(toStr(check))) check.setDate(check.getDate() - 1);
  let streak = 0;
  while (doneDates.has(toStr(check))) {
    streak++;
    check.setDate(check.getDate() - 1);
  }
  return streak;
}

/**
 * Real-time habits hook backed by Firestore onSnapshot.
 * Returns active habits, today's completion state, and per-habit streaks (last 35 days).
 */
export function useHabits() {
  const { user } = useAuth();
  const [habits,    setHabits]    = useState([]);
  const [todayLogs, setTodayLogs] = useState({}); // habitId → done boolean
  const [streaks,   setStreaks]   = useState({}); // habitId → streak number
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

  /* Listen to last 35 days of done logs for streak computation */
  useEffect(() => {
    if (!user) return;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 35);
    const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}-${String(cutoff.getDate()).padStart(2, "0")}`;

    const q = query(
      userCol(user.id, "habitLogs"),
      where("date", ">=", cutoffStr),
      where("done", "==", true)
    );
    return onSnapshot(q, (snap) => {
      const logMap = {};
      snap.docs.forEach((doc) => {
        const { habitId, date } = doc.data();
        if (!logMap[habitId]) logMap[habitId] = new Set();
        logMap[habitId].add(date);
      });
      const newStreaks = {};
      for (const [habitId, dates] of Object.entries(logMap)) {
        newStreaks[habitId] = computeStreak(dates);
      }
      setStreaks(newStreaks);
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

  return { habits, todayLogs, streaks, loading, addHabit, archiveHabit, toggleToday };
}
