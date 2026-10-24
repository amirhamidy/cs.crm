"use client";

import { ChevronRight, ChevronLeft } from "lucide-react";

function getPageItems(page: number, total: number): (number | "…")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const items: (number | "…")[] = [1];
    const start = Math.max(2, page - 1);
    const end = Math.min(total - 1, page + 1);

    if (start > 2) items.push("…");
    for (let i = start; i <= end; i++) items.push(i);
    if (end < total - 1) items.push("…");
    items.push(total);

    return items;
}

const base = "bg-black/[0.04] dark:bg-white/5";

export default function Pagination({
    page,
    totalPages,
    onChange,
    compact = false,
}: {
    page: number;
    totalPages: number;
    onChange: (p: number) => void;
    /** نسخهٔ کوچک برای ستون‌های باریک (فقط قبلی / شماره صفحه / بعدی) */
    compact?: boolean;
}) {
    if (compact) {
        return (
            <div className="flex items-center justify-center gap-2 pt-1">
                <button
                    type="button"
                    onClick={() => onChange(page - 1)}
                    disabled={page <= 1}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors disabled:opacity-40 dark:text-gray-400 ${base}`}
                    title="صفحه قبل"
                >
                    <ChevronRight size={13} />
                </button>
                <span className="min-w-[56px] text-center text-[10.5px] font-bold text-gray-500 dark:text-gray-400">
                    {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}
                </span>
                <button
                    type="button"
                    onClick={() => onChange(page + 1)}
                    disabled={page >= totalPages}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors disabled:opacity-40 dark:text-gray-400 ${base}`}
                    title="صفحه بعد"
                >
                    <ChevronLeft size={13} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center gap-1.5 pt-2">
            <button
                type="button"
                onClick={() => onChange(page - 1)}
                disabled={page === 1}
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors disabled:opacity-40 dark:text-gray-400 ${base}`}
                title="صفحه قبل"
            >
                <ChevronRight size={15} />
            </button>

            {getPageItems(page, totalPages).map((item, i) =>
                item === "…" ? (
                    <span key={`dots-${i}`} className="px-1 text-[12px] text-gray-400">
                        …
                    </span>
                ) : (
                    <button
                        key={item}
                        type="button"
                        onClick={() => onChange(item)}
                        className={`h-9 min-w-9 rounded-xl px-2 text-[12px] font-bold transition-colors ${item === page
                                ? "bg-indigo-600 text-white shadow-sm"
                                : `text-gray-500 dark:text-gray-400 ${base}`
                            }`}
                    >
                        {item}
                    </button>
                )
            )}

            <button
                type="button"
                onClick={() => onChange(page + 1)}
                disabled={page === totalPages}
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors disabled:opacity-40 dark:text-gray-400 ${base}`}
                title="صفحه بعد"
            >
                <ChevronLeft size={15} />
            </button>
        </div>
    );
}