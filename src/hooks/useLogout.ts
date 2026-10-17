"use client";

import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { getRefreshToken } from "@/lib/clientAuth";
import { useAuthStore } from "@/store/authStore";

export const useLogout = () => {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const silentLogout = async () => {
    const refresh = getRefreshToken();

    clearAuth();
    void authService.logout(refresh);
  };

  const logout = async () => {
    await silentLogout();
    router.replace("/login/");
  };

  return {
    logout,
    silentLogout,
  };
};
