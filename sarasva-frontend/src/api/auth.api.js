import api from "./axios.js";

export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login:    (data) => api.post("/auth/login",    data),
  getMe:    ()     => api.get("/auth/me"),

  getProfile:    ()     => api.get("/user/profile"),
  updateProfile: (data) => api.patch("/user/profile", data),

  getSettings:    ()     => api.get("/user/settings"),
  updateSettings: (data) => api.patch("/user/settings", data),
};
