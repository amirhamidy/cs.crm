"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, m } from "framer-motion";
import { AlertCircle, Inbox, Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tone = "gray" | "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet";

export const PAGE_WRAP = "space-y-4 p-3 sm:p-5";

export const GRID = "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";

export const SURFACE =
    "rounded-[1.45rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#111827]";

export const CARD_HOVER =
    "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/[0.04] dark:hover:shadow-black/20";

export const INSET = "rounded-xl bg-gray-50 px-2.5 py-2 dark:bg-white/[0.035]";

const GRADIENTS = [
    "from-indigo-500 to-violet-500",
    "from-pink-500 to-fuchsia-500",
    "from-cyan-500 to-blue-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
];

export const gradientOf = (n: number) => GRADIENTS[Math.abs(n) % GRADIENTS.length];

export const initialOf = (text: string, fallback = "؟") => (text || "").trim().charAt(0) || fallback;

const TONE_GRADIENT: Record<Tone, string> = {
    gray: "from-gray-400 to-gray-500",
    indigo: "from-indigo-500 to-violet-500",
    emerald: "from-emerald-500 to-teal-500",
    amber: "from-amber-500 to-orange-500",
    rose: "from-rose-500 to-pink-500",
    sky: "from-cyan-500 to-blue-500",
    violet: "from-violet-500 to-fuchsia-500",
};

const TONE_TILE: Record<Tone, [string, string, string]> = {
    gray: ["bg-gray-50 dark:bg-white/[0.03]", "text-gray-400", "text-gray-800 dark:text-white"],
    indigo: ["bg-indigo-50/70 dark:bg-indigo-500/[0.07]", "text-indigo-400", "text-indigo-600 dark:text-indigo-400"],
    emerald: ["bg-emerald-50/70 dark:bg-emerald-500/[0.07]", "text-emerald-500", "text-emerald-600 dark:text-emerald-400"],
    amber: ["bg-amber-50/70 dark:bg-amber-500/[0.07]", "text-amber-500", "text-amber-600 dark:text-amber-400"],
    rose: ["bg-rose-50/70 dark:bg-rose-500/[0.07]", "text-rose-400", "text-rose-600 dark:text-rose-400"],
    sky: ["bg-sky-50/70 dark:bg-sky-500/[0.07]", "text-sky-500", "text-sky-600 dark:text-sky-400"],
    violet: ["bg-violet-50/70 dark:bg-violet-500/[0.07]", "text-violet-400", "text-violet-600 dark:text-violet-400"],
};

const TONE_CHIP: Record<Tone, string> = {
    gray: "bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-300",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
    sky: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
};

const TONE_BAR: Record<Tone, string> = {
    gray: "bg-gray-400",
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-400",
    rose: "bg-rose-500",
    sky: "bg-sky-500",
    violet: "bg-violet-500",
};

const ACTION_HOVER: Record<"gray" | "indigo" | "sky" | "rose", string> = {
    gray: "hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/[0.06]",
    indigo: "hover:bg-indigo-50 hover:text-indigo-500 dark:hover:bg-indigo-500/10",
    sky: "hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-500/10",
    rose: "hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10",
};

export function Surface({ className, children }: { className?: string; children: ReactNode }) {
    return <div className={cn(SURFACE, className)}>{children}</div>;
}

export function IconTile({
    tone,
    gradient,
    size = "md",
    children,
    className,
}: {
    tone?: Tone;
    gradient?: string;
    size?: "sm" | "md";
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "flex shrink-0 items-center justify-center bg-gradient-to-br font-extrabold text-white shadow-sm",
                size === "md" ? "h-11 w-11 rounded-2xl text-[14px]" : "h-9 w-9 rounded-xl text-[12px]",
                gradient ?? TONE_GRADIENT[tone ?? "indigo"],
                className,
            )}
        >
            {children}
        </div>
    );
}

export function IconAction({
    label,
    onClick,
    tone = "gray",
    disabled,
    children,
}: {
    label: string;
    onClick: () => void;
    tone?: "gray" | "indigo" | "sky" | "rose";
    disabled?: boolean;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition disabled:opacity-50 sm:h-7 sm:w-7",
                ACTION_HOVER[tone],
            )}
        >
            {children}
        </button>
    );
}

