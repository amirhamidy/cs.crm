import axiosInstance from "@/lib/axiosInstance";
import type {
  GlobalSearchApiResponse,
  GlobalSearchApiResult,
  GlobalSearchResult,
} from "@/types/globalSearch";

const GLOBAL_SEARCH_API = "/search/api/v1/global/";

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .toLocaleLowerCase("fa-IR")
    .replace(/ي/g, "ی")
    .replace(/ى/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "customer":
      return "مشتری";
    case "employee":
      return "کارمند";
    case "department":
      return "دپارتمان";
    case "case":
      return "پرونده";
    case "task":
      return "وظیفه";
    case "internal_task":
      return "تسک درون‌سازمانی";
    case "note":
      return "یادداشت";
    case "calendar":
      return "تقویم";
    default:
      return type || "نتیجه";
  }
}

function getHref(type: string, userType: number | null): string {
  const isAdmin = userType === 1;

  switch (type) {
    case "customer":
      return isAdmin ? "/admin/customer" : "/user/customer";

    case "employee":
      return isAdmin ? "/admin/users" : "/user/dashboard";

    case "department":
      return isAdmin ? "/admin/departments" : "/user/dashboard";

    case "case":
      return isAdmin ? "/admin/cases" : "/user/cases";

    case "task":
      return isAdmin ? "/admin/tasks" : "/user/tasks";

    case "internal_task":
      return isAdmin ? "/admin/calendar" : "/user/calendar";

    case "note":
    case "calendar":
      return isAdmin ? "/admin/calendar" : "/user/calendar";

    default:
      return isAdmin ? "/admin/dashboard" : "/user/dashboard";
  }
}

function normalizeResult(
  result: GlobalSearchApiResult,
  userType: number | null,
): GlobalSearchResult {
  return {
    ...result,
    title: result.title || "بدون عنوان",
    subtitle: result.subtitle || "",
    description: result.description || "",
    score: typeof result.score === "number" ? result.score : 0,
    typeLabel: getTypeLabel(result.type),
    href: getHref(result.type, userType),
  };
}

export async function searchGlobal(
  query: string,
  userType: number | null,
): Promise<GlobalSearchResult[]> {
  const normalizedQuery = normalizeText(query);

  if (normalizedQuery.length < 2) {
    return [];
  }

  try {
    const response = await axiosInstance.get<GlobalSearchApiResponse>(
      GLOBAL_SEARCH_API,
      {
        params: {
          q: query.trim(),
        },
      },
    );

    const data = response.data;

    if (!data || !Array.isArray(data.results)) {
      return [];
    }

    return data.results
      .map((result) => normalizeResult(result, userType))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  } catch {
    return [];
  }
}

export function normalizeSearchText(value: unknown): string {
  return normalizeText(value);
}
