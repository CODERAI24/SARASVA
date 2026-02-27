/**
 * Attendance service — Firestore implementation.
 * Pure math functions are exported for use by hooks.
 * Doc ID = "${subjectId}_${date}" enforces the unique (subject, date) constraint.
 */
import { setDoc } from "firebase/firestore";
import { userDoc } from "@/firebase/config.js";

export const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

export function todayString() {
  return new Date().toISOString().split("T")[0];
}

/* ── Pure math (same logic as attendanceUtils.js / backend) ─────── */

export function calculateStats(records) {
  const total   = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const percent = total === 0 ? 0 : Math.round((present / total) * 100);
  return { total, present, percent };
}

export function zone(percent) {
  return percent >= 75 ? "safe" : "risk";
}

export function classesNeededFor75(total, present) {
  if (total === 0) return 0;
  let needed = 0, t = total, p = present;
  while (Math.round((p / t) * 100) < 75) { t++; p++; needed++; }
  return needed;
}

export function buildSummary(records) {
  const stats = calculateStats(records);
  const z     = zone(stats.percent);
  return {
    ...stats,
    zone:               z,
    classesNeededFor75: z === "risk" ? classesNeededFor75(stats.total, stats.present) : 0,
  };
}

/* ── Firestore mutation ─────────────────────────────────────────── */

export const attendanceService = {
  /**
   * Mark attendance for a subject on a given date.
   * Uses a composite doc ID to enforce uniqueness — the UI guards prevent
   * re-marking (buttons are hidden once alreadyMarked === true).
   */
  async mark(uid, { subjectId, status, date }) {
    const attendanceDate = date ?? todayString();
    const docId = `${subjectId}_${attendanceDate}`;
    await setDoc(userDoc(uid, "attendance", docId), {
      subjectId,
      date:      attendanceDate,
      status,
      locked:    true,
      createdAt: new Date().toISOString(),
    });
  },
};
