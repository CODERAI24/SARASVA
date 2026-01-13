/**
 * Check if an attendance record can be edited
 * Attendance is immutable once locked
 */
export function canEditAttendance(record) {
  if (!record) return false;
  return record.locked !== true;
}

/**
 * Lock attendance after creation
 */
export function lockAttendance(record) {
  return {
    ...record,
    locked: true
  };
}

/**
 * Validate attendance status
 */
export function isValidAttendanceStatus(status) {
  return ["present", "absent", "cancelled", "extra"].includes(status);
}
