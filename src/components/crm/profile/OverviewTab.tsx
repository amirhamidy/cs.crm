"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarDays, Package, ShoppingBag, Star, Weight } from "lucide-react";
import { ErrorState, EmptyState } from "@/components/ui/Feedback";
import { StatCardsSkeleton, ListSkeleton } from "@/components/ui/skeletons";
import { accountsApi, salesApi, scoresApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import {
    formatJalaliDateTime,
    formatMoney,
    formatNumber,
    formatJalaliDate,
    formatWeight,
    toNumber,
} from "@/lib/crm/format";
import type { CustomerScore, CustomerSalesSummary } from "@/types/crm";
import StarRating from "../shared/StarRating";
import { Card, SectionTitle, StatTile } from "../shared/ui";

interface Props {
    customerId: number;
    /** وقتی میانگین امتیاز محاسبه شد به هدر صفحه خبر می‌دهد */
    onAverage?: (avg: number | null, count: number) => void;
    /** افزایش این عدد باعث دریافت دوباره‌ی اطلاعات می‌شود */
    refreshKey?: number;
}

export default function OverviewTab({ customerId, onAverage, refreshKey = 0 }: Props) {
    const [summary, setSummary] = useState<CustomerSalesSummary | null>(null);
    const [scores, setScores] = useState<CustomerScore[]>([]);
    const [names, setNames] = useState<Map<number, string>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [sum, scoreRes, employees] = await Promise.all([
                salesApi.customerSummary(customerId),
                scoresApi.page(customerId),
                accountsApi.employees.all().catch(() => []),
            ]);

            const items = scoreRes.results;

            setSummary(sum);
            setScores(items);
            setNames(
                new Map(employees.map((e) => [Number(e.id), e.full_name ?? e.username ?? ""])),
            );

            const avg = items.length ? items.reduce((a, s) => a + s.score, 0) / items.length : null;
            onAverage?.(avg, items.length);
        } catch (e) {
            setError(apiMessage(e, "دریافت اطلاعات مشتری ناموفق بود"));
        } finally {
            setLoading(false);
        }
    }, [customerId, onAverage]);

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customerId, refreshKey]);

    const maxAmount = useMemo(
        () => Math.max(1, ...(summary?.by_product ?? []).map((p) => toNumber(p.amount))),
        [summary],
    );

    if (loading) {
        return (
            <div className="flex flex-col gap-4">
                <StatCardsSkeleton count={4} />
                <ListSkeleton rows={3} />
            </div>
        );
    }

    if (error || !summary) {
        return <ErrorState message={error || "خطا در دریافت اطلاعات"} onRetry={load} />;
    }

    const avg = scores.length ? scores.reduce((a, s) => a + s.score, 0) / scores.length : null;

    return (
        <div className="flex flex-col gap-5">
            <section>
                <SectionTitle icon={<ShoppingBag size={16} />} title="خلاصه فروش ما به این مشتری" />
                {summary.sales_count === 0 ? (
                    <Card>
                        <EmptyState
                            title="هنوز فروشی ثبت نشده است"
                            description="از تب «فروش‌ها» اولین فروش را ثبت کنید."
                            icon={<ShoppingBag size={26} />}
                        />
                    </Card>
                ) : (
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <StatTile
                            label="مجموع فروش"
                            value={formatMoney(summary.total_amount)}
                            tone="good"
                        />
                        <StatTile
                            label="مجموع مقدار"
                            value={formatWeight(summary.total_quantity_kg)}
                            hint={`${formatNumber(summary.sales_count)} فاکتور`}
                        />
                        <StatTile
                            label="پرفروش‌ترین کالا"
                            value={summary.top_product?.product_name ?? "—"}
                            hint={
                                summary.top_product
                                    ? formatWeight(summary.top_product.quantity_kg)
                                    : undefined
                            }
                        />
                        <StatTile
                            label="آخرین خرید"
                            value={formatJalaliDate(summary.last_sale_date)}
                            hint={`اولین خرید: ${formatJalaliDate(summary.first_sale_date)}`}
                        />
                    </div>
                )}
            </section>

            {summary.by_product.length > 0 && (
                <Card>
                    <SectionTitle icon={<BarChart3 size={16} />} title="سهم هر کالا از فروش" />
                    <ul className="flex flex-col gap-3">
                        {summary.by_product.map((p) => {
                            const pct = Math.round((toNumber(p.amount) / maxAmount) * 100);
                            return (
                                <li key={p.product_id}>
                                    <div className="mb-1 flex items-center justify-between gap-2 text-[13px]">
                                        <span className="flex min-w-0 items-center gap-1.5 font-bold text-gray-800 dark:text-gray-100">
                                            <Package size={12} className="shrink-0 text-gray-400" />
                                            <span className="truncate">{p.product_name}</span>
                                        </span>
                                        <span className="shrink-0 font-extrabold text-gray-700 dark:text-gray-200">
                                            {formatMoney(p.amount)}
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-transparent dark:bg-transparent">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-l from-indigo-400 to-brand"
                                            style={{ width: `${Math.max(pct, 3)}%` }}
                                        />
                                    </div>
                                    <div className="mt-1 flex items-center gap-3 text-[13px] text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Weight size={10} /> {formatWeight(p.quantity_kg)}
                                        </span>
                                        <span>{formatNumber(p.sales_count)} فروش</span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </Card>
            )}

            <Card>
                <SectionTitle
                    icon={<Star size={16} />}
                    title="امتیازهای کارکنان"
                    actions={
                        avg != null ? <StarRating value={avg} count={scores.length} /> : undefined
                    }
                />
                {scores.length === 0 ? (
                    <p className="py-6 text-center text-[13px] text-gray-400">
                        هنوز امتیازی برای این مشتری ثبت نشده است. امتیاز هنگام «فروخته شد» یا از
                        کارت مشتری ثبت می‌شود.
                    </p>
                ) : (
                    <ul className="flex flex-col gap-2.5">
                        {scores.map((s) => (
                            <li
                                key={s.id}
                                className="rounded-2xl border border-gray-100 bg-transparent p-3 dark:border-white/[0.06] dark:bg-transparent"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <StarRating value={s.score} showNumber={false} />
                                    <span className="flex items-center gap-1 text-[13px] text-gray-400">
                                        <CalendarDays size={11} />
                                        {formatJalaliDateTime(s.created_at)}
                                    </span>
                                </div>
                                {s.reason && (
                                    <p className="mt-1.5 text-[13px] leading-6 text-gray-700 dark:text-gray-200">
                                        {s.reason}
                                    </p>
                                )}
                                <div className="mt-1 text-[13px] font-bold text-gray-400">
                                    {names.get(Number(s.created_by)) || "کارمند"}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
}
