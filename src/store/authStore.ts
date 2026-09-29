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
}));
