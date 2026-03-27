import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let refreshPromise: Promise<void> | null = null;

function refreshAccessToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = api
      .post("/auth/refresh")
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function shouldRedirectToLoginOnAuthFailure(requestUrl: string | undefined): boolean {
  if (!requestUrl) return false;
  if (requestUrl.includes("auth/me")) return false;
  const path = window.location.pathname;
  if (path === "/login" || path === "/register") return false;
  return true;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    const url = originalRequest.url ?? "";
    if (
      url.includes("auth/refresh") ||
      url.includes("auth/login") ||
      url.includes("auth/register")
    ) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      if (shouldRedirectToLoginOnAuthFailure(url)) {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      await refreshAccessToken();
      return api(originalRequest);
    } catch {
      if (shouldRedirectToLoginOnAuthFailure(url)) {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  }
);

export default api;
