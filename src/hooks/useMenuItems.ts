"use client";

import { useMemo } from "react";
import { adminMenuItems, userMenuItems } from "@/config/menu";

export function useMenuItems() {
  return useMemo(() => {
    if (typeof window === "undefined") return userMenuItems;
    const role = localStorage.getItem("crm-type");
    return role === "1" ? adminMenuItems : userMenuItems;
  }, []);
}
