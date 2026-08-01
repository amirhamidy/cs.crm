"use client";

import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { UsersFiltersState } from "@/types/users";

interface UsersFiltersProps {
    filters: UsersFiltersState;
    onChange: (f: UsersFiltersState) => void;
}

const ROLE_OPTIONS: { value: UsersFiltersState["role"]; label: string }[] = [
    { value: "all", label: "همه" },
    { value: "admin", label: "ادمین" },
    { value: "user", label: "کاربر" },
];

export default function UsersFilters({ filters, onChange }: UsersFiltersProps) {
    const hasActive = filters.role !== "all" || filters.search !== "";

    const pill = (active: boolean) =>
        `text-[12px] font-bold px-3.5 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer ${active
            ? "border-indigo-400 dark:border-indigo-500/60 text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10"
            : "border-gray-200 dark:border-white/[0.07] text-gray-500 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:text-indigo-500 dark:hover:text-indigo-300"
        }`;

    return (
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[180px] max-w-sm">
                    <Search
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
                    />
                    <input
                        type="text"
                        placeholder="جستجوی نام یا ایمیل..."
                        value={filters.search}
                        onChange={(e) => onChange({ ...filters, search: e.target.value })}
                        dir="rtl"
                        className="w-full pr-9 pl-4 py-2 text-[13px] rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-indigo-400 dark:focus:border-indigo-500/60 transition-all"
                    />
                </div>

                <AnimatePresence>
                    {hasActive && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={() => onChange({ search: "", role: "all" })}
                            className="flex items-center gap-1.5 text-[12px] font-bold text-gray-400 dark:text-gray-500 hover:text-red-400 transition-colors"
                        >
                            <X size={13} />
                            پاک کردن
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                {ROLE_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => onChange({ ...filters, role: opt.value })}
                        className={pill(filters.role === opt.value)}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
