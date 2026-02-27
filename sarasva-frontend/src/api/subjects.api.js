import api from "./axios.js";

export const subjectsApi = {
  getAll:  (params) => api.get("/subjects", { params }),
  create:  (data)   => api.post("/subjects", data),
  update:  (id, data) => api.patch(`/subjects/${id}`, data),
  archive: (id)     => api.delete(`/subjects/${id}`),
};
