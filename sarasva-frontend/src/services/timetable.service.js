/**
 * Timetable service — Firestore implementation.
 * Single-active rule enforced via writeBatch (the hook passes current list).
 */
import { addDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db, userCol, userDoc } from "@/firebase/config.js";

export const timetableService = {
  async create(uid, { name }) {
    const ref = await addDoc(userCol(uid, "timetables"), {
      name,
      active:    false,
      archived:  false,
      slots:     [],
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  },

  /** Deactivate all, then activate the target — all in one batch write. */
  async activate(uid, id, currentTimetables) {
    const batch = writeBatch(db);
    currentTimetables.forEach((tt) => {
      batch.update(userDoc(uid, "timetables", tt.id), { active: tt.id === id });
    });
    await batch.commit();
  },

  async archive(uid, id) {
    await updateDoc(userDoc(uid, "timetables", id), { archived: true, active: false });
  },

  /** Slot mutations pass current slots to avoid an extra Firestore read. */
  async addSlot(uid, timetableId, slotData, currentSlots) {
    const newSlot = { id: crypto.randomUUID(), ...slotData };
    await updateDoc(userDoc(uid, "timetables", timetableId), {
      slots: [...currentSlots, newSlot],
    });
  },

  async deleteSlot(uid, timetableId, slotId, currentSlots) {
    await updateDoc(userDoc(uid, "timetables", timetableId), {
      slots: currentSlots.filter((s) => s.id !== slotId),
    });
  },
};
