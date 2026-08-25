import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";

export type TimeRange = "weekly" | "monthly" | "yearly";

export interface CaseResource {
  id: number;
  title: string;
}

export interface CaseItem {
  id: number;
  customer: number;
  created_by?: number | null;
  title: string;
  resources?: CaseResource[];
  created_at: string;
  updated_at?: string;
}

export interface SourceCount {
  name: string;
  resourceId: number;
  value: number;
  color: string;
  glow: string;
}

type RangeData = Record<TimeRange, SourceCount[]>;

const PALETTE = [
  { color: "#f472b6", glow: "rgba(244,114,182,0.35)" },
  { color: "#38bdf8", glow: "rgba(56,189,248,0.35)" },
  { color: "#4ade80", glow: "rgba(74,222,128,0.35)" },
  { color: "#fb923c", glow: "rgba(251,146,60,0.35)" },
  { color: "#a78bfa", glow: "rgba(167,139,250,0.35)" },
  { color: "#facc15", glow: "rgba(250,204,21,0.35)" },
  { color: "#2dd4bf", glow: "rgba(45,212,191,0.35)" },
  { color: "#ec4899", glow: "rgba(236,72,153,0.35)" },
  { color: "#818cf8", glow: "rgba(129,140,248,0.35)" },
];

function extractList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const obj = data as { results?: T[]; data?: T[] };
    if (Array.isArray(obj.results)) return obj.results;
    if (Array.isArray(obj.data)) return obj.data;
  }
  return [];
}

async function fetchAllCases(): Promise<CaseItem[]> {
  const items: CaseItem[] = [];
  let url = "/tasks/api/v1/cases/";

  while (url) {
    const res = await axiosInstance.get(url);
    const data = res.data;

    const list = extractList<CaseItem>(data);
    items.push(...list);

    if (data && typeof data === "object" && !Array.isArray(data) && data.next) {
      const parsed = new URL(data.next);
      url = parsed.pathname + parsed.search;
    } else {
      url = "";
    }
  }

  return items;
}

function buildRangeData(cases: CaseItem[], allResources: CaseResource[]): RangeData {
  const now = Date.now();
  const weeklyCutoff = now - 7 * 24 * 60 * 60 * 1000;
  const monthlyCutoff = now - 30 * 24 * 60 * 60 * 1000;
  const yearlyCutoff = now - 365 * 24 * 60 * 60 * 1000;

  const resourceTitleMap = new Map<number, string>();
  allResources.forEach((r) => resourceTitleMap.set(r.id, r.title));

  const weeklyCounts: Record<number, number> = {};
  const monthlyCounts: Record<number, number> = {};
  const yearlyCounts: Record<number, number> = {};

  allResources.forEach((r) => {
    weeklyCounts[r.id] = 0;
    monthlyCounts[r.id] = 0;
    yearlyCounts[r.id] = 0;
  });

  cases.forEach((item) => {
    const createdAt = new Date(item.created_at).getTime();
    if (Number.isNaN(createdAt)) return;

    const resList = item.resources ?? [];

    resList.forEach((r) => {
      if (!resourceTitleMap.has(r.id)) {
        resourceTitleMap.set(r.id, r.title);
        weeklyCounts[r.id] = weeklyCounts[r.id] || 0;
        monthlyCounts[r.id] = monthlyCounts[r.id] || 0;
        yearlyCounts[r.id] = yearlyCounts[r.id] || 0;
      }

      if (createdAt >= yearlyCutoff) {
        yearlyCounts[r.id] = (yearlyCounts[r.id] || 0) + 1;
      }
      if (createdAt >= monthlyCutoff) {
        monthlyCounts[r.id] = (monthlyCounts[r.id] || 0) + 1;
      }
      if (createdAt >= weeklyCutoff) {
        weeklyCounts[r.id] = (weeklyCounts[r.id] || 0) + 1;
      }
    });
  });

  const getMappedArray = (counts: Record<number, number>): SourceCount[] => {
    return Object.entries(counts)
      .map(([resIdStr, value], index) => {
        const resourceId = Number(resIdStr);
        const name = resourceTitleMap.get(resourceId) || `منبع #${resourceId}`;
        const paletteItem = PALETTE[index % PALETTE.length];
        return {
          name,
          resourceId,
          value,
          color: paletteItem.color,
          glow: paletteItem.glow,
        };
      })
      .sort((a, b) => b.value - a.value);
  };

  return {
    weekly: getMappedArray(weeklyCounts),
    monthly: getMappedArray(monthlyCounts),
    yearly: getMappedArray(yearlyCounts),
  };
}

export function useCustomerSources() {
  const [data, setData] = useState<RangeData>({
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

        const [casesRes, resourcesRes] = await Promise.allSettled([
          fetchAllCases(),
          axiosInstance.get("/tasks/api/v1/cases/resources/"),
        ]);

        const cases = casesRes.status === "fulfilled" ? casesRes.value : [];
        const resources =
          resourcesRes.status === "fulfilled"
            ? extractList<CaseResource>(resourcesRes.value.data)
            : [];

        if (casesRes.status === "rejected" && resourcesRes.status === "rejected") {
          throw new Error("Failed to fetch cases and resources");
        }

        const rangeData = buildRangeData(cases, resources);

        if (cancelled) return;
        setData(rangeData);
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
