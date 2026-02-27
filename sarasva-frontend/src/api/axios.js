import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",  // proxied to localhost:5000 by vite.config.js
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sarasva_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear stale token so the user is sent to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("sarasva_token");
      // AuthContext will detect missing token and redirect to /login
    }
    return Promise.reject(error);
  }
);

export default api;
