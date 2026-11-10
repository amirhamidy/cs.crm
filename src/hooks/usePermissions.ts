"use client";

import { useEffect, useMemo, useState } from "react";
import { accessApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { PermissionAction, PermissionMap } from "@/types/access";

export function usePermissions() {
  const userType = useAuthStore((state) => state.userType);
  const userId = useAuthStore((state) => state.userId);
  const [permissions, setPermissions] = useState<PermissionMap | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (userType === 1) {
      setPermissions(null);
      setLoaded(true);
      return;
    }
    if (userType !== 2 || userId == null) {
      setPermissions(null);
      setLoaded(false);
      return;
    }

    let active = true;
    setPermissions(null);
    setLoaded(false);
    accessApi.me(userId).then((result) => {
      if (!active) return;
      setPermissions(result.permissions ?? {});
      setLoaded(true);
    }).catch(() => {
      if (!active) return;
      setPermissions({});
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [userType, userId]);

  return useMemo(() => {
    const isManager = userType === 1;
    const can = (section: string, action: PermissionAction = "view") =>
      isManager || Boolean(permissions?.[section]?.[action]);
    return { isManager, loaded: isManager || loaded, can };
  }, [userType, permissions, loaded]);
}
