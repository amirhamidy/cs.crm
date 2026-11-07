"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const CARD =
    "rounded-[1.45rem] border border-gray-100 bg-white shadow-sm transition-shadow dark:border-white/[0.06] dark:bg-[#111a2d] dark:shadow-none";

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
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm">
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
                    "border-transparent bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/10",
                tone === "warn" &&
                    "border-transparent bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/10",
                tone === "default" &&
                    "border-transparent bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.03]",
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
    "flex gap-1 overflow-x-auto rounded-full border border-gray-100 bg-gray-50 p-1 [scrollbar-width:none] dark:border-white/[0.06] dark:bg-transparent [&::-webkit-scrollbar]:hidden";

/** استایل یک تب؛ بین تب‌های state-محور و تب‌های مبتنی بر روت مشترک است. */
export const tabClass = (active: boolean) =>
    cn(
        "flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-bold transition-all sm:px-4",
        active
            ? "bg-indigo-600 text-white shadow-sm"
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

export function PageToolbar({
    icon,
    title,
    subtitle,
    count,
    children,
    stats,
}: {
    icon: ReactNode;
    title: string;
    subtitle?: string;
    count?: number | string;
    children?: ReactNode;
    stats?: { label: string; value: ReactNode; tone?: "default" | "indigo" | "emerald" | "amber" }[];
}) {
    const TONES = {
        default: ["bg-gray-50 dark:bg-white/[0.03]", "text-gray-400", "text-gray-800 dark:text-white"],
        indigo: ["bg-indigo-50/70 dark:bg-indigo-500/[0.07]", "text-indigo-400", "text-indigo-600 dark:text-indigo-400"],
        emerald: ["bg-emerald-50/70 dark:bg-emerald-500/[0.07]", "text-emerald-500", "text-emerald-600 dark:text-emerald-400"],
        amber: ["bg-amber-50/70 dark:bg-amber-500/[0.07]", "text-amber-500", "text-amber-600 dark:text-amber-400"],
    } as const;
    return (
        <div className="rounded-[1.45rem] border border-gray-100 bg-white p-3 shadow-sm sm:p-4 dark:border-white/[0.06] dark:bg-[#111827]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm">
                        {icon}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="truncate text-[15px] font-extrabold text-gray-900 dark:text-white">
                                {title}
                            </h1>
                            {count != null && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-50 px-1.5 text-[9.5px] font-extrabold text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                                    {typeof count === "number" ? count.toLocaleString("fa-IR") : count}
                                </span>
                            )}
                        </div>
                        {subtitle && (
                            <p className="mt-0.5 text-[10.5px] font-semibold text-gray-400">{subtitle}</p>
                        )}
                    </div>
                </div>
                {children}
            </div>
            {stats && stats.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {stats.map((st) => {
                        const t = TONES[st.tone ?? "default"];
                        return (
                            <div key={st.label} className={cn("min-w-0 rounded-xl px-3 py-2", t[0])}>
                                <p className={cn("truncate text-[9.5px] font-semibold", t[1])}>{st.label}</p>
                                <p className={cn("mt-0.5 truncate text-[13px] font-extrabold", t[2])}>
                                    {st.value}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
