"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, userType, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.replace("/login");
    } else {
      router.replace(userType === 1 ? "/admin/dashboard" : "/user/dashboard");
    }
  }, [hasHydrated, isAuthenticated, userType]);

  return null;
}
