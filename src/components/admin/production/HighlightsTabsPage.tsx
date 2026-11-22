"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { listAll } from "@/lib/api/_core";
import { JalaliDatePicker, NiceSelect } from "./shared";
import type { Option, Product } from "./shared";
import { useProductionData } from "./ProductionContext";
import HighlightsPanel from "./HighlightsPanel";
import DowntimeStats from "./DowntimeStats";
import { DEFAULT_SPAN_DAYS, isoDaysAgo } from "./reportTypes";
import type { GroupBy } from "./reportTypes";

const TABS = [
    { href: "/admin/production/highlights", label: "برترین‌ها و ضایعات کارکنان" },
    { href: "/admin/production/downtime", label: "آمار توقف دستگاه" },
];

const GROUPS: { id: GroupBy; label: string }[] = [
    { id: "day", label: "روزانه" },
    { id: "week", label: "هفتگی" },
    { id: "month", label: "ماهانه" },
    { id: "year", label: "سالانه" },
];

export default function HighlightsTabsPage({ show }: { show: "highlights" | "downtime" }) {
    const path = usePathname();
    const { machineOptions } = useProductionData(["machines"]);

    const [groupBy, setGroupBy] = useState<GroupBy>("month");
    const [from, setFrom] = useState(() => isoDaysAgo(show === "downtime" ? DEFAULT_SPAN_DAYS.month : 90));
    const [to, setTo] = useState(() => isoDaysAgo(0));
    const [machineId, setMachineId] = useState<number | null>(null);
    const [productId, setProductId] = useState<number | null>(null);
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        if (show !== "highlights") return;
        listAll<Product>("/production/api/v1/product/")
            .then(setProducts)
            .catch(() => setProducts([]));
    }, [show]);

    const productOptions = useMemo<Option[]>(
        () => products.map((p) => ({ id: p.id, label: p.name, sub: p.code })),
        [products],
    );

    // با تغییر نوع تفکیک، بازه به اندازه‌ی مناسب آن (با محدودیت API سازگار) برمی‌گردد
    function changeGroup(g: GroupBy) {
        setGroupBy(g);
        setFrom(isoDaysAgo(DEFAULT_SPAN_DAYS[g]));
        setTo(isoDaysAgo(0));
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {TABS.map((t) => (
                    <Link
                        key={t.href}
                        href={t.href}
                        className={`rounded-full px-4 py-1.5 text-[12px] font-bold ${path === t.href ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 dark:bg-white/[0.06]"}`}
                    >
                        {t.label}
                    </Link>
                ))}
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <JalaliDatePicker label="از تاریخ" value={from} onChange={setFrom} max={to || undefined} placeholder="شروع بازه" />
                    <JalaliDatePicker label="تا تاریخ" value={to} onChange={setTo} min={from || undefined} placeholder="پایان بازه" />
                    <NiceSelect
                        label="دستگاه (اختیاری)"
                        placeholder="همه دستگاه‌ها"
                        emptyText="دستگاهی یافت نشد"
                        options={machineOptions}
                        value={machineId}
                        onChange={setMachineId}
                    />
                    {show === "highlights" && (
                        <NiceSelect
                            label="محصول (اختیاری)"
                            placeholder="همه محصولات"
                            emptyText="محصولی یافت نشد"
                            options={productOptions}
                            value={productId}
                            onChange={setProductId}
                        />
                    )}
                </div>

                {show === "downtime" && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px]">
                        <span className="font-bold text-gray-500">تفکیک آمار:</span>
                        {GROUPS.map((g) => (
                            <button
                                key={g.id}
                                type="button"
                                onClick={() => changeGroup(g.id)}
                                className={`rounded-full px-3.5 py-1.5 font-bold transition-colors ${groupBy === g.id ? "bg-indigo-600 text-white" : "bg-black/[0.04] text-gray-600 hover:bg-black/[0.07] dark:bg-white/[0.06] dark:text-gray-300"}`}
                            >
                                {g.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {show === "highlights" ? (
                <HighlightsPanel dateFrom={from} dateTo={to} machineId={machineId} productId={productId} />
            ) : (
                <DowntimeStats dateFrom={from} dateTo={to} machineId={machineId} groupBy={groupBy} />
            )}
        </div>
    );
}