export function PillButton({
    children,
    onClick,
    icon,
    variant = "primary",
    type = "button",
    disabled,
    className,
}: {
    children: ReactNode;
    onClick?: () => void;
    icon?: ReactNode;
    variant?: "primary" | "soft";
    type?: "button" | "submit";
    disabled?: boolean;
    className?: string;
}) {
    return (
        <m.button
            type={type}
            whileTap={{ scale: 0.97 }}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-[11px] font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50",
                variant === "primary"
                    ? "bg-indigo-600 text-white hover:bg-indigo-500"
                    : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20",
                className,
            )}
        >
            {icon}
            {children}
        </m.button>
    );
}

export function MiniStat({
    label,
    value,
    tone = "gray",
    className,
}: {
    label: string;
    value: ReactNode;
    tone?: Tone;
    className?: string;
}) {
    const t = TONE_TILE[tone];
    return (
        <div className={cn("min-w-0 rounded-xl px-3 py-2", t[0], className)}>
            <p className={cn("truncate text-[9.5px] font-semibold", t[1])}>{label}</p>
            <p className={cn("mt-0.5 truncate text-[13px] font-extrabold", t[2])}>{value}</p>
        </div>
    );
}

export function Chip({
    tone = "gray",
    icon,
    children,
    className,
}: {
    tone?: Tone;
    icon?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <span
            className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold",
                TONE_CHIP[tone],
                className,
            )}
        >
            {icon}
            {children}
        </span>
    );
}

export function Meter({ value, max = 100, tone = "indigo" }: { value: number; max?: number; tone?: Tone }) {
    const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
    return (
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]" dir="rtl">
            <div className={cn("h-full rounded-full transition-all", TONE_BAR[tone])} style={{ width: `${pct}%` }} />
        </div>
    );
}

export function Divider() {
    return <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />;
}

export function SearchPill({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
}) {
    return (
        <div className="relative min-w-0 sm:w-64">
            <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label="جستجو"
                className="h-9 w-full rounded-full border border-gray-100 bg-gray-50 pl-9 pr-9 text-[11px] font-semibold text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white [&::-webkit-search-cancel-button]:hidden"
            />
            {value && (
                <button
                    type="button"
                    aria-label="پاک کردن"
                    onClick={() => onChange("")}
                    className="absolute left-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:text-gray-600"
                >
                    <X size={11} />
                </button>
            )}
        </div>
    );
}

