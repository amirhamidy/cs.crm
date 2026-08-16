"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function useAuthGuard(requiredType?: 1 | 2) {
  const { isAuthenticated, userType, initFromStorage } = useAuthStore();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initFromStorage();
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (requiredType && userType !== requiredType) {
      router.replace("/login");
    }
  }, [isReady, isAuthenticated, userType, requiredType, router]);

  return { isReady };
}
