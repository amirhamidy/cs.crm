"use client";

import { useEffect } from "react";
import { AUTH_STORAGE_KEYS } from "@/lib/clientAuth";
import { useAuthStore } from "@/store/authStore";

// جلسه را یک‌بار از localStorage می‌خواند و بین تب‌ها همگام نگه می‌دارد
export default function AuthInitializer() {
  const initFromStorage = useAuthStore((state) => state.initFromStorage);

  useEffect(() => {
    initFromStorage();

    const onStorage = (event: StorageEvent) => {
      // خروج/ورود در تب دیگر
      if (event.key === null || AUTH_STORAGE_KEYS.includes(event.key)) {
        initFromStorage();
      }
    };

    window.addEventListener("storage", onStorage);

    return () => window.removeEventListener("storage", onStorage);
  }, [initFromStorage]);

  return null;
}
