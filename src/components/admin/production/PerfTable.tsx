"use client";

import type { ReactNode } from "react";
import { toPersianDigits } from "@/lib/jalali";
import { formatProductionHours, formatProductionInteger } from "@/lib/productionFormat";
import { EfficiencyBadge } from "./shared";
import { SortableTable } from "./sorting";
import type { Col, SortState } from "./sorting";

interface PerfRow {
    hours: number | string;
    produced: number;
    expected_production: number | string;
    waste: number;
    expected_waste: number | string;
    efficiency: number | null;
}

/** جدول استاندارد «ساعت / تولید / انتظاری / ضایعات / انتظاری / راندمان» با مرتب‌سازی هر ستون */
export default function PerfTable<T extends PerfRow>({
    rows,
    nameLabel,
    nameValue,
    renderName,
    rowKey,
    initialSort = null,
}: {
    rows: T[];
    nameLabel: string;
    nameValue: (row: T) => string | number | null | undefined;
    renderName: (row: T) => ReactNode;
    rowKey: (row: T) => string | number;
    initialSort?: SortState;
}) {
    const columns: Col<T>[] = [
        { key: "name", label: nameLabel, get: nameValue, render: renderName, tdClass: "whitespace-nowrap font-bold text-gray-800 dark:text-gray-100" },
        { key: "hours", label: "ساعت", get: (r) => Number(r.hours), firstDir: "desc", tdClass: "whitespace-nowrap text-gray-500", render: (r) => formatProductionHours(r.hours) },
        { key: "produced", label: "تولید", get: (r) => r.produced, firstDir: "desc", tdClass: "font-bold text-emerald-600 dark:text-emerald-400", render: (r) => toPersianDigits(r.produced.toLocaleString()) },
        { key: "ep", label: "انتظاری", get: (r) => Number(r.expected_production), firstDir: "desc", tdClass: "text-gray-400", render: (r) => formatProductionInteger(r.expected_production) },
        { key: "waste", label: "ضایعات", get: (r) => r.waste, firstDir: "desc", tdClass: "font-bold text-red-500", render: (r) => toPersianDigits(r.waste) },
        { key: "ew", label: "انتظاری", get: (r) => Number(r.expected_waste), firstDir: "desc", tdClass: "text-gray-400", render: (r) => formatProductionInteger(r.expected_waste) },
        { key: "eff", label: "راندمان", get: (r) => r.efficiency, firstDir: "desc", render: (r) => <EfficiencyBadge value={r.efficiency} /> },
    ];

    return <SortableTable<T> bare rows={rows} columns={columns} rowKey={rowKey} initialSort={initialSort} />;
}
