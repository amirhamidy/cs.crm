"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, m } from "framer-motion";
import {
    Building2,
    FolderKanban,
    LayoutDashboard,
    MapPin,
    MessageCircle,
    Phone,
    ShoppingBag,
    User,
    X,
} from "lucide-react";
import { Portal, useModalBehavior } from "@/components/ui/Portal";
import { ErrorState } from "@/components/ui/Feedback";
import { DetailSkeleton } from "@/components/ui/skeletons";
import { customersApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import type { CustomerDetail } from "@/types/customer";
import StarRating from "../shared/StarRating";
import { Card, Tabs } from "../shared/ui";

const OverviewTab = dynamic(() => import("./OverviewTab"), { loading: () => <DetailSkeleton /> });
const CommentsTab = dynamic(() => import("./CommentsTab"), { loading: () => <DetailSkeleton /> });
const SalesTab = dynamic(() => import("./SalesTab"), { loading: () => <DetailSkeleton /> });
const CasePathTab = dynamic(() => import("./CasePathTab"), { loading: () => <DetailSkeleton /> });

type TabKey = "overview" | "comments" | "sales" | "path";

export default function CustomerProfileModal({
    customerId,
    onClose,
}: {
    customerId: number;
    onClose: () => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const titleId = useId();
    useModalBehavior({ open: true, onClose, containerRef });
    const [customer, setCustomer] = useState<CustomerDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tab, setTab] = useState<TabKey>("overview");
    const [avg, setAvg] = useState<{ value: number | null; count: number } | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [retryKey, setRetryKey] = useState(0);
    const bump = useCallback(() => setRefreshKey((n) => n + 1), []);
    const onAverage = useCallback(
        (value: number | null, count: number) => setAvg({ value, count }),
        [],
    );

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        customersApi
            .get(customerId)
            .then((data) => {
                if (active) setCustomer(data);
            })
            .catch((e) => {
                if (active) setError(apiMessage(e, "دریافت اطلاعات مشتری ناموفق بود"));
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [customerId, retryKey]);

    return (
        <Portal>
            <AnimatePresence>
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[90] flex items-center justify-center p-4"
                    dir="rtl"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (e.target === e.currentTarget) onClose();
                    }}
                >
                    <div className="modal-backdrop pointer-events-none absolute inset-0" />
                    <m.div
                        ref={containerRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        tabIndex={-1}
                        initial={{ opacity: 0, scale: 0.96, y: 18 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative flex max-h-[85dvh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-[0_28px_72px_rgba(0,0,0,0.32)] outline-none dark:border-white/[0.07] dark:bg-[#0c1220]"
                    >
                        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/[0.05] px-5 py-4 dark:border-white/[0.06]">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                                    <User size={16} />
                                </span>
                                <div className="min-w-0">
                                    <h2
                                        id={titleId}
                                        className="text-[13px] font-bold text-gray-900 dark:text-white"
                                    >
                                        پرونده مشتری
                                    </h2>
                                    <p className="mt-0.5 truncate text-[13px] text-gray-400">
                                        {customer?.full_name ?? "در حال دریافت اطلاعات..."}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                aria-label="بستن پرونده مشتری"
                                onClick={onClose}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-transparent text-gray-400 hover:text-gray-700 dark:bg-transparent dark:hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="shrink-0 border-b border-black/[0.05] px-5 py-3 dark:border-white/[0.06]">
                            <div className="[&_[role=tab]]:text-[13px] [&_[role=tab]]:font-bold">
                                <Tabs<TabKey>
                                    label="بخش‌های پرونده مشتری"
                                    value={tab}
                                    onChange={setTab}
                                    items={[
                                        {
                                            key: "overview",
                                            label: "خلاصه",
                                            icon: <LayoutDashboard size={14} />,
                                        },
                                        {
                                            key: "comments",
                                            label: "نظرات",
                                            icon: <MessageCircle size={14} />,
                                        },
                                        {
                                            key: "sales",
                                            label: "فروش‌ها",
                                            icon: <ShoppingBag size={14} />,
                                        },
                                        {
                                            key: "path",
                                            label: "مسیر پرونده‌ها",
                                            icon: <FolderKanban size={14} />,
                                        },
                                    ]}
                                />
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
                            {loading ? (
                                <DetailSkeleton />
                            ) : error || !customer ? (
                                <ErrorState
                                    message={error || "مشتری پیدا نشد"}
                                    onRetry={() => setRetryKey((n) => n + 1)}
                                />
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <Card>
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span
                                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[13px] font-bold text-white"
                                                    style={{
                                                        background: `linear-gradient(135deg, oklch(55% 0.18 ${(customer.id * 47) % 360}), oklch(45% 0.22 ${(customer.id * 47 + 30) % 360}))`,
                                                    }}
                                                >
                                                    {customer.full_name.trim().charAt(0) || "؟"}
                                                </span>
                                                <div className="min-w-0">
                                                    <h3 className="text-[13px] font-bold text-gray-900 dark:text-white">
                                                        {customer.full_name}
                                                    </h3>
                                                    <span
                                                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[13px] ${customer.status === 2 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "bg-amber-500/10 text-amber-600 dark:text-amber-300"}`}
                                                    >
                                                        {customer.status_display}
                                                    </span>
                                                </div>
                                            </div>
                                            {avg && (
                                                <StarRating
                                                    value={avg.value}
                                                    count={avg.count || undefined}
                                                />
                                            )}
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-3 text-[13px] text-gray-500 dark:border-white/[0.06] dark:text-gray-400">
                                            {customer.company_name && (
                                                <span className="flex items-center gap-1.5">
                                                    <Building2 size={13} />
                                                    {customer.company_name}
                                                </span>
                                            )}
                                            {customer.phone_number && (
                                                <a
                                                    href={`tel:${customer.phone_number}`}
                                                    dir="ltr"
                                                    className="flex items-center gap-1.5 hover:text-brand"
                                                >
                                                    <Phone size={13} />
                                                    {customer.phone_number}
                                                </a>
                                            )}
                                            {customer.address && (
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin size={13} />
                                                    {customer.address}
                                                </span>
                                            )}
                                        </div>
                                    </Card>
                                    <div
                                        role="tabpanel"
                                        className="[&_*]:text-[13px]  [&_h2]:font-bold [&_h3]:font-bold"
                                        aria-label={
                                            tab === "overview"
                                                ? "خلاصه"
                                                : tab === "comments"
                                                  ? "نظرات"
                                                  : tab === "sales"
                                                    ? "فروش‌ها"
                                                    : "مسیر پرونده‌ها"
                                        }
                                    >
                                        {tab === "overview" && (
                                            <OverviewTab
                                                customerId={customerId}
                                                onAverage={onAverage}
                                                refreshKey={refreshKey}
                                            />
                                        )}
                                        {tab === "comments" && (
                                            <CommentsTab customerId={customerId} />
                                        )}
                                        {tab === "sales" && (
                                            <SalesTab
                                                customerId={customerId}
                                                customerName={customer.full_name}
                                                onChanged={bump}
                                            />
                                        )}
                                        {tab === "path" && (
                                            <CasePathTab
                                                customerId={customerId}
                                                refreshKey={refreshKey}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </m.div>
                </m.div>
            </AnimatePresence>
        </Portal>
    );
}
