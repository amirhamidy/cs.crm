"use client";

import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import type { PermissionAction } from "@/types/access";

export default function Can({
  section,
  action = "view",
  fallback = null,
  children,
}: {
  section: string;
  action?: PermissionAction;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { can } = usePermissions();

  return <>{can(section, action) ? children : fallback}</>;
}
