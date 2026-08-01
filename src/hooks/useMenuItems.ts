"use client";

import { useMemo } from "react";
import Cookies from "js-cookie";
import { adminMenuItems, userMenuItems } from "@/config/menu";

export function useMenuItems() {
  return useMemo(() => {
    const role = Cookies.get("crm-role");
    return role === "admin" ? adminMenuItems : userMenuItems;
  }, []);
}
