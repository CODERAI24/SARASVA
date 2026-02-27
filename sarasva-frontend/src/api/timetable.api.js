import api from "./axios.js";

export const timetableApi = {
  getAll:   ()        => api.get("/timetables"),
  getOne:   (id)      => api.get(`/timetables/${id}`),
  create:   (data)    => api.post("/timetables", data),
  update:   (id, data)=> api.patch(`/timetables/${id}`, data),
  archive:  (id)      => api.delete(`/timetables/${id}`),
  activate: (id)      => api.patch(`/timetables/${id}/activate`),

  addSlot:    (id, data)            => api.post(`/timetables/${id}/slots`, data),
  deleteSlot: (id, slotId)          => api.delete(`/timetables/${id}/slots/${slotId}`),
};
