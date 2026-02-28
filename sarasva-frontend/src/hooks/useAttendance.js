import { useState, useEffect, useCallback } from "react";
import { query, where, onSnapshot, getDocs } from "firebase/firestore";
import { userCol } from "@/firebase/config.js";
import { useAuth } from "@/context/AuthContext.jsx";
import {
  DAYS, todayString, buildSummary, attendanceService,
} from "@/services/attendance.service.js";

/* ── useAttendanceToday ──────────────────────────────────────────── */

/**
 * Loads subjects + ALL active timetables once (getDocs), then sets up an
 * onSnapshot listener on today's attendance records so marking auto-updates the UI.
 * Supports multiple active timetables (max 2).
 * Each item in today[] includes { subject, markedStatus, alreadyMarked, timetableName, timetableId, uniqueKey }
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
    let activeTTs  = [];
    let unsub      = () => {};

    function buildTodayView(attendanceSnap) {
      const markedMap = {};
      attendanceSnap.docs.forEach((d) => {
        markedMap[d.data().subjectId] = d.data().status;
      });

      if (activeTTs.length === 0) {
        // No active timetable — show all subjects without timetable label
        return subjects.map((s) => ({
          subject:       s,
          markedStatus:  markedMap[s.id] ?? null,
          alreadyMarked: !!markedMap[s.id],
          timetableName: null,
          timetableId:   null,
          uniqueKey:     s.id,
        }));
      }

      const items = [];
      const seenKey = new Set();

      activeTTs.forEach((tt) => {
        const slots = (tt.slots ?? [])
          .filter((s) => s.day === dayName)
          .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));

        slots.forEach((slot) => {
          const subject = subjects.find((s) => s.id === slot.subjectId);
          if (!subject) return;
          const key = `${tt.id}_${subject.id}`;
          if (seenKey.has(key)) return;
          seenKey.add(key);
          items.push({
            subject,
            markedStatus:  markedMap[subject.id] ?? null,
            alreadyMarked: !!markedMap[subject.id],
            timetableName: tt.name,
            timetableId:   tt.id,
            uniqueKey:     key,
            slot,
          });
        });
      });

      return items;
    }

    const init = async () => {
      try {
        const [subSnap, ttSnap] = await Promise.all([
          getDocs(query(userCol(user.id, "subjects"), where("archived", "==", false))),
          getDocs(query(userCol(user.id, "timetables"), where("active", "==", true))),
        ]);
        subjects = subSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Filter by startDate: only timetables that have started by today
        activeTTs = ttSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((tt) => !tt.archived && (!tt.startDate || tt.startDate <= todayStr));

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

  /** Mark attendance for a subject. Accepts optional date for retroactive marking. */
  const mark = useCallback(async (subjectId, status, date) => {
    if (!user) return;
    setMarking(subjectId);
    try {
      await attendanceService.mark(user.id, { subjectId, status, date });
    } catch (err) {
      setError(err.message);
    } finally {
      setMarking(null);
    }
  }, [user]);

  const refresh = useCallback(() => {}, []);

  return { date, day, today, loading, error, marking, mark, refresh };
}

/* ── useAttendanceSummary ────────────────────────────────────────── */

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

  const refresh = useCallback(() => {}, []);

  return { overall, subjects, loading, error, refresh };
}

/* ── useAttendanceLog ────────────────────────────────────────────── */

export function useAttendanceLog({ subjectId, from, to } = {}) {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
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
