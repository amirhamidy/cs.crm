"use client";

import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";

export const useLogout = () => {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const silentLogout = async () => {
    try {
      await authService.logout();
    } finally {
      clearAuth();
    }
  };

  const logout = async () => {
    await silentLogout();
    router.replace("/login");
  };

  return {
    logout,
    silentLogout,
  };
};
