"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export const useAuthGuard = (requiredUserType?: 1 | 2) => {
  const router = useRouter();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const userType = useAuthStore((state) => state.userType);
  const initSession = useAuthStore((state) => state.initSession);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      await initSession();

      if (mounted) {
        setIsReady(true);
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [initSession]);

  useEffect(() => {
    if (!isReady || !hasHydrated) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (
      requiredUserType !== undefined &&
      userType !== requiredUserType
    ) {
      router.replace("/login");
    }
  }, [
    isReady,
    hasHydrated,
    isAuthenticated,
    userType,
    requiredUserType,
    router,
  ]);

  return {
    isReady: isReady && hasHydrated,
    isAuthenticated,
    userType,
  };
};