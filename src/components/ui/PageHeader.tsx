"use client";

import type { ComponentType, ReactNode } from "react";
import { RefreshCw, Search } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

export interface PageHeaderSearch {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}

interface PageHeaderProps {
    icon?: ComponentType<{ size?: number; className?: string }>;
    /** Tailwind text color class of the icon, e.g. "text-indigo-500" */
    iconClassName?: string;
    /** Tailwind background classes of the icon box */
    iconBoxClassName?: string;
    title: ReactNode;
    subtitle?: ReactNode;
    search?: PageHeaderSearch;
    onRefresh?: () => void;
    refreshing?: boolean;
    refreshDisabled?: boolean;
    /** Rendered between search and refresh button */
    leading?: ReactNode;
    /** Rendered after refresh button (add / primary actions) */
    children?: ReactNode;
}

export const HEADER_BTN_BASE =
    "flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-[12.5px] font-bold transition-colors";
export const HEADER_BTN_PRIMARY = `${HEADER_BTN_BASE} bg-indigo-600 px-4 text-white hover:bg-indigo-700`;
export const HEADER_BTN_SUCCESS = `${HEADER_BTN_BASE} bg-emerald-600 px-4 text-white hover:bg-emerald-700`;
export const HEADER_BTN_SECONDARY = `${HEADER_BTN_BASE} bg-slate-900/5 px-3.5 text-gray-600 hover:bg-slate-900/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10`;

/**
 * Shared page header — identical to the employees ("مدیریت کاربران") header.
 */
export default function PageHeader({
    icon: Icon,
    iconClassName = "text-indigo-500",
    iconBoxClassName = "bg-indigo-500/[0.08] dark:bg-indigo-500/[0.14]",
    title,
    subtitle,
    search,
    onRefresh,
    refreshing = false,
    refreshDisabled,
    leading,
    children,
}: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
                {Icon && (
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconBoxClassName}`}>
                        <Icon size={18} className={iconClassName} />
                    </div>
                )}
                <div className="min-w-0">
                    <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">{title}</h1>
                    {subtitle !== undefined && subtitle !== null && (
                        <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">{subtitle}</p>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {search && (
                    <div className="relative min-w-0 max-w-full">
                        <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search.value}
                            onChange={(event) => search.onChange(event.target.value)}
                            placeholder={search.placeholder}
                            className="h-10 w-40 max-w-full rounded-2xl border-0 bg-slate-900/5 pl-3 pr-9 text-[12.5px] text-gray-900 outline-none dark:bg-white/5 dark:text-gray-200 sm:w-52"
                        />
                    </div>
                )}
                {leading}
                {onRefresh && (
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={refreshDisabled ?? refreshing}
                        className="flex aspect-square h-10 w-10 min-h-10 min-w-10 shrink-0 grow-0 basis-10 items-center justify-center rounded-full bg-slate-900/5 p-0 text-gray-600 transition-colors disabled:opacity-50 dark:bg-white/5 dark:text-gray-300"
                        title="بارگذاری مجدد"
                        aria-label="بارگذاری مجدد"
                    >
                        {refreshing ? <Spinner size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                    </button>
                )}
                {children}
            </div>
        </div>
    );
}
