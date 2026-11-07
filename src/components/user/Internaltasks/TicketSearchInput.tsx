"use client";

import { Search, X } from "lucide-react";

export default function TicketSearchInput({
    value,
    onChange,
    placeholder = "جستجو بر اساس عنوان، شماره یا نام فرد",
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    return (
        <div className="relative">
            <Search size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white pr-10 pl-4 text-[13px] shadow-sm font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-500/40 focus:bg-white dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:placeholder:text-gray-600 dark:focus:bg-white/[0.04]"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-white/[0.08] dark:hover:text-white"
                >
                    <X size={15} />
                </button>
            )}
        </div>
    );
}
