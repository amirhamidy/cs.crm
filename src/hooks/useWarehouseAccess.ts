"use client";

import { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { WAREHOUSE_ENDPOINTS } from "@/lib/warehouseApi";
import { useCurrentEmployee } from "@/hooks/usecurrentemployee";
import { useAuthStore } from "@/store/authStore";
import type { ApiWarehouseStaff } from "@/types/warehouse";
import {
  extractList,
  findEmployeeStaff,
  getEmployeeId,
} from "@/utils/warehouseEmployee";

/**
 * فقط سطح دسترسی کاربر به انبار را مشخص می‌کند
 * (داده‌های انبار در هوک هر تب جداگانه لود می‌شوند).
 */
export default function useWarehouseAccess() {
  const { employee, loading: employeeLoading } = useCurrentEmployee();
  const userType = useAuthStore((state) => state.userType);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const [staff, setStaff] = useState<ApiWarehouseStaff[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);

  const isAdmin = Number(userType) === 1;
  const employeeId = useMemo(() => getEmployeeId(employee), [employee]);

  useEffect(() => {
    if (!hasHydrated || employeeLoading) return;

    let alive = true;
    setStaffLoading(true);

    axiosInstance
      .get(WAREHOUSE_ENDPOINTS.staff)
      .then((res) => {
        if (alive) setStaff(extractList<ApiWarehouseStaff>(res.data));
      })
      .catch(() => {
        if (alive) setStaff([]);
      })
      .finally(() => {
        if (alive) setStaffLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [hasHydrated, employeeLoading]);

  const myStaff = useMemo(
    () => findEmployeeStaff(staff, employeeId),
    [staff, employeeId],
  );

  const isWarehouseStaff = myStaff?.is_active === true;

  return {
    ready: hasHydrated && !employeeLoading && !staffLoading,
    employeeId,
    myStaff,
    isAdmin,
    isWarehouseStaff,
    hasFullAccess: isAdmin || isWarehouseStaff,
    limitedAccess: isAdmin || Boolean(employeeId),
  };
}
