"use client";

import { useMemo } from "react";
import { adminMenuItems, userMenuItems } from "@/config/menu";
import { useAuthStore } from "@/store/authStore";

export function useMenuItems() {
  const userType = useAuthStore((s) => s.userType);
  return useMemo(() => {
    return userType === 1 ? adminMenuItems : userMenuItems;
  }, [userType]);
}
