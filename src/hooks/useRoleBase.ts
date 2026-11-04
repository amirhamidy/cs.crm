"use client";

import { usePathname } from "next/navigation";

/** Returns "/admin" or "/user" based on the current route. */
export function useRoleBase(): "/admin" | "/user" {
  const pathname = usePathname() ?? "";
  return pathname.startsWith("/admin") ? "/admin" : "/user";
}
