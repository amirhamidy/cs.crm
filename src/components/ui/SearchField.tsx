"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const SEARCH_FIELD_INPUT_CLASS =
    "h-11 w-full rounded-full border border-gray-100 bg-gray-50 ps-11 pe-4 text-[12px] font-semibold text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white [&::-webkit-search-cancel-button]:hidden";

/** Unified page search box (pill, icon on the start/right side). */
export default function SearchField({
    value,
    onChange,
    placeholder = "جستجو...",
    className,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
}) {
    return (
        <div className={cn("relative min-w-0 w-full sm:w-80", className)}>
            <Search size={16} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                type="search"
                autoComplete="off"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label="جستجو"
                className={SEARCH_FIELD_INPUT_CLASS}
            />
        </div>
    );
}
