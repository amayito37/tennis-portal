import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
});

// === TOKEN MANAGEMENT ===
export function setToken(token) {
  localStorage.setItem("token", token);
}

export function getToken() {
  return localStorage.getItem("token");
}

export function clearToken() {
  localStorage.removeItem("token");
}

// === INTERCEPTORS ===

// Automatically add Authorization header
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle API errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearToken();
      window.location.href = "/"; // Redirect to login on expired/invalid token
    }
    console.error("API Error:", err);
    return Promise.reject(err);
  }
);

// === AUTH ENDPOINTS ===
export async function login(email, password) {
  const res = await api.post("/auth/login", { email, password });
  const data = res.data;
  setToken(data.access_token);
  return data;
}

export async function signup(email, password, full_name) {
  const res = await api.post("/auth/signup", { email, password, full_name });
  return res.data;
}

// === GENERIC HELPERS ===
export async function apiGet(path) {
  const res = await api.get(path);
  return res.data;
}

export async function apiPost(path, body) {
  const res = await api.post(path, body);
  return res.data;
}

export default api;
