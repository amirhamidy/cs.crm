import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";

interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  setAuth: (user: any, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        Cookies.set("crm-auth", token, { expires: 7, secure: true });
        Cookies.set("crm-role", user.role, { expires: 7, secure: true });
        set({ user, isAuthenticated: true });
      },
      clearAuth: () => {
        Cookies.remove("crm-auth");
        Cookies.remove("crm-role");
        set({ user: null, isAuthenticated: false });
      },
    }),
    { name: "crm-auth-storage" },
  ),
);
