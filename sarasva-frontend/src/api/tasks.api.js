import api from "./axios.js";

export const tasksApi = {
  getAll:  (params)  => api.get("/tasks", { params }),
  create:  (data)    => api.post("/tasks", data),
  update:  (id, data)=> api.patch(`/tasks/${id}`, data),
  archive: (id)      => api.delete(`/tasks/${id}`),
};
