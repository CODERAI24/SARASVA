/**
 * Check if a timetable can be archived
 */
export function canArchiveTimetable(timetable) {
  if (!timetable) return false;
  return timetable.archived !== true;
}

/**
 * Archive a timetable safely
 */
export function archiveTimetable(timetable) {
  return {
    ...timetable,
    archived: true,
    active: false
  };
}

/**
 * Ensure only one timetable is active
 */
export function setActiveTimetable(timetables, timetableId) {
  return timetables.map((tt) => ({
    ...tt,
    active: tt.id === timetableId
  }));
}
