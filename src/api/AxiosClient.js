import axios from "axios";
import * as AuthStoreModule from "../store/authStore";
import { showError, showSuccess, getErrorMessage } from "../utils/toest";

// Support default and named exports from authStore
const authStore = AuthStoreModule.default || AuthStoreModule.useAuthStore;

// Production API URL only
const sanitizeUrl = (url = "") => url.replace(/\/+$/, "");

export const PRODUCTION_URL = sanitizeUrl(
  import.meta.env.VITE_PRODUCTION_API_URL ||
    "https://rebs-control-panal-k3qzq.ondigitalocean.app",
);

export const DEFAULT_BASE_URL = PRODUCTION_URL;

// Key used to show a toast after a forced login redirect
export const SESSION_EXPIRED_KEY = "session_expired_message";

// Retrieve the Bearer token from Zustand or localStorage
const getStoredAccessToken = () => {
  const storeToken = authStore?.getState?.()?.accessToken;
  if (storeToken) return storeToken;

  try {
    const rawSession = localStorage.getItem("auth_session");

    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      return parsed?.state?.accessToken || null;
    }
  } catch {
    // Ignore parsing errors
  }

  return localStorage.getItem("token") || null;
};

// Authentication requests should not trigger session-expired handling
const isAuthAttempt = (url = "") =>
  /\/(login|password\/forgot|password\/reset)/.test(url);

// Detect intentionally cancelled requests
const isCancelError = (error) =>
  axios.isCancel(error) ||
  error?.code === "ERR_CANCELED" ||
  error?.name === "CanceledError" ||
  error?.name === "AbortError";

// Attach authentication and response interceptors
const setupInterceptors = (instance) => {
  instance.interceptors.request.use(
    (config) => {
      const token = getStoredAccessToken();

      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Development-only logging; never log authentication tokens
      if (import.meta.env.DEV) {
        console.log(
          `[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
        );
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  instance.interceptors.response.use(
    (response) => {
      const method = response.config?.method?.toLowerCase();
      const message = response.data?.message;

      // Return response data directly
      if (!response.config?.silent && method !== "get" && message) {
        showSuccess(message);
      }

      return response.data;
    },
    (error) => {
      if (isCancelError(error)) {
        const cancelErr = new Error("canceled");
        cancelErr.code = "ERR_CANCELED";
        cancelErr.name = "CanceledError";
        return Promise.reject(cancelErr);
      }

      const status = error.response?.status ?? null;
      const silent = error.config?.silent;
      const url = error.config?.url || "";

      let message = getErrorMessage(error);

      if (error.code === "ECONNABORTED") {
        message = "The request timed out. Please try again.";
      }

      if (status === 401 && !isAuthAttempt(url)) {
        localStorage.removeItem("auth_session");
        localStorage.removeItem("token");

        if (authStore?.getState?.()?.logout) {
          authStore.getState().logout();
        }

        if (window.location.pathname !== "/login") {
          sessionStorage.setItem(
            SESSION_EXPIRED_KEY,
            "Your session has expired. Please log in again.",
          );

          window.location.href = "/login";
        }
      } else if (!silent) {
        showError(message);
      }

      const err = new Error(message);
      err.status = status;
      err.data = error.response?.data;

      return Promise.reject(err);
    },
  );

  return instance;
};

// Single production API client
const apiClient = setupInterceptors(
  axios.create({
    baseURL: import.meta.env.DEV ? "" : PRODUCTION_URL,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 20000,
  }),
);

export default apiClient;
