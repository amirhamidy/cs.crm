"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, userType } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    } else {
      router.replace(userType === 1 ? "/admin/dashboard" : "/user/dashboard");
    }
  }, [isAuthenticated, userType]);

  return null;
}