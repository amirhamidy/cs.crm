import { create } from "zustand";

interface AuthState {
  username: string | null;
  userType: 1 | 2 | null;
  userId: number | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setAuth: (params: {
    username: string;
    userType: 1 | 2;
    userId: number;
  }) => void;
  clearAuth: () => void;
  initSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  username: null,
  userType: null,
  userId: null,
  isAuthenticated: false,
  hasHydrated: false,

  setAuth: ({ username, userType, userId }) => {
    set({
      username,
      userType,
      userId,
      isAuthenticated: true,
      hasHydrated: true,
    });
  },

  clearAuth: () => {
    set({
      username: null,
      userType: null,
      userId: null,
      isAuthenticated: false,
      hasHydrated: true,
    });
  },

  initSession: async () => {
    try {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        set({
          username: null,
          userType: null,
          userId: null,
          isAuthenticated: false,
          hasHydrated: true,
        });

        return;
      }

      const data = await response.json();

      if (!data.authenticated || !data.user) {
        set({
          username: null,
          userType: null,
          userId: null,
          isAuthenticated: false,
          hasHydrated: true,
        });

        return;
      }

      set({
        username: data.user.username,
        userType: data.user.type,
        userId: data.user.id,
        isAuthenticated: true,
        hasHydrated: true,
      });
    } catch {
      set({
        username: null,
        userType: null,
        userId: null,
        isAuthenticated: false,
        hasHydrated: true,
      });
    }
  },
}));
