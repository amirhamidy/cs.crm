"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Search } from "lucide-react";

/**
 * دراپ‌داون صفحه فروش؛ دقیقاً هم‌سبک NiceSelect مودال «ایجاد تسک»
 * (انیمیشن اسپرینگی، ورود پله‌ای آیتم‌ها، جستجو برای لیست‌های بلند).
 */

export interface SalesSelectOption {
    id: number;
    label: string;
    sub?: string;
}

const GRADIENTS = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-violet-500 to-purple-600",
    "from-cyan-500 to-sky-600",
];
const gradientOf = (seed: number) => GRADIENTS[Math.abs(seed) % GRADIENTS.length];
const initialOf = (text: string) => (text || "").trim().charAt(0) || "؟";

interface Props {
    label?: string;
    options: SalesSelectOption[];
    value: number | null;
    onChange: (id: number) => void;
    placeholder?: string;
    emptyText?: string;
    disabled?: boolean;
    /** نمایش آواتار رنگی اول هر گزینه (مثل مودال تسک) */
    avatar?: boolean;
    /** نمایش جستجو وقتی گزینه‌ها بیش از ۵ تا باشد */
    searchable?: boolean;
    /** نسخه‌ی کوتاه‌تر برای روز/ماه/سال */
    compact?: boolean;
    dense?: boolean;
    className?: string;
}

export function SalesSelect({
    label,
    options,
    value,
    onChange,
    placeholder = "انتخاب کنید",
    emptyText = "موردی یافت نشد",
    disabled,
    avatar = true,
    searchable = true,
    compact = false,
    dense = false,
    className,
}: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    const selected = options.find((o) => o.id === value) ?? null;

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);
    useEffect(() => {
        if (!open) setQuery("");
    }, [open]);
    useEffect(() => {
        if (disabled) setOpen(false);
    }, [disabled]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
    }, [options, query]);

    return (
        <div ref={ref} className={`relative ${className ?? ""}`}>
            {label && (
                <label className="mb-1.5 block text-[10.5px] font-bold text-gray-400">{label}</label>
            )}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((v) => !v)}
                className={`flex w-full items-center gap-2.5 rounded-2xl border text-right transition-all duration-200 ${
                    dense ? "h-10 px-3" : compact ? "h-11 px-3" : "h-[52px] px-3"
                } ${
                    open
                        ? "border-indigo-500 bg-indigo-50/50 dark:border-indigo-500/50 dark:bg-indigo-500/[0.06]"
                        : "border-gray-100 bg-gray-50 hover:border-gray-200 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12]"
                } ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
            >
                {!compact &&
                    !dense &&
                    avatar &&
                    (selected ? (
                        <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(selected.id)}`}
                        >
                            {initialOf(selected.label)}
                        </span>
                    ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.06]">
                            <ChevronDown size={13} className="text-gray-400" />
                        </span>
                    ))}
                <span className="min-w-0 flex-1">
                    <span
                        className={`block truncate text-[12.5px] font-bold ${
                            selected ? "text-gray-900 dark:text-white" : "text-gray-400"
                        }`}
                    >
                        {selected ? selected.label : placeholder}
                    </span>
                </span>
                <m.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={14} className="shrink-0 text-gray-400" />
                </m.span>
            </button>

            <AnimatePresence>
                {open && (
                    <m.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ type: "spring", damping: 24, stiffness: 340 }}
                        className="absolute z-50 mt-2 w-full min-w-[9rem] origin-top overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-xl shadow-black/5 dark:border-white/[0.08] dark:bg-[#111827] dark:shadow-black/40"
                    >
                        {searchable && options.length > 5 && (
                            <div className="border-b border-gray-100 px-3 py-2.5 dark:border-white/[0.06]">
                                <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.04]">
                                    <Search size={13} className="shrink-0 text-gray-400" />
                                    <input
                                        autoFocus
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="جستجو..."
                                        className="w-full bg-transparent text-[12px] font-semibold text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="max-h-56 overflow-y-auto p-1.5">
                            {visible.length === 0 ? (
                                <p className="py-6 text-center text-[12px] text-gray-400">
                                    {emptyText}
                                </p>
                            ) : (
                                visible.map((o, i) => {
                                    const active = o.id === value;
                                    return (
                                        <m.button
                                            key={o.id}
                                            type="button"
                                            initial={{ opacity: 0, x: 6 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: Math.min(i, 12) * 0.02 }}
                                            onClick={() => {
                                                onChange(o.id);
                                                setOpen(false);
                                            }}
                                            className={`flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-right transition-colors ${
                                                active
                                                    ? "bg-indigo-50 dark:bg-indigo-500/10"
                                                    : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                                            }`}
                                        >
                                            {!compact && !dense && avatar && (
                                                <span
                                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(o.id)}`}
                                                >
                                                    {initialOf(o.label)}
                                                </span>
                                            )}
                                            <span className="min-w-0 flex-1">
                                                <span
                                                    className={`block truncate text-[12.5px] font-bold ${
                                                        active
                                                            ? "text-indigo-600 dark:text-indigo-400"
                                                            : "text-gray-900 dark:text-white"
                                                    }`}
                                                >
                                                    {o.label}
                                                </span>
                                                {o.sub && (
                                                    <span className="mt-0.5 block truncate text-[10.5px] text-gray-400">
                                                        {o.sub}
                                                    </span>
                                                )}
                                            </span>
                                            {active && (
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600">
                                                    <Check
                                                        size={11}
                                                        className="text-white"
                                                        strokeWidth={3}
                                                    />
                                                </span>
                                            )}
                                        </m.button>
                                    );
                                })
                            )}
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}
