import { useState, useEffect, useCallback } from "react";
import { query, where, onSnapshot, getDocs } from "firebase/firestore";
import { userCol } from "@/firebase/config.js";
import { useAuth } from "@/context/AuthContext.jsx";
import {
  DAYS, todayString, buildSummary, attendanceService,
} from "@/services/attendance.service.js";

/* ── useAttendanceToday ──────────────────────────────────────────── */

/**
 * Loads subjects + active timetable once (getDocs), then sets up an
 * onSnapshot listener on today's attendance records so marking auto-updates the UI.
 */
export function useAttendanceToday() {
  const { user } = useAuth();
  const [date,    setDate]    = useState(todayString());
  const [day,     setDay]     = useState(DAYS[new Date().getDay()]);
  const [today,   setToday]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [marking, setMarking] = useState(null);

  useEffect(() => {
    if (!user) return;

    const todayStr = todayString();
    const dayName  = DAYS[new Date().getDay()];
    let subjects   = [];
    let activeTT   = null;
    let unsub      = () => {};

    function buildTodayView(attendanceSnap) {
      const markedMap = {};
      attendanceSnap.docs.forEach((d) => {
        markedMap[d.data().subjectId] = d.data().status;
      });

      const scheduledIds = activeTT
        ? activeTT.slots.filter((s) => s.day === dayName).map((s) => s.subjectId)
        : subjects.map((s) => s.id); // no active timetable → show all subjects

      return subjects
        .filter((s) => scheduledIds.includes(s.id))
        .map((s) => ({
          subject:       s,
          markedStatus:  markedMap[s.id] ?? null,
          alreadyMarked: !!markedMap[s.id],
        }));
    }

    const init = async () => {
      try {
        const [subSnap, ttSnap] = await Promise.all([
          getDocs(query(userCol(user.id, "subjects"), where("archived", "==", false))),
          getDocs(query(userCol(user.id, "timetables"), where("active", "==", true))),
        ]);
        subjects = subSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const ttDoc = ttSnap.docs.find((d) => !d.data().archived);
        activeTT = ttDoc ? { id: ttDoc.id, ...ttDoc.data() } : null;

        unsub = onSnapshot(
          query(userCol(user.id, "attendance"), where("date", "==", todayStr)),
          (snap) => {
            setToday(buildTodayView(snap));
            setDate(todayStr);
            setDay(dayName);
            setLoading(false);
          },
          (err) => { setError(err.message); setLoading(false); }
        );
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    init();
    return () => unsub();
  }, [user]);

  const mark = useCallback(async (subjectId, status) => {
    if (!user) return;
    setMarking(subjectId);
    try {
      await attendanceService.mark(user.id, { subjectId, status });
      // onSnapshot auto-updates `today` state after the write
    } catch (err) {
      setError(err.message);
    } finally {
      setMarking(null);
    }
  }, [user]);

  // refresh is a no-op — onSnapshot keeps attendance live
  const refresh = useCallback(() => {}, []);

  return { date, day, today, loading, error, marking, mark, refresh };
}

/* ── useAttendanceSummary ────────────────────────────────────────── */

/**
 * Loads subjects once (getDocs), then listens to all attendance records
 * via onSnapshot so the summary auto-updates when marks are added.
 */
export function useAttendanceSummary() {
  const { user } = useAuth();
  const [overall,  setOverall]  = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!user) return;
    let subjectsList = [];
    let unsub = () => {};

    const init = async () => {
      try {
        const subSnap = await getDocs(
          query(userCol(user.id, "subjects"), where("archived", "==", false))
        );
        subjectsList = subSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        unsub = onSnapshot(
          userCol(user.id, "attendance"),
          (snap) => {
            const records = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            const subjectSummaries = subjectsList.map((s) => {
              const sr = records.filter((r) => r.subjectId === s.id);
              return { subject: s, ...buildSummary(sr) };
            });
            setOverall(buildSummary(records));
            setSubjects(subjectSummaries);
            setLoading(false);
          },
          (err) => { setError(err.message); setLoading(false); }
        );
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    init();
    return () => unsub();
  }, [user]);

  const refresh = useCallback(() => {}, []); // no-op

  return { overall, subjects, loading, error, refresh };
}

/* ── useAttendanceLog ────────────────────────────────────────────── */

export function useAttendanceLog({ subjectId, from, to } = {}) {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // Load all attendance for this user; filter client-side to avoid composite index requirements
    return onSnapshot(userCol(user.id, "attendance"), (snap) => {
      let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (subjectId) list = list.filter((r) => r.subjectId === subjectId);
      if (from)      list = list.filter((r) => r.date >= from);
      if (to)        list = list.filter((r) => r.date <= to);
      list.sort((a, b) => b.date.localeCompare(a.date));
      setRecords(list);
      setLoading(false);
    });
  }, [user, subjectId, from, to]);

  return { records, loading };
}
