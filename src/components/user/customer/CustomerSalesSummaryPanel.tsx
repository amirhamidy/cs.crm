"use client";

import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { salesApi } from "@/lib/api/sales";
import type { CustomerSalesSummary } from "@/types/sales";
import { apiMessage } from "@/lib/apiMessage";
import { dateRangeError } from "@/lib/dateRange";
import { formatJalaliDate, formatNumber } from "@/lib/format";
import { toPersianDigits } from "@/lib/jalali";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/Feedback";
import { StatCardsSkeleton } from "@/components/ui/skeletons";

const fieldCls =
  "h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-gray-100";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 p-3 dark:border-white/10">
      <p className="text-[11.5px] text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-[15px] font-black text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

/** Bar width is a display-only ratio of the server-provided figures. */
function barPct(part: string, total: string): number {
  const p = Number(part);
  const t = Number(total);
  if (!Number.isFinite(p) || !Number.isFinite(t) || t <= 0) return 0;
  return Math.max(2, Math.min(100, (p / t) * 100));
}

export default function CustomerSalesSummaryPanel({ customerId }: { customerId: number }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [range, setRange] = useState({ from: "", to: "" });
  const [data, setData] = useState<CustomerSalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(
        await salesApi.customerSummary(customerId, {
          date_from: range.from || undefined,
          date_to: range.to || undefined,
        }),
      );
    } catch (e) {
      setData(null);
      setError(
        isAxiosError(e) && e.response?.status === 404
          ? "مشتری پیدا نشد"
          : apiMessage(e, "دریافت خلاصهٔ فروش با خطا مواجه شد"),
      );
    } finally {
      setLoading(false);
    }
  }, [customerId, range]);

  useEffect(() => {
    load();
  }, [load]);

  const rangeErr = dateRangeError(from, to);

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!rangeErr) setRange({ from, to });
        }}
      >
        <label className="text-[12px] text-gray-500">
          از تاریخ
          <input type="date" className={`${fieldCls} block`} value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="text-[12px] text-gray-500">
          تا تاریخ
          <input type="date" className={`${fieldCls} block`} value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <Button type="submit" disabled={!!rangeErr || loading}>اعمال</Button>
        {(range.from || range.to) && (
          <Button
            type="button"
            variant="soft"
            onClick={() => {
              setFrom("");
              setTo("");
              setRange({ from: "", to: "" });
            }}
          >
            حذف بازه
          </Button>
        )}
        {rangeErr && <p className="w-full text-[12px] text-red-500">{rangeErr}</p>}
      </form>

      {loading ? (
        <StatCardsSkeleton count={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !data || data.sales_count === 0 ? (
        <EmptyState
          title="هیچ فروشی ثبت نشده است"
          description={range.from || range.to ? "در این بازه فروشی برای مشتری نیست." : "برای این مشتری هنوز فروشی ثبت نشده است."}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="تعداد فروش" value={toPersianDigits(data.sales_count)} />
            <Stat label="مقدار کل (کیلوگرم)" value={formatNumber(data.total_quantity_kg)} />
            <Stat label="مبلغ کل" value={formatNumber(data.total_amount)} />
            <Stat label="پرفروش‌ترین محصول" value={data.top_product?.product_name ?? "—"} />
            <Stat label="اولین خرید" value={formatJalaliDate(data.first_sale_date)} />
            <Stat label="آخرین خرید" value={formatJalaliDate(data.last_sale_date)} />
          </div>

          <div className="rounded-2xl border border-gray-200 p-4 dark:border-white/10">
            <h3 className="mb-3 text-[13px] font-black text-gray-800 dark:text-gray-100">سهم محصولات از مبلغ خرید</h3>
            <ul className="space-y-3">
              {data.by_product.map((p) => (
                <li key={p.product_id}>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
                    <span className="font-bold text-gray-800 dark:text-gray-100">{p.product_name}</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {toPersianDigits(p.sales_count)} فروش · {formatNumber(p.quantity_kg)} کیلوگرم · {formatNumber(p.amount)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${barPct(p.amount, data.total_amount)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
