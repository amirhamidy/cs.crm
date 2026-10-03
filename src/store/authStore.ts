"use client";

import { create } from "zustand";
import {
  clearSession,
  getStoredUser,
  saveSession,
} from "@/lib/clientAuth";

export interface AuthState {
  username: string | null;
  userType: 1 | 2 | null;
  userId: number | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setAuth: (params: {
    access: string;
    refresh: string;
    username: string;
    userType: 1 | 2;
    userId: number;
  }) => void;
  clearAuth: () => void;
  initFromStorage: () => void;
}

// توکن‌ها فقط در localStorage نگه داشته می‌شوند (نه در state)؛ state فقط هویت کاربر است.
export const useAuthStore = create<AuthState>((set) => ({
  username: null,
  userType: null,
  userId: null,
  isAuthenticated: false,
  hasHydrated: false,

  setAuth: ({ access, refresh, username, userType, userId }) => {
    saveSession({
      access,
      refresh,
      user: { id: userId, username, type: userType },
    });

    set({
      username,
      userType,
      userId,
      isAuthenticated: true,
      hasHydrated: true,
    });
  },

  clearAuth: () => {
    clearSession();

    set({
      username: null,
      userType: null,
      userId: null,
      isAuthenticated: false,
      hasHydrated: true,
    });
  },

  initFromStorage: () => {
    const user = getStoredUser();

    if (user) {
      set({
        username: user.username,
        userType: user.type,
        userId: user.id,
        isAuthenticated: true,
        hasHydrated: true,
      });
    } else {
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
