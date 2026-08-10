import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";

export type TimeRange = "weekly" | "monthly" | "yearly";

export type SliceKey = "instagram" | "website" | "referral" | "ads" | "other";

export interface SourceCount {
  name: SliceKey;
  value: number;
}

interface CustomerListItem {
  id: number;
}

interface CustomerDetail {
  id: number;
  source?: string;
  created_at: string;
}

type RangeData = Record<TimeRange, SourceCount[]>;

const SOURCE_NORMALIZE_MAP: Record<string, SliceKey> = {
  instagram: "instagram",
  insta: "instagram",
  اینستاگرام: "instagram",
  website: "website",
  سایت: "website",
  وبسایت: "website",
  referral: "referral",
  معرفی: "referral",
  ads: "ads",
  تبلیغات: "ads",
};

function normalizeSource(raw?: string): SliceKey {
  if (!raw) return "other";
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  return (
    SOURCE_NORMALIZE_MAP[lower] ?? SOURCE_NORMALIZE_MAP[trimmed] ?? "other"
  );
}

function buildEmptyCounts(): Record<SliceKey, number> {
  return {
    instagram: 0,
    website: 0,
    referral: 0,
    ads: 0,
    other: 0,
  };
}

function toCountArray(map: Record<SliceKey, number>): SourceCount[] {
  return Object.entries(map)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({
      name: name as SliceKey,
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

async function fetchAllCustomerIds(): Promise<number[]> {
  const ids: number[] = [];
  let url = "/customers/api/v1/customers/";

  while (url) {
    const res = await axiosInstance.get(url);
    const data = res.data;

    const items: CustomerListItem[] = Array.isArray(data)
      ? data
      : (data.results ?? []);

    ids.push(...items.map((c) => c.id));

    if (!Array.isArray(data) && data.next) {
      const parsed = new URL(data.next);
      url = parsed.pathname + parsed.search;
    } else {
      url = "";
    }
  }

  return ids;
}

async function fetchDetailsInBatches(
  ids: number[],
  batchSize = 20,
): Promise<CustomerDetail[]> {
  const results: CustomerDetail[] = [];

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const settled = await Promise.allSettled(
      batch.map((id) =>
        axiosInstance
          .get<CustomerDetail>(`/customers/api/v1/customers/${id}/`)
          .then((r) => r.data),
      ),
    );

    settled.forEach((s) => {
      if (s.status === "fulfilled") results.push(s.value);
    });
  }

  return results;
}

function buildRangeData(details: CustomerDetail[]): RangeData {
  const now = Date.now();
  const weeklyCutoff = now - 7 * 24 * 60 * 60 * 1000;
  const monthlyCutoff = now - 30 * 24 * 60 * 60 * 1000;
  const yearlyCutoff = now - 365 * 24 * 60 * 60 * 1000;

  const weekly = buildEmptyCounts();
  const monthly = buildEmptyCounts();
  const yearly = buildEmptyCounts();

  details.forEach((item) => {
    const createdAt = new Date(item.created_at).getTime();
    if (Number.isNaN(createdAt)) return;

    const source = normalizeSource(item.source);

    if (createdAt >= yearlyCutoff) {
      yearly[source] += 1;
    }
    if (createdAt >= monthlyCutoff) {
      monthly[source] += 1;
    }
    if (createdAt >= weeklyCutoff) {
      weekly[source] += 1;
    }
  });

  return {
    weekly: toCountArray(weekly),
    monthly: toCountArray(monthly),
    yearly: toCountArray(yearly),
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

        const ids = await fetchAllCustomerIds();
        const details = await fetchDetailsInBatches(ids);
        const rangeData = buildRangeData(details);

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
