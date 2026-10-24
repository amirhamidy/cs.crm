"use client";

import { useEffect, useState } from "react";
import { accountsApi } from "@/lib/api";
import type { UserOption } from "@/types/minutes";

export function useUserOptions() {
  const [options, setOptions] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [users, employees] = await Promise.all([
          accountsApi.users.all(),
          accountsApi.employees.all().catch(() => []),
        ]);

        const names = new Map<string, string>();
        for (const emp of employees) {
          if (emp.username && emp.full_name) names.set(emp.username.trim().toLowerCase(), emp.full_name);
        }

        const list: UserOption[] = users
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
