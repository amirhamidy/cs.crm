"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { Crown } from "lucide-react";
import { salesApi } from "@/lib/api/sales";
import type { Product, TopCustomerRow, TopCustomersBy } from "@/types/sales";
import { extractFieldErrors } from "@/lib/parseApiErrors";
import { apiMessage } from "@/lib/apiMessage";
import { dateRangeError } from "@/lib/dateRange";
import { formatJalaliDate, formatNumber } from "@/lib/format";
import { toPersianDigits } from "@/lib/jalali";
import { useRoleBase } from "@/hooks/useRoleBase";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/Feedback";
import { TableSkeleton } from "@/components/ui/skeletons";

const fieldCls =
  "h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-gray-100";

interface Filters {
  by: TopCustomersBy;
  limit: string;
  product: string;
  date_from: string;
  date_to: string;
}

const INITIAL: Filters = { by: "amount", limit: "10", product: "", date_from: "", date_to: "" };

const rankColor = (r: number) =>
  r === 1
    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
    : r === 2
      ? "bg-gray-200 text-gray-700 dark:bg-white/15 dark:text-gray-200"
      : r === 3
        ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300"
        : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300";

export default function TopCustomersPage() {
  const base = useRoleBase();
  const [draft, setDraft] = useState<Filters>(INITIAL);
  const [applied, setApplied] = useState<Filters>(INITIAL);
  const [products, setProducts] = useState<Product[]>([]);
  const [rows, setRows] = useState<TopCustomerRow[]>([]);
  const [by, setBy] = useState<TopCustomersBy>("amount");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    salesApi.products
      .active()
      .then((p) => setProducts(p.results))
      .catch(() => setProducts([]));
  }, []);

  const load = useCallback(async (f: Filters) => {
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      const limit = Number(f.limit);
      const res = await salesApi.topCustomers({
        by: f.by,
        limit: Number.isInteger(limit) && limit >= 1 ? Math.min(limit, 100) : 10,
        product: f.product ? Number(f.product) : undefined,
        date_from: f.date_from || undefined,
        date_to: f.date_to || undefined,
      });
      setRows(res.results);
      setBy(res.by);
    } catch (e) {
      const fe = extractFieldErrors(e, ["by", "limit", "product", "date_from", "date_to"]);
      if (fe && Object.keys(fe).length) setFieldErrors(fe);
      setError(apiMessage(e, "دریافت گزارش با خطا مواجه شد"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(applied);
  }, [applied, load]);

  const rangeErr = dateRangeError(draft.date_from, draft.date_to);
  const limitNum = Number(draft.limit);
  const limitErr =
    draft.limit !== "" && (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100)
      ? "عددی صحیح بین ۱ تا ۱۰۰ وارد کنید"
      : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rangeErr || limitErr) return;
    setApplied(draft);
  };

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const errText = (k: string, local?: string | null) => local ?? fieldErrors[k];

  return (
    <div className="space-y-4 p-4">
      <PageHeader
        title="گزارش برترین مشتریان بر اساس فروش"
        subtitle="مشتریان با بیشترین خرید در بازهٔ انتخابی"
        icon={<Crown size={20} />}
      />

      <form onSubmit={submit} className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 p-3 dark:border-white/10 sm:grid-cols-2 lg:grid-cols-6">
        <label className="text-[12px] text-gray-500">
          مبنای رتبه‌بندی
          <select className={fieldCls} value={draft.by} onChange={(e) => set("by", e.target.value as TopCustomersBy)}>
            <option value="amount">مبلغ خرید</option>
            <option value="quantity">مقدار خرید (کیلوگرم)</option>
          </select>
          {errText("by") && <span className="text-[11px] text-red-500">{errText("by")}</span>}
        </label>
        <label className="text-[12px] text-gray-500">
          تعداد نتایج
          <input className={fieldCls} inputMode="numeric" value={draft.limit} onChange={(e) => set("limit", e.target.value)} />
          {errText("limit", limitErr) && <span className="text-[11px] text-red-500">{errText("limit", limitErr)}</span>}
        </label>
        <label className="text-[12px] text-gray-500">
          محصول
          <select className={fieldCls} value={draft.product} onChange={(e) => set("product", e.target.value)}>
            <option value="">همهٔ محصولات</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {errText("product") && <span className="text-[11px] text-red-500">{errText("product")}</span>}
        </label>
        <label className="text-[12px] text-gray-500">
          از تاریخ
          <input type="date" className={fieldCls} value={draft.date_from} onChange={(e) => set("date_from", e.target.value)} />
          {errText("date_from", rangeErr) && <span className="text-[11px] text-red-500">{errText("date_from", rangeErr)}</span>}
        </label>
        <label className="text-[12px] text-gray-500">
          تا تاریخ
          <input type="date" className={fieldCls} value={draft.date_to} onChange={(e) => set("date_to", e.target.value)} />
          {errText("date_to") && <span className="text-[11px] text-red-500">{errText("date_to")}</span>}
        </label>
        <div className="flex items-end gap-2">
          <Button type="submit" disabled={!!rangeErr || !!limitErr || loading}>اعمال</Button>
          <Button
            type="button"
            variant="soft"
            onClick={() => {
              setDraft(INITIAL);
              setApplied(INITIAL);
            }}
          >
            حذف فیلترها
          </Button>
        </div>
      </form>

      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load(applied)} />
      ) : rows.length === 0 ? (
        <EmptyState title="فروشی در این بازه ثبت نشده است" description="فیلترها را تغییر دهید." icon={<Crown size={28} />} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10">
          <table className="w-full min-w-[860px] text-right text-[13px]">
            <thead className="bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-gray-400">
              <tr>
                {["رتبه", "مشتری", "تعداد فروش", "مقدار (کیلوگرم)", "مبلغ کل", "پرفروش‌ترین محصول", "آخرین خرید"].map((h) => (
                  <th key={h} className={`px-3 py-3 font-bold ${(h === "مقدار (کیلوگرم)" && by === "quantity") || (h === "مبلغ کل" && by === "amount") ? "text-brand" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <m.tr key={r.customer_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-gray-100 dark:border-white/5">
                  <td className="px-3 py-3">
                    <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 font-black ${rankColor(r.rank)}`}>
                      {toPersianDigits(r.rank)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Link href={`${base}/customer/${r.customer_id}`} className="font-black text-gray-900 hover:text-brand dark:text-white">
                      {r.full_name}
                    </Link>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{r.company_name || "—"}</p>
                  </td>
                  <td className="px-3 py-3">{toPersianDigits(r.sales_count)}</td>
                  <td className="px-3 py-3">{formatNumber(r.total_quantity_kg)}</td>
                  <td className="px-3 py-3 font-bold">{formatNumber(r.total_amount)}</td>
                  <td className="px-3 py-3">
                    {r.top_product ? (
                      <>
                        <p>{r.top_product.name}</p>
                        <p className="text-[11px] text-gray-500">{formatNumber(r.top_product.quantity_kg)} کیلوگرم</p>
                      </>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-3">{formatJalaliDate(r.last_sale_date)}</td>
                </m.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
