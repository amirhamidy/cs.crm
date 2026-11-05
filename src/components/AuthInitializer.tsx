"use client";

import { useEffect } from "react";
import { AUTH_STORAGE_KEYS, getStoredUser } from "@/lib/clientAuth";
import { resetSessionScope } from "@/lib/sessionScope";
import { useAuthStore } from "@/store/authStore";

export default function AuthInitializer() {
  const initFromStorage = useAuthStore((state) => state.initFromStorage);

  useEffect(() => {
    initFromStorage();

    let lastUserId = getStoredUser()?.id ?? null;

    const onStorage = (event: StorageEvent) => {
      if (event.key === null || AUTH_STORAGE_KEYS.includes(event.key)) {
        // Another tab signed in as someone else: this tab's caches are not theirs.
        const nextUserId = getStoredUser()?.id ?? null;

        if (nextUserId !== lastUserId) {
          lastUserId = nextUserId;
          resetSessionScope();
        }

        initFromStorage();
      }
    };

    window.addEventListener("storage", onStorage);

    return () => window.removeEventListener("storage", onStorage);
  }, [initFromStorage]);

  return null;
}
