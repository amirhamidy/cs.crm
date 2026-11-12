"use client";

import { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { AxiosResponse } from "axios";

export type TimeRange = "weekly" | "monthly" | "yearly";

export interface SourceCount {
  resourceId: number;
  name: string;
  value: number;
  color: string;
  glow: string;
}

interface Resource {
  id: number;
  title: string;
}

interface CustomerListItem {
  id: number;
  full_name: string;
  phone_number: string;
  company_name: string;
  status: number;
  status_display: string;
  created_by_username: string;
  created_at: string;
}

interface CustomerDetail {
  id: number;
  full_name: string;
  source: string | null;
  created_at: string;
}

const COLORS = [
  "#a78bfa",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
];

const RANGE_DAYS: Record<TimeRange, number> = {
  weekly: 7,
  monthly: 30,
  yearly: 365,
};

function getRangeStart(range: TimeRange, now: Date): Date {
  const start = new Date(now.getTime());
  start.setTime(start.getTime() - RANGE_DAYS[range] * 24 * 60 * 60 * 1000);
  return start;
}

function isDateInRange(
  createdAtValue: string,
  rangeStart: Date,
  rangeEnd: Date,
): boolean {
  const createdAt = new Date(createdAtValue);

  if (Number.isNaN(createdAt.getTime())) {
    return false;
  }

  return createdAt >= rangeStart && createdAt <= rangeEnd;
}

function buildRangeData(
  details: CustomerDetail[],
  resources: Resource[],
  now: Date,
): Record<TimeRange, SourceCount[]> {
  const ranges: TimeRange[] = ["weekly", "monthly", "yearly"];
  const result = {} as Record<TimeRange, SourceCount[]>;
  const resourceMap = new Map(
    resources.map((resource) => [resource.id, resource.title]),
  );

  for (const range of ranges) {
    const rangeStart = getRangeStart(range, now);

    const filtered = details.filter((customer) => {
      if (!customer.source) {
        return false;
      }

      return isDateInRange(customer.created_at, rangeStart, now);
    });

    const counts = new Map<number, number>();

    for (const customer of filtered) {
      if (!customer.source) {
        continue;
      }

      const sourceId = Number.parseInt(customer.source, 10);

      if (Number.isNaN(sourceId)) {
        continue;
      }

      counts.set(sourceId, (counts.get(sourceId) ?? 0) + 1);
    }

    const rangeItems: SourceCount[] = [];

    counts.forEach((count, resourceId) => {
      const name = resourceMap.get(resourceId) ?? "نامشخص";
      const colorIndex =
        (((resourceId - 1) % COLORS.length) + COLORS.length) % COLORS.length;
      const color = COLORS[colorIndex];
      const glow = `${color}20`;

      rangeItems.push({
        resourceId,
        name,
        value: count,
        color,
        glow,
      });
    });

    rangeItems.sort((a, b) => {
      if (b.value !== a.value) {
        return b.value - a.value;
      }

      return a.name.localeCompare(b.name, "fa");
    });

    result[range] = rangeItems;
  }

  return result;
}

export function useCustomerSources() {
  const [data, setData] = useState<Record<TimeRange, SourceCount[]>>({
    weekly: [],
    monthly: [],
    yearly: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [listRes, resourcesRes] = await Promise.all([
          axiosInstance.get<CustomerListItem[]>("/customers/api/v1/customers/"),
          axiosInstance.get<Resource[]>("/tasks/api/v1/cases/resources/"),
        ]);

        const customers = Array.isArray(listRes.data) ? listRes.data : [];

        const resources = Array.isArray(resourcesRes.data)
          ? resourcesRes.data
          : [];

        const detailResults = await Promise.allSettled(
          customers.map((customer) =>
            axiosInstance.get<CustomerDetail>(
              `/customers/api/v1/customers/${customer.id}/`,
            ),
          ),
        );

        const details: CustomerDetail[] = detailResults
          .filter(
            (
              result,
            ): result is PromiseFulfilledResult<
              AxiosResponse<CustomerDetail>
            > => result.status === "fulfilled",
          )
          .map((result) => result.value.data);
        const now = new Date();
        const rangeData = buildRangeData(details, resources, now);

        if (!cancelled) {
          setData(rangeData);
        }
      } catch (err) {
        console.error("[useCustomerSources]", err);

        if (!cancelled) {
          setError("خطا در بارگذاری داده‌ها");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(
    () => ({
      data,
      loading,
      error,
    }),
    [data, loading, error],
  );
}
