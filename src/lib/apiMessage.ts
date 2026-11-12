import type { AxiosError } from "axios";
import { parseApiErrors } from "@/lib/parseApiErrors";

export function apiMessage(error: unknown, fallback = "انجام عملیات با خطا مواجه شد"): string {
  const general = parseApiErrors(error, fallback).general;
  if (general && general !== fallback) return general;
  const data = (error as AxiosError<Record<string, unknown>>)?.response?.data;
  if (data && typeof data === "object") {
    const detail = data.detail ?? data.non_field_errors;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length) return String(detail[0]);
    const messages = Object.entries(data)
      .filter(([key]) => key !== "detail")
      .flatMap(([key, value]) => {
        const items = Array.isArray(value) ? value : [value];
        return items.filter((item) => typeof item === "string").map(String);
      });
    if (messages.length) return messages.join("، ");
  }
  return fallback;
}
