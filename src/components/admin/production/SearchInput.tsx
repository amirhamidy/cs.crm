"use client";

interface Props {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}

// کادر جستجوی هم‌شکل با منابع انسانی / کنترل کیفی (بدون آیکون)
export default function SearchInput({ value, onChange, placeholder = "جستجو..." }: Props) {
    return (
        <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-9 w-full rounded-full border border-gray-100 bg-gray-50 px-4 text-[11px] font-semibold text-gray-800 outline-none transition focus:border-indigo-400 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white"
            />
        </div>
    );
}
