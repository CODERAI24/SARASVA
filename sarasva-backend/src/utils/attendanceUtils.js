/**
 * Attendance utility functions.
 * Migrated from docs/src/ui/screens/attendance.js.
 * Pure functions — no DB access, fully testable in isolation.
 */

/**
 * Calculate stats for a flat array of attendance records.
 * Mirrors calculateSubjectStats() from the original attendance.js.
 * Note: pass pre-filtered records (already filtered by subjectId if needed).
 */
export function calculateSubjectStats(records) {
  const total   = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const percent = total === 0 ? 0 : Math.round((present / total) * 100);
  return { total, present, percent };
}

/**
 * Classify attendance percentage as "safe" (>=75%) or "risk" (<75%).
 * Mirrors zone() from the original attendance.js.
 */
export function zone(percent) {
  return percent >= 75 ? "safe" : "risk";
}

/**
 * Calculate how many consecutive present classes are needed to reach 75%.
 * Migrated exactly from classesNeededFor75() in the original attendance.js.
 * Lives in the backend because it requires querying the full attendance collection.
 */
export function classesNeededFor75(total, present) {
  if (total === 0) return 0;

  let needed = 0;
  let t = total;
  let p = present;

  while (Math.round((p / t) * 100) < 75) {
    t++;
    p++;
    needed++;
  }

  return needed;
}

/**
 * Build a complete summary object for a single subject.
 * Used by the attendance controller to return enriched stats in one API call.
 */
export function buildAttendanceSummary(records) {
  const stats  = calculateSubjectStats(records);
  const z      = zone(stats.percent);
  const needed = z === "risk" ? classesNeededFor75(stats.total, stats.present) : 0;

  return {
    ...stats,
    zone:               z,
    classesNeededFor75: needed,
  };
}

/**
 * Returns today's date as "YYYY-MM-DD" in local time.
 * Mirrors today() from the original attendance.js.
 * Used in the controller when the client does not send a date.
 */
export function todayString() {
  return new Date().toISOString().split("T")[0];
}
