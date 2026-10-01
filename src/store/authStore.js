import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      isAuthenticated: false,

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
        });
      },
    }),
    {
      name: "auth_session",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useAuthStore;