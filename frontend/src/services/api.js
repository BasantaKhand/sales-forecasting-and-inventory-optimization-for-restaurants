import axios from "axios";
import toast from "react-hot-toast";

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

// Global response handling:
//  - 401  -> clear session, notify, and bounce to /login
//  - no response (network/timeout) -> notify
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem("token");
        if (window.location.pathname !== "/login") {
          toast.error("Session expired — please sign in again");
          window.location.href = "/login";
        }
      }
    } else if (error.code === "ECONNABORTED") {
      toast.error("Request timed out — please try again");
    } else {
      toast.error("Network error — please check your connection");
    }
    return Promise.reject(error);
  }
);

export default api;
