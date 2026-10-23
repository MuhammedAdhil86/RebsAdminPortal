// src/store/authStore.js
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const attempt = (fn, fallback = null) => {
  try {
    return fn();
  } catch {
    return fallback; // storage blocked / unavailable
  }
};

/**
 * "Remember me" storage:
 *  - remember = true  -> session kept in localStorage   (survives closing the browser)
 *  - remember = false -> session kept in sessionStorage (cleared when the browser/tab closes)
 * The choice is read from the persisted state itself (`state.remember`).
 */
const authStorage = {
  getItem: (name) =>
    attempt(() => localStorage.getItem(name) ?? sessionStorage.getItem(name)),

  setItem: (name, value) =>
    attempt(() => {
      const remember = attempt(
        () => JSON.parse(value)?.state?.remember === true,
        false,
      );
      const target = remember ? localStorage : sessionStorage;
      const other = remember ? sessionStorage : localStorage;
      target.setItem(name, value);
      other.removeItem(name); // never keep the session in both places
    }),

  removeItem: (name) =>
    attempt(() => {
      localStorage.removeItem(name);
      sessionStorage.removeItem(name);
    }),
};

export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      isAuthenticated: false,
      remember: false,

      // Call BEFORE login so the tokens are saved in the right storage.
      setRemember: (remember) => set({ remember: Boolean(remember) }),

      login: ({ accessToken, refreshToken, expiresAt, email }) => {
        set({
          accessToken,
          refreshToken,
          expiresAt,
          user: { email },
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          user: null,
          isAuthenticated: false,
          remember: false,
        });
      },
    }),
    {
      name: "auth_session",
      storage: createJSONStorage(() => authStorage),
    },
  ),
);

export default useAuthStore;