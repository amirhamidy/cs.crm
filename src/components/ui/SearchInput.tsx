"use client";

import { Search, X } from "lucide-react";

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function SearchInput({ value, onChange, placeholder = "جستجو...", className = "" }: SearchInputProps) {
    return (
        <div className={`relative ${className}`}>
            <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                type="text"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="h-10 w-full rounded-2xl border-0 bg-black/[0.05] pl-9 pr-9 text-[12.5px] text-gray-900 outline-none placeholder:text-gray-400 dark:bg-white/5 dark:text-slate-200"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    className="absolute left-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                    title="پاک کردن جستجو"
                >
                    <X size={12} />
                </button>
            )}
        </div>
    );
}
