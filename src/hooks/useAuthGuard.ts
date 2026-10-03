"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export const useAuthGuard = (requiredUserType?: 1 | 2) => {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const userType = useAuthStore((state) => state.userType);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.replace("/login/");
      return;
    }

    if (requiredUserType !== undefined && userType !== requiredUserType) {
      router.replace("/login/");
    }
  }, [hasHydrated, isAuthenticated, userType, requiredUserType, router]);

  return {
    isReady: hasHydrated,
    isAuthenticated,
    userType,
  };
};
