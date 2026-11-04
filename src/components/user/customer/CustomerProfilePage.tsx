"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { isAxiosError } from "axios";
import { ArrowRight, Phone, Building2, Star } from "lucide-react";
import { customersApi } from "@/lib/api/customers";
import type { CustomerDetail } from "@/types/customer";
import type { CustomerScore } from "@/types/customerPath";
import { apiMessage } from "@/lib/apiMessage";
import { formatJalaliDateTime } from "@/lib/format";
import { toPersianDigits } from "@/lib/jalali";
import { useRoleBase } from "@/hooks/useRoleBase";
import { EmptyState, ErrorState } from "@/components/ui/Feedback";
import { DetailSkeleton, ListSkeleton } from "@/components/ui/skeletons";
import CustomerComments from "./CustomerComments";
import CustomerSalesSummaryPanel from "./CustomerSalesSummaryPanel";
import CustomerPathPanel from "./CustomerPathPanel";

const TABS = [
  { key: "info", label: "اطلاعات" },
  { key: "sales", label: "خلاصهٔ فروش" },
  { key: "path", label: "مسیر پرونده‌ها" },
  { key: "scores", label: "امتیازها" },
  { key: "comments", label: "نظرات" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-gray-100 py-2 dark:border-white/5">
      <span className="text-[11.5px] text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-[13px] text-gray-800 dark:text-gray-100">{value || "—"}</span>
    </div>
  );
}

function ScoresPanel({ customerId }: { customerId: number }) {
  const [items, setItems] = useState<CustomerScore[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setItems(null);
    try {
      setItems(await customersApi.scores(customerId));
    } catch (e) {
      setError(apiMessage(e, "دریافت امتیازها با خطا مواجه شد"));
    }
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!items) return <ListSkeleton rows={3} />;
  if (items.length === 0) return <EmptyState title="هنوز امتیازی ثبت نشده است" />;
  return (
    <ul className="space-y-2">
      {items.map((s) => (
        <li key={s.id} className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-300">
              <Star size={14} className="fill-current" />
              {toPersianDigits(s.score)}
            </span>
            <span className="text-[11px] text-gray-400">{formatJalaliDateTime(s.created_at)}</span>
          </div>
          {s.reason && <p className="mt-1 text-[12.5px] text-gray-600 dark:text-gray-300">{s.reason}</p>}
        </li>
      ))}
    </ul>
  );
}

export default function CustomerProfilePage() {
  const base = useRoleBase();
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const validId = Number.isInteger(id) && id > 0;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("info");

  const load = useCallback(async () => {
    if (!validId) {
      setError("مشتری پیدا نشد");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setCustomer(await customersApi.get(id));
    } catch (e) {
      setCustomer(null);
      setError(
        isAxiosError(e) && e.response?.status === 404
          ? "مشتری پیدا نشد"
          : apiMessage(e, "دریافت اطلاعات مشتری با خطا مواجه شد"),
      );
    } finally {
      setLoading(false);
    }
  }, [id, validId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4 p-4">
      <Link href={`${base}/customer`} className="inline-flex items-center gap-1 text-[12.5px] text-gray-500 hover:text-brand">
        <ArrowRight size={14} /> بازگشت به مشتریان
      </Link>

      {loading ? (
        <DetailSkeleton />
      ) : error || !customer ? (
        <ErrorState message={error ?? "مشتری پیدا نشد"} onRetry={validId ? load : undefined} />
      ) : (
        <>
          <div className="rounded-2xl border border-gray-200 p-4 dark:border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-black text-gray-900 dark:text-white">{customer.full_name}</h1>
              <span className="rounded-lg bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand">{customer.status_display}</span>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-3 text-[12.5px] text-gray-500 dark:text-gray-400">
              {customer.company_name && <span className="inline-flex items-center gap-1"><Building2 size={13} />{customer.company_name}</span>}
              <span className="inline-flex items-center gap-1" dir="ltr"><Phone size={13} />{customer.phone_number}</span>
            </p>
          </div>

          <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-white/10">
            {TABS.map((t) => (
              <button key={t.key} role="tab" aria-selected={tab === t.key} type="button" onClick={() => setTab(t.key)}
                className={`whitespace-nowrap px-4 py-2 text-[13px] font-bold ${tab === t.key ? "border-b-2 border-brand text-brand" : "text-gray-500 dark:text-gray-400"}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div hidden={tab !== "info"}>
            <Row label="سمت" value={customer.job_title} />
            <Row label="آدرس" value={customer.address} />
            <Row label="منبع آشنایی" value={customer.source} />
            <Row label="توضیحات" value={customer.description} />
            <Row label="ثبت‌کننده" value={customer.created_by_username} />
            <Row label="تاریخ ایجاد" value={formatJalaliDateTime(customer.created_at)} />
          </div>
          <div hidden={tab !== "sales"}><CustomerSalesSummaryPanel customerId={id} /></div>
          <div hidden={tab !== "path"}><CustomerPathPanel customerId={id} /></div>
          <div hidden={tab !== "scores"}><ScoresPanel customerId={id} /></div>
          <div hidden={tab !== "comments"}><CustomerComments customerId={id} /></div>
        </>
      )}
    </div>
  );
}
