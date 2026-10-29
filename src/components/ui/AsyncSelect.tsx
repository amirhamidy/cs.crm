"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Check, ChevronDown, Loader2, Search } from "lucide-react";
import { useInfiniteOptions, type InfiniteFetcher } from "@/hooks/useInfiniteOptions";

export interface AsyncOption {
    id: number;
    label: string;
    sub?: string;
}

const GRADIENTS = [
    "from-blue-500 to-indigo-500", "from-violet-500 to-fuchsia-500",
    "from-emerald-500 to-teal-500", "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500", "from-cyan-500 to-sky-500",
];
const gradientOf = (seed: number) => GRADIENTS[Math.abs(seed) % GRADIENTS.length];
const initialOf = (text: string) => (text || "").trim().charAt(0) || "؟";

interface AsyncSelectProps<T extends { id: number | string }> {
    label: string;
    placeholder: string;
    emptyText: string;
    disabled?: boolean;
    value: number | null;
    
    selected?: AsyncOption | null;
    fetcher: InfiniteFetcher<T>;
    toOption: (item: T) => AsyncOption;
    
    depsKey?: string | number | null;
    pageSize?: number;
    onChange: (option: AsyncOption) => void;
}


function AsyncSelectInner<T extends { id: number | string }>({
    label, placeholder, emptyText, disabled, value, selected, fetcher, toOption, depsKey, pageSize = 20, onChange,
}: AsyncSelectProps<T>) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const { items, search, setSearch, loading, loadingMore, hasMore, error, loadMore, retry } =
        useInfiniteOptions<T>(fetcher, { enabled: open && !disabled, pageSize, depsKey });

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
    useEffect(() => { if (!open) setSearch(""); }, [open, setSearch]);

    const onScroll = useCallback(() => {
        const el = listRef.current;
        if (!el) return;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) loadMore();
    }, [loadMore]);

    const hasSelection = value !== null && !!selected;

    return (
        <div ref={ref} className="relative">
            <label className="mb-2 block text-[11.5px] font-bold text-gray-400">{label}</label>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((v) => !v)}
                className={`flex h-[52px] w-full items-center gap-2.5 rounded-2xl border px-3 text-right transition-all duration-200 ${open
                    ? "border-blue-500 bg-blue-50/50 dark:border-blue-500/50 dark:bg-blue-500/[0.06]"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12]"
                    } ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
            >
                {hasSelection ? (
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(selected!.id)}`}>
                        {initialOf(selected!.label)}
                    </span>
                ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.06]">
                        <ChevronDown size={13} className="text-gray-400" />
                    </span>
                )}
                <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[12.5px] font-bold ${hasSelection ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
                        {hasSelection ? selected!.label : placeholder}
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
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 mt-2 w-full origin-top overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-xl shadow-black/5 dark:border-white/[0.08] dark:bg-[#0f172a] dark:shadow-black/40"
                    >
                        <div className="border-b border-gray-100 px-3 py-2.5 dark:border-white/[0.06]">
                            <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.04]">
                                <Search size={13} className="shrink-0 text-gray-400" />
                                <input
                                    autoFocus
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="جستجو..."
                                    className="w-full bg-transparent text-[12px] font-semibold text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                                />
                                {loading && <Loader2 size={13} className="shrink-0 animate-spin text-gray-400" />}
                            </div>
                        </div>

                        <div ref={listRef} onScroll={onScroll} className="max-h-56 overflow-y-auto p-1.5">
                            {loading && items.length === 0 ? (
                                <div className="flex items-center justify-center gap-2 py-6 text-[12px] text-gray-400">
                                    <Loader2 size={14} className="animate-spin" /> در حال دریافت...
                                </div>
                            ) : error && items.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-5">
                                    <p className="text-[12px] text-red-500">دریافت اطلاعات با خطا مواجه شد</p>
                                    <button type="button" onClick={retry} className="rounded-xl bg-indigo-600 px-3 py-1.5 text-[11.5px] font-bold text-white">
                                        تلاش مجدد
                                    </button>
                                </div>
                            ) : items.length === 0 ? (
                                <p className="py-6 text-center text-[12px] text-gray-400">{emptyText}</p>
                            ) : (
                                items.map((item) => {
                                    const o = toOption(item);
                                    const active = o.id === value;
                                    return (
                                        <button
                                            key={o.id}
                                            type="button"
                                            onClick={() => { onChange(o); setOpen(false); }}
                                            className={`flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-right transition-colors ${active ? "bg-blue-50 dark:bg-blue-500/10" : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"}`}
                                        >
                                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(o.id)}`}>
                                                {initialOf(o.label)}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className={`block truncate text-[12.5px] font-bold ${active ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>
                                                    {o.label}
                                                </span>
                                                {o.sub && <span className="mt-0.5 block truncate text-[10.5px] text-gray-400">{o.sub}</span>}
                                            </span>
                                            {active && (
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600">
                                                    <Check size={11} className="text-white" strokeWidth={3} />
                                                </span>
                                            )}
                                        </button>
                                    );
                                })
                            )}

                            {loadingMore && (
                                <div className="flex items-center justify-center gap-2 py-3 text-[11.5px] text-gray-400">
                                    <Loader2 size={13} className="animate-spin" /> در حال دریافت بیشتر...
                                </div>
                            )}
                            {!loadingMore && hasMore && items.length > 0 && (
                                <button type="button" onClick={loadMore} className="w-full py-2 text-center text-[11px] font-bold text-indigo-500">
                                    نمایش بیشتر
                                </button>
                            )}
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const AsyncSelect = memo(AsyncSelectInner) as typeof AsyncSelectInner;
export default AsyncSelect;
