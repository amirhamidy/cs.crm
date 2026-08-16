import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";

export type TimeRange = "weekly" | "monthly" | "yearly";
export type Trend = "up" | "down" | "same";

export interface User {
  id: number;
  name: string;
  role: string;
  avatar: string;
  count: number;
  trend: Trend;
  trendPct: number;
}

interface CustomerListItem {
  id: number;
  status: number;
  created_by_username: string;
  created_at: string;
}

type RangeData = Record<TimeRange, User[]>;

async function fetchAllCustomers(): Promise<CustomerListItem[]> {
  const items: CustomerListItem[] = [];
  let url = "/customers/api/v1/customers/";

  while (url) {
    const res = await axiosInstance.get(url);
    const data = res.data;
    const pageItems: CustomerListItem[] = Array.isArray(data) ? data : (data.results ?? []);
    items.push(...pageItems);

    if (!Array.isArray(data) && data.next) {
      const parsed = new URL(data.next);
      url = parsed.pathname + parsed.search;
    } else {
      url = "";
    }
  }
  return items;
}

function processRangeData(customers: CustomerListItem[], range: TimeRange): User[] {
  const now = Date.now();
  let duration = 30 * 24 * 60 * 60 * 1000;
  if (range === "weekly") duration = 7 * 24 * 60 * 60 * 1000;
  else if (range === "yearly") duration = 365 * 24 * 60 * 60 * 1000;

  const cutoff = now - duration;
  const midPoint = now - duration / 2;

  const currentCounts: Record<string, number> = {};
  const previousCounts: Record<string, number> = {};

  customers.forEach((c) => {
    if (c.status !== 2) return; 
    const createdAt = new Date(c.created_at).getTime();
    if (Number.isNaN(createdAt) || createdAt < cutoff) return;

    const username = c.created_by_username || "نامشخص";
    if (createdAt >= midPoint) {
      currentCounts[username] = (currentCounts[username] ?? 0) + 1;
    } else {
      previousCounts[username] = (previousCounts[username] ?? 0) + 1;
    }
  });

  const allUsernames = Array.from(new Set([...Object.keys(currentCounts), ...Object.keys(previousCounts)]));

  return allUsernames.map((username, index) => {
    const current = currentCounts[username] ?? 0;
    const previous = previousCounts[username] ?? 0;
    const total = current + previous;

    let trend: Trend = "same";
    let trendPct = 0;

    if (previous > 0) {
      const diff = current - previous;
      trendPct = Math.round((Math.abs(diff) / previous) * 100);
      trend = diff > 0 ? "up" : diff < 0 ? "down" : "same";
    } else if (current > 0) {
      trend = "up";
      trendPct = 100;
    }

    return {
      id: index + 1,
      name: username === "admin" ? "مدیر سیستم" : username,
      role: "کارشناس فروش",
      avatar: username.charAt(0).toUpperCase(),
      count: total,
      trend,
      trendPct,
    };
  }).sort((a, b) => b.count - a.count).slice(0, 5);
}

export function useTopUsers() {
  const [data, setData] = useState<RangeData>({ weekly: [], monthly: [], yearly: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchAllCustomers().then(res => {
      if (!active) return;
      setData({
        weekly: processRangeData(res, "weekly"),
        monthly: processRangeData(res, "monthly"),
        yearly: processRangeData(res, "yearly"),
      });
      setLoading(false);
    }).catch(() => {
      if (active) { setError("خطا در دریافت لیست برترین‌ها"); setLoading(false); }
    });
    return () => { active = false; };
  }, []);

  return { data, loading, error };
}
