"use client";

import { useMemo } from "react";
import { adminMenuItems, userMenuItems } from "@/config/menu";
import { useAuthStore } from "@/store/authStore";
import { usePermissions } from "@/hooks/usePermissions";

export function useMenuItems() {
  const userType = useAuthStore((state) => state.userType);
  const { can } = usePermissions();

  return useMemo(() => {
    if (userType === 1) return adminMenuItems;
    return userMenuItems.filter(
      (item) => !item.permission || can(item.permission.section, item.permission.action),
    );
  }, [userType, can]);
}
