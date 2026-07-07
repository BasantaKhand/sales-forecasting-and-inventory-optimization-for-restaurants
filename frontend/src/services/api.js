import axios from "axios";

// Requests go to /api and are proxied to the Flask backend by Vite (dev)
// or served behind the same origin in production.
const api = axios.create({
  baseURL: "/api",
  timeout: 30000, // forecast endpoints can be slow
});

// Attach the JWT from localStorage to every request when present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear the session and bounce to the login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
