"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const CARD =
    "rounded-[1.45rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#111827]";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
    return <div className={cn(CARD, "p-3 sm:p-4", className)}>{children}</div>;
}

export function SectionTitle({
    icon,
    title,
    actions,
}: {
    icon?: ReactNode;
    title: string;
    actions?: ReactNode;
}) {
    return (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex min-w-0 items-center gap-2.5 text-[13px] font-extrabold text-gray-900 dark:text-white">
                {icon && (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm">
                        {icon}
                    </span>
                )}
                <span className="leading-6">{title}</span>
            </h2>
            {actions}
        </div>
    );
}

export function StatTile({
    label,
    value,
    hint,
    tone = "default",
}: {
    label: string;
    value: ReactNode;
    hint?: string;
    tone?: "default" | "good" | "warn";
}) {
    return (
        <div
            className={cn(
                "min-w-0 rounded-xl px-3 py-2",
                tone === "good" && "bg-emerald-50/70 dark:bg-emerald-500/[0.07]",
                tone === "warn" && "bg-amber-50/70 dark:bg-amber-500/[0.07]",
                tone === "default" && "bg-gray-50 dark:bg-white/[0.03]",
            )}
        >
            <div
                className={cn(
                    "truncate text-[9.5px] font-semibold",
                    tone === "good" && "text-emerald-500",
                    tone === "warn" && "text-amber-500",
                    tone === "default" && "text-gray-400",
                )}
            >
                {label}
            </div>
            <div
                className={cn(
                    "mt-0.5 truncate text-[13px] font-extrabold",
                    tone === "good" && "text-emerald-600 dark:text-emerald-400",
                    tone === "warn" && "text-amber-600 dark:text-amber-400",
                    tone === "default" && "text-gray-800 dark:text-white",
                )}
            >
                {value}
            </div>
            {hint && <div className="mt-0.5 truncate text-[10.5px] font-semibold text-gray-400">{hint}</div>}
        </div>
    );
}

export const TAB_LIST_CLASS =
    "flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-gray-100 bg-gray-50 p-1 [scrollbar-width:none] dark:border-white/[0.06] dark:bg-white/[0.03] [&::-webkit-scrollbar]:hidden";

/** استایل یک تب؛ بین تب‌های state-محور و تب‌های مبتنی بر روت مشترک است. */
export const tabClass = (active: boolean) =>
    cn(
        "flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[11px] font-extrabold transition-all",
        active
            ? "bg-white text-indigo-600 shadow-sm dark:bg-white/10 dark:text-indigo-300"
            : "text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
    );

export interface TabItem<K extends string> {
    key: K;
    label: string;
    icon?: ReactNode;
    badge?: number | string;
}

export function TabBadge({ value }: { value: number | string }) {
    return (
        <span className="rounded-full text-[10px] font-extrabold opacity-70">
            {typeof value === "number" ? value.toLocaleString("fa-IR") : value}
        </span>
    );
}

/** تب‌های درون‌صفحه‌ای (state-محور). برای تب‌هایی که صفحه‌ی جدا دارند از RouteTabs استفاده کنید. */
export function Tabs<K extends string>({
    items,
    value,
    onChange,
    label = "بخش‌ها",
}: {
    items: TabItem<K>[];
    value: K;
    onChange: (key: K) => void;
    label?: string;
}) {
    return (
        <div role="tablist" aria-label={label} className={TAB_LIST_CLASS}>
            {items.map((item) => (
                <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={item.key === value}
                    onClick={() => onChange(item.key)}
                    className={tabClass(item.key === value)}
                >
                    {item.icon}
                    {item.label}
                    {item.badge != null && item.badge !== "" && <TabBadge value={item.badge} />}
                </button>
            ))}
        </div>
    );
}

export const STATUS_TONE: Record<string, string> = {
    in_progress: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
    sold: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    completed: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
    cancelled: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
    no_tasks: "bg-transparent text-gray-500 dark:bg-transparent dark:text-gray-400",
};

export const CASE_STATUS_LABEL: Record<string, string> = {
    in_progress: "در حال انجام",
    sold: "فروخته شد",
    completed: "تکمیل شده",
    cancelled: "لغو شده",
    no_tasks: "بدون وظیفه",
};

export function StatusPill({ status, label }: { status: string; label?: string }) {
    return (
        <span
            className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-extrabold",
                STATUS_TONE[status] ?? STATUS_TONE.no_tasks,
            )}
        >
            {label ?? CASE_STATUS_LABEL[status] ?? status}
        </span>
    );
}
