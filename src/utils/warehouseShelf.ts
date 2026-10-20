import type { AxiosError } from "axios";
import type { OrderItemWithShelf } from "@/types/warehouseShelf";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export const SHELF_CODE_MAX_LENGTH = 50;

export function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
    .replace(/٫/g, ".")
    .replace(/،/g, ".");
}

export function normalizeShelfCode(value: string | null | undefined): string {
  return toLatinDigits(String(value ?? "")).trim().toUpperCase();
}

export function parseQuantity(value: string): number {
  const cleaned = toLatinDigits(value).replace(/[^\d.]/g, "");
  if (!cleaned) return NaN;
  return Number(cleaned);
}

export function sanitizeQuantityInput(value: string): string {
  const latin = toLatinDigits(value).replace(/[^\d.]/g, "");
  const firstDot = latin.indexOf(".");
  if (firstDot === -1) return latin;
  return latin.slice(0, firstDot + 1) + latin.slice(firstDot + 1).replace(/\./g, "");
}

export function formatQuantity(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "۰";
  return num.toLocaleString("fa-IR", { maximumFractionDigits: 3 });
}

export function formatToman(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "۰";
  return num.toLocaleString("fa-IR", { maximumFractionDigits: 0 });
}

function flattenMessages(input: unknown, out: string[]): void {
  if (input == null) return;
  if (typeof input === "string") {
    if (input.trim()) out.push(input.trim());
    return;
  }
  if (Array.isArray(input)) {
    input.forEach((item) => flattenMessages(item, out));
    return;
  }
  if (typeof input === "object") {
    Object.values(input as Record<string, unknown>).forEach((item) =>
      flattenMessages(item, out),
    );
  }
}

export function extractApiError(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<unknown>;
  const status = axiosErr?.response?.status;
  const data = axiosErr?.response?.data;

  if (status === 403) return "شما مجوز انجام این عملیات در انبار را ندارید";
  if (status === 404) return "سفارش مورد نظر پیدا نشد";

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const messages: string[] = [];
    flattenMessages(record.detail, messages);
    flattenMessages(record.items, messages);
    flattenMessages(record.non_field_errors, messages);

    if (messages.length === 0) {
      Object.entries(record).forEach(([key, value]) => {
        if (key !== "detail" && key !== "items" && key !== "non_field_errors") {
          flattenMessages(value, messages);
        }
      });
    }

    const unique = Array.from(new Set(messages));
    if (unique.length > 0) return unique.join(" | ");
  }

  if (typeof data === "string" && data.trim() && data.length < 300) return data;

  return fallback;
}

export function resolveOrderWarehouseId(orderTask: unknown): number | null {
  const record = orderTask as Record<string, unknown> | null | undefined;
  if (!record) return null;

  const candidates = [record.warehouse_id, record.id_warehouse, record.warehouse];

  for (const candidate of candidates) {
    if (candidate == null) continue;
    if (typeof candidate === "number" && Number.isFinite(candidate)) return candidate;
    if (typeof candidate === "string" && candidate.trim() && Number.isFinite(Number(candidate))) {
      return Number(candidate);
    }
    if (typeof candidate === "object") {
      const id = (candidate as Record<string, unknown>).id;
      if (typeof id === "number" && Number.isFinite(id)) return id;
    }
  }

  return null;
}

export function getOrderItems(orderTask: unknown): OrderItemWithShelf[] {
  const items = (orderTask as { items?: unknown } | null | undefined)?.items;
  return Array.isArray(items) ? (items as OrderItemWithShelf[]) : [];
}
