import api from "./axios.js";

export const attendanceApi = {
  // Subjects scheduled today + whether each is already marked
  getToday:  ()       => api.get("/attendance/today"),

  // Mark attendance: { subjectId, status, date? }
  mark:      (data)   => api.post("/attendance/mark", data),

  // Per-subject stats + zone + classesNeededFor75
  getSummary: ()      => api.get("/attendance/summary"),

  // Raw log with optional filters: { subjectId, from, to }
  getLog:    (params) => api.get("/attendance", { params }),
};
