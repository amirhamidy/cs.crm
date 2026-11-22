"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export type SortDir = "asc" | "desc";
export type SortState = { key: string; dir: SortDir } | null;
export type SortValue = string | number | null | undefined;

const isEmpty = (v: SortValue) => v === null || v === undefined || v === "";

/** مقایسه‌ی دو مقدار؛ مقدار خالی همیشه آخر می‌رود (چه صعودی، چه نزولی) */
function compare(x: SortValue, y: SortValue, mul: number): number {
    const xe = isEmpty(x);
    const ye = isEmpty(y);
    if (xe && ye) return 0;
    if (xe) return 1;
    if (ye) return -1;
    if (typeof x === "number" && typeof y === "number") return (x - y) * mul;
    return String(x).localeCompare(String(y), "fa", { numeric: true }) * mul;
}

/** کلیک روی یک ستون: اگر ستون جدید است صعودی، وگرنه جهت برعکس می‌شود */
export function nextSort(prev: SortState, key: string, firstDir: SortDir = "asc"): SortState {
    if (!prev || prev.key !== key) return { key, dir: firstDir };
    return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
}

/** دکمه‌ی سربرگ ستون با فلش جهت مرتب‌سازی */
export function SortButton({
    label,
    active,
    dir,
    onClick,
}: {
    label: ReactNode;
    active: boolean;
    dir: SortDir;
    onClick: () => void;
}) {
    const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
    return (
        <button
            type="button"
            onClick={onClick}
            title={!active ? "مرتب‌سازی" : dir === "asc" ? "صعودی (پایین به بالا)؛ برای نزولی دوباره کلیک کنید" : "نزولی (بالا به پایین)؛ برای صعودی دوباره کلیک کنید"}
            className={`inline-flex items-center gap-1 whitespace-nowrap font-bold transition-colors hover:text-gray-700 dark:hover:text-gray-200 ${active ? "text-indigo-600 dark:text-indigo-400" : ""}`}
        >
            {label}
            <Icon size={11} className={active ? "" : "opacity-40"} />
        </button>
    );
}

export interface Col<T> {
    key: string;
    label: string;
    /** مقدار مورد استفاده برای مرتب‌سازی */
    get?: (row: T) => SortValue;
    /** نمایش سلول (پیش‌فرض: مقدار get) */
    render?: (row: T) => ReactNode;
    /** پیش‌فرض: اگر get داده شده باشد true */
    sortable?: boolean;
    /** جهت اولین کلیک (برای عددها بهتر است desc باشد) */
    firstDir?: SortDir;
    thClass?: string;
    tdClass?: string;
}

/**
 * جدول با مرتب‌سازی بالا به پایین / پایین به بالا روی هر ستون.
 * مرتب‌سازی روی همان ردیف‌هایی که به جدول داده می‌شود انجام می‌شود.
 */
export function SortableTable<T>({
    rows,
    columns,
    rowKey,
    initialSort = null,
    empty = "داده‌ای وجود ندارد.",
    minWidth,
    rowClass,
    bare = false,
}: {
    rows: T[];
    columns: Col<T>[];
    rowKey: (row: T, index: number) => string | number;
    initialSort?: SortState;
    empty?: string;
    minWidth?: number;
    rowClass?: (row: T) => string;
    /** بدون کادر بیرونی (وقتی جدول داخل کادر دیگری است) */
    bare?: boolean;
}) {
    const [sort, setSort] = useState<SortState>(initialSort);

    const sorted = useMemo(() => {
        if (!sort) return rows;
        const col = columns.find((c) => c.key === sort.key);
        if (!col?.get) return rows;
        const get = col.get;
        const mul = sort.dir === "asc" ? 1 : -1;
        return [...rows].sort((a, b) => compare(get(a), get(b), mul));
        // columns هر رندر ساخته می‌شود؛ فقط تغییر rows و sort مهم است
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, sort]);

    return (
        <div className={bare ? "overflow-x-auto" : "overflow-x-auto rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.06] dark:bg-white/[0.02]"}>
            <table className="w-full border-collapse text-right text-[11.5px]" style={minWidth ? { minWidth } : undefined}>
                <thead>
                    <tr className="border-b border-black/5 text-[10.5px] text-gray-400 dark:border-white/5">
                        {columns.map((c) => {
                            const sortable = c.sortable ?? !!c.get;
                            return (
                                <th key={c.key} className={`whitespace-nowrap px-3 py-2 font-bold ${c.thClass ?? ""}`} aria-sort={sort?.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}>
                                    {sortable ? (
                                        <SortButton
                                            label={c.label}
                                            active={sort?.key === c.key}
                                            dir={sort?.dir ?? "asc"}
                                            onClick={() => setSort((p) => nextSort(p, c.key, c.firstDir))}
                                        />
                                    ) : (
                                        c.label
                                    )}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {sorted.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="px-3 py-8 text-center text-gray-400">{empty}</td>
                        </tr>
                    ) : (
                        sorted.map((row, i) => (
                            <tr key={rowKey(row, i)} className={`transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] ${rowClass?.(row) ?? ""}`}>
                                {columns.map((c) => (
                                    <td key={c.key} className={`px-3 py-2 ${c.tdClass ?? "text-gray-600 dark:text-gray-300"}`}>
                                        {c.render ? c.render(row) : (c.get?.(row) ?? "—")}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
