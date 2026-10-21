"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiEmployee, ApiUser } from "@/types/users";
import type { UserOption } from "@/types/minutes";

const unwrap = <T,>(data: T[] | { results?: T[] } | null | undefined): T[] =>
  Array.isArray(data) ? data : data?.results ?? [];

/**
 * فهرست کاربران فعال برای انتخاب امضاکننده‌ی داخلی.
 * id برگردانده‌شده همان User.id است (مقداری که در signer.user ارسال می‌شود).
 */
export function useUserOptions() {
  const [options, setOptions] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [usersRes, employeesRes] = await Promise.all([
          axiosInstance.get<ApiUser[] | { results?: ApiUser[] }>("/accounts/api/v1/user/list/"),
          axiosInstance
            .get<ApiEmployee[]>("/accounts/api/v1/employee/list/")
            .catch(() => ({ data: [] as ApiEmployee[] })),
        ]);

        const names = new Map<string, string>();
        for (const emp of unwrap(employeesRes.data)) {
          if (emp.username && emp.full_name) names.set(emp.username.trim().toLowerCase(), emp.full_name);
        }

        const list: UserOption[] = unwrap(usersRes.data)
          .filter((user) => user.is_active !== false)
          .map((user) => {
            const fullName = names.get(user.username.trim().toLowerCase());
            return {
              id: user.id,
              username: user.username,
              label: fullName || user.username,
              phone: user.phone_number || null,
            };
          })
          .sort((a, b) => a.label.localeCompare(b.label, "fa"));

        if (alive) setOptions(list);
      } catch {
        if (alive) setOptions([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { options, loading };
}
