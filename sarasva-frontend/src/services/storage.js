/**
 * Base localStorage helpers.
 * All data is namespaced under "sarasva_" to avoid collisions.
 *
 * Migration note: when switching to Firebase, ONLY the service files
 * (auth.service.js, subjects.service.js, etc.) change.
 * This file gets deleted. The hooks and pages stay identical.
 */

const NS = "sarasva_";

export const storage = {
  get(key) {
    try {
      const raw = localStorage.getItem(NS + key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  set(key, value) {
    localStorage.setItem(NS + key, JSON.stringify(value));
  },

  remove(key) {
    localStorage.removeItem(NS + key);
  },

  /** Return an array stored at key, defaulting to [] */
  getList(key) {
    return this.get(key) ?? [];
  },

  /** Save a full list */
  setList(key, list) {
    this.set(key, list);
  },
};

/** Generate a unique ID (replaces Mongo ObjectId) */
export function uid() {
  return crypto.randomUUID();
}

/** Today as "YYYY-MM-DD" in local time — matches attendanceUtils.js */
export function todayString() {
  return new Date().toISOString().split("T")[0];
}
