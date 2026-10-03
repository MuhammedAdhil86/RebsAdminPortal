import axios from "axios";
import * as AuthStoreModule from "../store/authStore";
import { showError, showSuccess, getErrorMessage } from "../utils/toest";

// Support both default and named exports from authStore
const authStore = AuthStoreModule.default || AuthStoreModule.useAuthStore;

// Clean base URLs (strips any trailing slash)
const sanitizeUrl = (url = "") => url.replace(/\/+$/, "");

export const CLOUDFLARE_URL = sanitizeUrl(
  import.meta.env.VITE_CLOUDFLARE_API_URL ||
    "https://channels-expert-convertible-vic.trycloudflare.com"
);

export const PRODUCTION_URL = sanitizeUrl(
  import.meta.env.VITE_PRODUCTION_API_URL ||
    "https://rebs.blr1.digitaloceanspaces.com"
);

export const CURRENT_ENV =
  import.meta.env.VITE_API_ENVIRONMENT || "cloudflare";

// Dynamically select target based on VITE_API_ENVIRONMENT
export const DEFAULT_BASE_URL =
  CURRENT_ENV.toLowerCase() === "production" ? PRODUCTION_URL : CLOUDFLARE_URL;

// Key used to show a toast on the login page after a forced redirect
export const SESSION_EXPIRED_KEY = "session_expired_message";

// Retrieve the Bearer token safely from Zustand store or localStorage
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
    /* ignore parsing errors */
  }

  return localStorage.getItem("token") || null;
};

// Requests where a 401 means "wrong credentials", not "session expired"
const isAuthAttempt = (url = "") =>
  /\/(login|password\/forgot|password\/reset)/.test(url);

// Setup interceptors for token injection, toasts and error handling
const setupInterceptors = (instance) => {
  instance.interceptors.request.use(
    (config) => {
      const token = getStoredAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // DEV ONLY: log the token being sent (stripped from production builds)
      if (import.meta.env.DEV) {
        console.log(
          `[API] ${config.method?.toUpperCase()} ${config.url}`,
          "\nToken:",
          token || "(none)"
        );
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => {
      const method = response.config?.method?.toLowerCase();
      const message = response.data?.message;

      // Show backend success messages for writes only (not GETs)
      if (!response.config?.silent && method !== "get" && message) {
        showSuccess(message);
      }

      return response.data;
    },
    (error) => {
      const status = error.response ? error.response.status : null;
      const silent = error.config?.silent;
      const url = error.config?.url || "";

      let message = getErrorMessage(error);
      if (error.code === "ECONNABORTED") {
        message = "The request timed out. Please try again.";
      }

      if (status === 401 && !isAuthAttempt(url)) {
        // Session expired: clear everything, then redirect.
        // The redirect reloads the page, so the toast is shown on /login.
        localStorage.removeItem("auth_session");
        localStorage.removeItem("token");

        if (authStore?.getState?.()?.logout) {
          authStore.getState().logout();
        }

        if (window.location.pathname !== "/login") {
          sessionStorage.setItem(
            SESSION_EXPIRED_KEY,
            "Your session has expired. Please log in again."
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
    }
  );

  return instance;
};

// Cloudflare Tunnel Client
export const cloudflareClient = setupInterceptors(
  axios.create({
    baseURL: CLOUDFLARE_URL,
    headers: { "Content-Type": "application/json" },
    timeout: 20000,
  })
);

// Production Client
export const prodClient = setupInterceptors(
  axios.create({
    baseURL: PRODUCTION_URL,
    headers: { "Content-Type": "application/json" },
    timeout: 20000,
  })
);

// Default Client
const apiClient = setupInterceptors(
  axios.create({
    baseURL: DEFAULT_BASE_URL,
    headers: { "Content-Type": "application/json" },
    timeout: 20000,
  })
);

export default apiClient;