"use client";

import { useMobileSidebarStore } from "@/store/mobileSidebarStore";

export const useSidebar = () => {
  return useMobileSidebarStore();
};