export function FilterChips<T extends string | number>({
    items,
    value,
    onChange,
    label,
}: {
    items: { value: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
    label: string;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const active = ref.current?.querySelector<HTMLElement>('[aria-selected="true"]');
        active?.scrollIntoView({ inline: "center", block: "nearest" });
    }, [value]);

    return (
        <div
            ref={ref}
            role="tablist"
            aria-label={label}
            className="-mx-3 flex gap-1.5 overflow-x-auto px-3 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
            {items.map((item) => {
                const active = item.value === value;
                return (
                    <button
                        key={String(item.value)}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(item.value)}
                        className={cn(
                            "h-8 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-[11px] font-extrabold transition",
                            active
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-gray-100 bg-gray-50 text-gray-500 hover:text-gray-800 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-gray-400 dark:hover:text-gray-200",
                        )}
                    >
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}

export function FilterToggle({
    open,
    onToggle,
    activeCount = 0,
}: {
    open: boolean;
    onToggle: () => void;
    activeCount?: number;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            className={cn(
                "flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3.5 text-[11px] font-extrabold transition",
                open || activeCount > 0
                    ? "border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300"
                    : "border-gray-100 bg-gray-50 text-gray-500 hover:text-gray-800 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-gray-400",
            )}
        >
            <SlidersHorizontal size={13} />
            فیلترها
            {activeCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-extrabold text-white">
                    {activeCount.toLocaleString("fa-IR")}
                </span>
            )}
        </button>
    );
}

export function FilterPanel({
    open,
    children,
    className,
}: {
    open: boolean;
    children: ReactNode;
    className?: string;
}) {
    return (
        <AnimatePresence initial={false}>
            {open && (
                <m.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                >
                    <div className={cn("grid grid-cols-1 gap-3 pt-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
                        {children}
                    </div>
                </m.div>
            )}
        </AnimatePresence>
    );
}

export function Stagger({ index = 0, children, className }: { index?: number; children: ReactNode; className?: string }) {
    return (
        <m.div
            className={cn("min-w-0", className)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index, 12) * 0.035 }}
        >
            {children}
        </m.div>
    );
}

export function StateCard({
    kind = "empty",
    icon,
    title,
    description,
    onRetry,
}: {
    kind?: "empty" | "error";
    icon?: ReactNode;
    title: string;
    description?: string;
    onRetry?: () => void;
}) {
    const error = kind === "error";
    return (
        <div
            role={error ? "alert" : undefined}
            className={cn(
                "flex min-h-[230px] flex-col items-center justify-center rounded-[1.45rem] border bg-white px-6 text-center dark:bg-[#111827]",
                error
                    ? "border-rose-100 dark:border-rose-500/20"
                    : "border-dashed border-gray-200 dark:border-white/[0.07]",
            )}
        >
            <div
                className={cn(
                    "mb-3 flex h-12 w-12 items-center justify-center rounded-2xl",
                    error
                        ? "bg-rose-50 text-rose-500 dark:bg-rose-500/10"
                        : "bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-400 dark:from-indigo-500/10 dark:to-violet-500/10",
                )}
            >
                {error ? <AlertCircle size={19} /> : (icon ?? <Inbox size={19} />)}
            </div>
            <h3 className="text-[12.5px] font-extrabold text-gray-800 dark:text-white">{title}</h3>
            {description && (
                <p className="mt-1.5 max-w-xs text-[10.5px] font-semibold leading-5 text-gray-400">{description}</p>
            )}
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-3 h-8 rounded-full bg-indigo-600 px-4 text-[11px] font-extrabold text-white transition hover:bg-indigo-500"
                >
                    تلاش مجدد
                </button>
            )}
        </div>
    );
}

export function SectionHead({
    icon,
    title,
    subtitle,
    count,
}: {
    icon: ReactNode;
    title: string;
    subtitle?: string;
    count?: number | string;
}) {
    return (
        <div className="flex items-center gap-3 px-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400 dark:bg-white/[0.04]">
                {icon}
            </div>
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <h2 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">{title}</h2>
                    {count != null && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-100 px-1.5 text-[9.5px] font-extrabold text-gray-500 dark:bg-white/[0.06] dark:text-gray-300">
                            {typeof count === "number" ? count.toLocaleString("fa-IR") : count}
                        </span>
                    )}
                </div>
                {subtitle && <p className="mt-0.5 truncate text-[10.5px] font-semibold text-gray-400">{subtitle}</p>}
            </div>
        </div>
    );
}

export interface ToolbarStat {
    label: string;
    value: ReactNode;
    tone?: Tone;
}

export function PageToolbar({
    icon,
    title,
    subtitle,
    count,
    search,
    actions,
    stats,
    footer,
}: {
    icon: ReactNode;
    title: string;
    subtitle?: string;
    count?: number | string;
    search?: ReactNode;
    actions?: ReactNode;
    stats?: ToolbarStat[];
    footer?: ReactNode;
}) {
    const statsGrid = stats && stats.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4";
    return (
        <m.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className={cn(SURFACE, "p-3")}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <IconTile tone="indigo">{icon}</IconTile>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="truncate text-[15px] font-extrabold text-gray-900 dark:text-white">{title}</h1>
                            {count != null && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-50 px-1.5 text-[9.5px] font-extrabold text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                                    {typeof count === "number" ? count.toLocaleString("fa-IR") : count}
                                </span>
                            )}
                        </div>
                        {subtitle && <p className="mt-0.5 text-[10.5px] font-semibold text-gray-400">{subtitle}</p>}
                    </div>
                </div>

                {(search || actions) && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        {search}
                        {actions && <div className="flex items-center gap-2 [&>*:only-child]:flex-1 sm:[&>*:only-child]:flex-none">{actions}</div>}
                    </div>
                )}
            </div>

            {stats && stats.length > 0 && (
                <div className={cn("mt-3 grid gap-2", statsGrid)}>
                    {stats.map((s) => (
                        <MiniStat key={s.label} label={s.label} value={s.value} tone={s.tone} />
                    ))}
                </div>
            )}

            {footer && <div className="mt-3">{footer}</div>}
        </m.div>
    );
}
