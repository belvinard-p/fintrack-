import axios from "axios";
import { getToken, clearToken } from "@/lib/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const PUBLIC_PATHS = ["/login", "/register"];

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isUnauthorized = error.response?.status === 401;
    const onPublicPath =
      typeof window !== "undefined" &&
      PUBLIC_PATHS.some((path) => window.location.pathname.startsWith(path));

    if (isUnauthorized && !onPublicPath) {
      clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
