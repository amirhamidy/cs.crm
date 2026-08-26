"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";

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

function getRangeStart(range: TimeRange): Date {
  const now = new Date();
  const d = new Date(now);
  if (range === "weekly") {
    d.setDate(d.getDate() - 7);
  } else if (range === "monthly") {
    d.setDate(d.getDate() - 30);
  } else {
    d.setDate(d.getDate() - 365);
  }
  return d;
}

function buildRangeData(
  details: CustomerDetail[],
  resources: Resource[],
): Record<TimeRange, SourceCount[]> {
  const ranges: TimeRange[] = ["weekly", "monthly", "yearly"];
  const result = {} as Record<TimeRange, SourceCount[]>;
  const resourceMap = new Map(resources.map((r) => [r.id, r.title]));

  for (const range of ranges) {
    const start = getRangeStart(range);
    const filtered = details.filter((c) => {
      if (!c.source) return false;
      const createdAt = new Date(c.created_at);
      return createdAt >= start;
    });

    const counts: Record<number, number> = {};
    for (const c of filtered) {
      if (!c.source) continue;
      const sourceId = parseInt(c.source, 10);
      if (isNaN(sourceId)) continue;
      counts[sourceId] = (counts[sourceId] ?? 0) + 1;
    }

    const arr: SourceCount[] = [];
    for (const [id, count] of Object.entries(counts)) {
      const resourceId = parseInt(id, 10);
      const name = resourceMap.get(resourceId) ?? "نامشخص";
      const colorIndex = (resourceId - 1) % COLORS.length;
      const color = COLORS[colorIndex];
      const glow = `${color}20`;
      arr.push({ resourceId, name, value: count, color, glow });
    }

    arr.sort((a, b) => b.value - a.value);
    result[range] = arr;
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

        const customers: CustomerListItem[] = Array.isArray(listRes.data)
          ? listRes.data
          : [];
        const resources: Resource[] = Array.isArray(resourcesRes.data)
          ? resourcesRes.data
          : [];

        const detailResults = await Promise.allSettled(
          customers.map((c) =>
            axiosInstance.get<CustomerDetail>(
              `/customers/api/v1/customers/${c.id}/`,
            ),
          ),
        );

        const details: CustomerDetail[] = detailResults
          .filter((r) => r.status === "fulfilled")
          .map(
            (r) =>
              (r as PromiseFulfilledResult<{ data: CustomerDetail }>).value
                .data,
          );

        const rangeData = buildRangeData(details, resources);

        if (!cancelled) setData(rangeData);
      } catch (err) {
        console.error("[useCustomerSources]", err);
        if (!cancelled) setError("خطا در بارگذاری داده‌ها");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
