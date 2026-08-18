// store/authStore.ts
import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
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

function syncCookies(access: string, type: 1 | 2) {
  document.cookie = `crm-access=${access}; Max-Age=86400; path=/`;
  document.cookie = `crm-type=${type}; Max-Age=604800; path=/`;
}

function clearCookies() {
  document.cookie = "crm-access=; Max-Age=0; path=/";
  document.cookie = "crm-type=; Max-Age=0; path=/";
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  username: null,
  userType: null,
  userId: null,
  isAuthenticated: false,
  hasHydrated: false,

  setAuth: ({ access, refresh, username, userType, userId }) => {
    localStorage.setItem("crm-access", access);
    localStorage.setItem("crm-refresh", refresh);
    localStorage.setItem("crm-type", String(userType));
    localStorage.setItem("crm-username", username);
    localStorage.setItem("crm-user-id", String(userId));
    syncCookies(access, userType);
    set({
      accessToken: access,
      refreshToken: refresh,
      username,
      userType,
      userId,
      isAuthenticated: true,
    });
  },

  clearAuth: () => {
    localStorage.removeItem("crm-access");
    localStorage.removeItem("crm-refresh");
    localStorage.removeItem("crm-type");
    localStorage.removeItem("crm-username");
    localStorage.removeItem("crm-user-id");
    clearCookies();
    set({
      accessToken: null,
      refreshToken: null,
      username: null,
      userType: null,
      userId: null,
      isAuthenticated: false,
    });
  },

  initFromStorage: () => {
    const access = localStorage.getItem("crm-access");
    const refresh = localStorage.getItem("crm-refresh");
    const raw = localStorage.getItem("crm-type");
    const username = localStorage.getItem("crm-username");
    const rawId = localStorage.getItem("crm-user-id");
    const userType = raw === "1" ? 1 : raw === "2" ? 2 : null;
    const userId = rawId && rawId !== "undefined" ? Number(rawId) : null;

    if (access && refresh && userType) {
      set({
        accessToken: access,
        refreshToken: refresh,
        username,
        userType,
        userId,
        isAuthenticated: true,
        hasHydrated: true,
      });
    } else {
      set({ hasHydrated: true });
    }
  },
}));
