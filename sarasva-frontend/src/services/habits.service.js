/**
 * Habits service — daily habit tracker.
 *
 * Collections:
 *   users/{uid}/habits/{id}              — habit definition (name, active)
 *   users/{uid}/habitLogs/{habitId_date} — daily completion logs
 */
import { addDoc, updateDoc, setDoc } from "firebase/firestore";
import { userCol, userDoc } from "@/firebase/config.js";
import { todayString } from "./attendance.service.js";

export const habitsService = {
  /** Create a new habit. */
  async addHabit(uid, name) {
    await addDoc(userCol(uid, "habits"), {
      name,
      active:    true,
      createdAt: new Date().toISOString(),
    });
  },

  /** Archive (soft-delete) a habit. */
  async archiveHabit(uid, habitId) {
    await updateDoc(userDoc(uid, "habits", habitId), { active: false });
  },

  /**
   * Toggle today's completion for a habit.
   * Uses composite doc ID habitId_date to enforce one log per day.
   */
  async toggleToday(uid, habitId, currentDone) {
    const date  = todayString();
    const docId = `${habitId}_${date}`;
    await setDoc(userDoc(uid, "habitLogs", docId), {
      habitId,
      date,
      done:      !currentDone,
      updatedAt: new Date().toISOString(),
    });
  },
};
