"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const CARD =
    "rounded-3xl border border-gray-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,.05)] transition-shadow dark:border-white/[0.06] dark:bg-[#111a2d] dark:shadow-none";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
    return <div className={cn(CARD, "p-3.5 sm:p-5", className)}>{children}</div>;
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex min-w-0 items-center gap-2.5 text-[14px] font-extrabold text-gray-800 dark:text-gray-100">
                {icon && (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
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
                "min-w-0 rounded-2xl border p-3 sm:p-3.5",
                tone === "good" &&
                    "border-emerald-100 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/10",
                tone === "warn" &&
                    "border-amber-100 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/10",
                tone === "default" &&
                    "border-gray-200/80 bg-white dark:border-white/[0.06] dark:bg-transparent",
            )}
        >
            <div className="text-[13px] font-bold text-gray-500 dark:text-gray-400">{label}</div>
            <div className="mt-1 truncate text-[13px] font-black text-gray-900 dark:text-white">
                {value}
            </div>
            {hint && <div className="mt-0.5 truncate text-[13px] text-gray-400">{hint}</div>}
        </div>
    );
}

export const TAB_LIST_CLASS =
    "flex gap-1 overflow-x-auto rounded-2xl border border-gray-200/80 bg-white p-1 [scrollbar-width:none] dark:border-white/[0.06] dark:bg-transparent [&::-webkit-scrollbar]:hidden";

/** استایل یک تب؛ بین تب‌های state-محور و تب‌های مبتنی بر روت مشترک است. */
export const tabClass = (active: boolean) =>
    cn(
        "flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[13px] font-bold transition-all sm:px-4",
        active
            ? "bg-brand-soft text-brand"
            : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200",
    );

export interface TabItem<K extends string> {
    key: K;
    label: string;
    icon?: ReactNode;
    badge?: number | string;
}

export function TabBadge({ value }: { value: number | string }) {
    return (
        <span className="rounded-full px-1.5 text-[13px] font-extrabold text-gray-600 dark:text-gray-300">
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
                "rounded-full px-2.5 py-1 text-[13px] font-extrabold",
                STATUS_TONE[status] ?? STATUS_TONE.no_tasks,
            )}
        >
            {label ?? CASE_STATUS_LABEL[status] ?? status}
        </span>
    );
}
