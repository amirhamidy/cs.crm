"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  Phone,
  ShoppingBag,
} from "lucide-react";
import { ErrorState } from "@/components/ui/Feedback";
import { DetailSkeleton } from "@/components/ui/skeletons";
import { customersApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import type { CustomerDetail } from "@/types/customer";
import StarRating from "./StarRating";
import { Card, Tabs } from "./ui";
import CasePathTab from "./profile/CasePathTab";
import CommentsTab from "./profile/CommentsTab";
import MarketplaceTab from "./profile/MarketplaceTab";
import OverviewTab from "./profile/OverviewTab";
import SalesTab from "./profile/SalesTab";

type TabKey = "overview" | "comments" | "sales" | "path" | "marketplace";

export default function CustomerProfilePage({ basePath }: { basePath: "/admin" | "/user" }) {
  const params = useParams<{ id: string }>();
  const { can } = usePermissions();
  const customerId = Number(params?.id);
  const valid = Number.isInteger(customerId) && customerId > 0;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabKey>("overview");
  const [avg, setAvg] = useState<{ value: number | null; count: number } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = useCallback(() => setRefreshKey((n) => n + 1), []);

  const load = useCallback(async () => {
    if (!valid) return;
    setLoading(true);
    setError("");
    try {
      setCustomer(await customersApi.get(customerId));
    } catch (e) {
      setError(apiMessage(e, "مشتری پیدا نشد یا دریافت اطلاعات ناموفق بود"));
    } finally {
      setLoading(false);
    }
  }, [customerId, valid]);

  useEffect(() => {
    void load();
  }, [load]);

  const onAverage = useCallback(
    (value: number | null, count: number) => setAvg({ value, count }),
    [],
  );

  if (!valid) return <ErrorState message="شناسه‌ی مشتری معتبر نیست" />;
  if (loading) return <DetailSkeleton />;
  if (error || !customer) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <Link
        href={`${basePath}/customer/`}
        className="flex w-fit items-center gap-1.5 text-[12px] font-bold text-gray-500 transition-colors hover:text-brand dark:text-gray-400"
      >
        <ArrowRight size={14} /> بازگشت به لیست مشتریان
      </Link>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-500 text-[22px] font-black text-white">
              {customer.full_name.trim().charAt(0) || "؟"}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-[18px] font-black text-gray-900 dark:text-white">
                  {customer.full_name}
                </h1>
                <span
                  className={
                    customer.status === 2
                      ? "rounded-full bg-emerald-50 px-2.5 py-1 text-[10.5px] font-extrabold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : "rounded-full bg-amber-50 px-2.5 py-1 text-[10.5px] font-extrabold text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
                  }
                >
                  {customer.status_display}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-gray-500 dark:text-gray-400">
                {customer.company_name && (
                  <span className="flex items-center gap-1.5">
                    <Building2 size={12} /> {customer.company_name}
                  </span>
                )}
                {customer.phone_number && (
                  <a href={`tel:${customer.phone_number}`} className="flex items-center gap-1.5 hover:text-brand" dir="ltr">
                    <Phone size={12} /> {customer.phone_number}
                  </a>
                )}
                {customer.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={12} /> {customer.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-1 sm:items-end">
            <span className="text-[10.5px] font-bold text-gray-400">میانگین امتیاز</span>
            {avg ? (
              <StarRating value={avg.value} count={avg.count || undefined} size={16} />
            ) : (
              <span className="text-[11.5px] text-gray-400">—</span>
            )}
          </div>
        </div>
      </Card>

      <Tabs<TabKey>
        label="بخش‌های پرونده مشتری"
        value={tab}
        onChange={setTab}
        items={[
          { key: "overview", label: "خلاصه", icon: <LayoutDashboard size={14} /> },
          { key: "comments", label: "نظرات", icon: <MessageCircle size={14} /> },
          { key: "sales", label: "خرید و فروش", icon: <ShoppingBag size={14} /> },
          { key: "path", label: "مسیر پرونده‌ها", icon: <FolderKanban size={14} /> },
          ...(can("customer_credentials", "view")
            ? [{ key: "marketplace" as const, label: "حساب بازارگاه", icon: <KeyRound size={14} /> }]
            : []),
        ]}
      />

      {tab === "overview" && (
        <OverviewTab customerId={customerId} onAverage={onAverage} refreshKey={refreshKey} />
      )}
      {tab === "comments" && <CommentsTab customerId={customerId} />}
      {tab === "sales" && (
        <SalesTab customerId={customerId} customerName={customer.full_name} onChanged={bump} />
      )}
      {tab === "path" && <CasePathTab customerId={customerId} refreshKey={refreshKey} />}
      {tab === "marketplace" && can("customer_credentials", "view") && (
        <MarketplaceTab customerId={customerId} />
      )}
    </div>
  );
}
