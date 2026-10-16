"use client";

import { useEffect } from "react";
import { AUTH_STORAGE_KEYS } from "@/lib/clientAuth";
import { useAuthStore } from "@/store/authStore";

export default function AuthInitializer() {
  const initFromStorage = useAuthStore((state) => state.initFromStorage);

  useEffect(() => {
    initFromStorage();

    const onStorage = (event: StorageEvent) => {
      if (event.key === null || AUTH_STORAGE_KEYS.includes(event.key)) {
        initFromStorage();
      }
    };

    window.addEventListener("storage", onStorage);

    return () => window.removeEventListener("storage", onStorage);
  }, [initFromStorage]);

  return null;
}
