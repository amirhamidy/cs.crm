"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeftCircle,
    ArrowRightCircle,
    ChevronDown,
    Clock3,
    Download,
    FileText,
    Filter,
    Image as ImageIcon,
    Paperclip,
    Search,
    UserRound,
    X,
} from "lucide-react";
import type { ApiTaskAttachment } from "@/types/purchasing";

interface Props {
    attachments: ApiTaskAttachment[];
}

type FilterType = "all" | "advance" | "revert" | "note" | "other";

const TYPE_META: Record<string, { label: string; color: string; bg: string; Icon: typeof FileText }> = {
    advance: { label: "پیشرفت", color: "#6366f1", bg: "rgba(99,102,241,0.12)", Icon: ArrowLeftCircle },
    revert: { label: "بازگشت", color: "#f43f5e", bg: "rgba(244,63,94,0.12)", Icon: ArrowRightCircle },
    note: { label: "یادداشت", color: "#0891b2", bg: "rgba(8,145,178,0.12)", Icon: FileText },
    other: { label: "سایر", color: "#64748b", bg: "rgba(100,116,139,0.12)", Icon: Paperclip },
};

const FILTERS: { id: FilterType; label: string }[] = [
    { id: "all", label: "همه" },
    { id: "advance", label: "پیشرفت" },
    { id: "revert", label: "بازگشت" },
    { id: "note", label: "یادداشت" },
    { id: "other", label: "سایر" },
];

function formatDateTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function isImageUrl(url: string) {
    const lowered = url.toLowerCase();
    return lowered.endsWith(".png") || lowered.endsWith(".jpg") || lowered.endsWith(".jpeg") || lowered.endsWith(".webp") || lowered.endsWith(".gif") || lowered.includes("/image/");
}

export default function TaskAttachmentsPanel({ attachments }: Props) {
    const [activeFilter, setActiveFilter] = useState<FilterType>("all");
    const [query, setQuery] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const counts = useMemo(() => {
        const result: Record<FilterType, number> = { all: attachments.length, advance: 0, revert: 0, note: 0, other: 0 };
        attachments.forEach((item) => {
            const type = item.type as FilterType;
            if (type === "advance" || type === "revert" || type === "note") result[type] += 1;
            else result.other += 1;
        });
        return result;
    }, [attachments]);

    const visibleItems = useMemo(() => {
        const q = query.trim().toLowerCase();
        return [...attachments]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .filter((item) => {
                if (activeFilter !== "all" && item.type !== activeFilter) {
                    if (!(activeFilter === "other" && !["advance", "revert", "note"].includes(item.type))) return false;
                }
                if (!q) return true;
                return item.note?.toLowerCase().includes(q) || item.created_by_name?.toLowerCase().includes(q) || item.type_display?.toLowerCase().includes(q);
            });
    }, [attachments, activeFilter, query]);

    return (
        <div className="flex flex-col gap-4" dir="rtl">
            <div className="flex flex-col gap-3 rounded-[1.8rem] border border-gray-100 bg-white p-4 dark:border-white/[0.07] dark:bg-[#111a2d]">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-300">
                        <Paperclip size={16} />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">پیوست‌ها و فعالیت‌ها</h3>
                        <p className="mt-0.5 text-[10px] font-medium text-gray-400">
                            {visibleItems.length} از {attachments.length} مورد
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="جستجو در یادداشت‌ها و افراد..."
                            className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pr-9 pl-3 text-[11px] font-bold text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery("")}
                                className="absolute left-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-white/[0.06]"
                            >
                                <X size={11} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-gray-100 bg-gray-50 p-1 dark:border-white/[0.06] dark:bg-white/[0.03]">
                        {FILTERS.map((filterItem) => {
                            const active = activeFilter === filterItem.id;
                            return (
                                <button
                                    key={filterItem.id}
                                    type="button"
                                    onClick={() => setActiveFilter(filterItem.id)}
                                    className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition ${active ? "bg-white text-indigo-600 shadow-sm dark:bg-[#0f172a] dark:text-indigo-300" : "text-gray-400 hover:text-indigo-500"
                                        }`}
                                >
                                    {filterItem.id === "all" && <Filter size={10} />}
                                    <span>{filterItem.label}</span>
                                    <span className={`rounded-md px-1.5 py-0.5 text-[8.5px] font-extrabold ${active ? "bg-indigo-500/12 text-indigo-600 dark:text-indigo-300" : "bg-gray-200/70 text-gray-400 dark:bg-white/[0.06]"}`}>
                                        {counts[filterItem.id]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {visibleItems.length === 0 ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-gray-200 bg-white dark:border-white/[0.08] dark:bg-white/[0.02]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-300">
                        <Paperclip size={21} />
                    </div>
                    <span className="text-[13px] font-bold text-gray-600 dark:text-gray-300">پیوستی یافت نشد</span>
                    <span className="text-[10px] font-medium text-gray-400">{query || activeFilter !== "all" ? "فیلتر یا جستجو را تغییر دهید" : "هنوز هیچ فعالیتی ثبت نشده است"}</span>
                </div>
            ) : (
                <div className="flex flex-col gap-2.5">
                    {visibleItems.map((item, index) => {
                        const meta = TYPE_META[item.type] ?? TYPE_META.other;
                        const Icon = meta.Icon;
                        const expanded = expandedId === item.id;
                        const hasImage = !!item.file_url && isImageUrl(item.file_url);

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.02 }}
                                className="group relative overflow-hidden rounded-[1.8rem] border border-gray-100 bg-white shadow-[0_6px_22px_rgba(15,23,42,0.03)] transition-all hover:shadow-[0_12px_30px_rgba(15,23,42,0.07)] dark:border-white/[0.07] dark:bg-[#111a2d]"
                            >
                                <div className="absolute inset-y-0 right-0 w-1" style={{ background: `linear-gradient(180deg, ${meta.color}, ${meta.color}45)` }} />

                                <button type="button" onClick={() => setExpandedId(expanded ? null : item.id)} className="flex w-full items-start gap-3 p-3.5 text-right">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: meta.bg, color: meta.color }}>
                                        <Icon size={16} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="rounded-lg px-2 py-1 text-[8.5px] font-extrabold" style={{ background: meta.bg, color: meta.color }}>
                                                {item.type_display || meta.label}
                                            </span>
                                            {item.process_step_order != null && (
                                                <span className="rounded-lg bg-gray-50 px-2 py-1 text-[8.5px] font-bold text-gray-400 dark:bg-white/[0.05] dark:text-white/40">
                                                    مرحله {item.process_step_order}
                                                </span>
                                            )}
                                            {item.file_url && (
                                                <span className="flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2 py-1 text-[8.5px] font-bold text-indigo-600 dark:text-indigo-300">
                                                    {hasImage ? <ImageIcon size={9} /> : <FileText size={9} />}
                                                    {hasImage ? "تصویر" : "فایل"}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] font-medium text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <UserRound size={10} />
                                                {item.created_by_name || "—"}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock3 size={10} />
                                                {formatDateTime(item.created_at)}
                                            </span>
                                        </div>

                                        {item.note && !expanded && <p className="mt-2 line-clamp-2 text-[10.5px] leading-5 text-gray-600 dark:text-white/60">{item.note}</p>}
                                    </div>

                                    <ChevronDown size={14} className={`mt-1 shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
                                </button>

                                <AnimatePresence initial={false}>
                                    {expanded && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                            <div className="border-t border-gray-100 px-3.5 pb-3.5 pt-3 dark:border-white/[0.06]">
                                                {item.note && (
                                                    <div className="rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]">
                                                        <p className="mb-1 text-[9px] font-extrabold text-gray-400">یادداشت</p>
                                                        <p className="whitespace-pre-wrap text-[10.5px] leading-6 text-gray-800 dark:text-white/85">{item.note}</p>
                                                    </div>
                                                )}

                                                {item.file_url && (
                                                    <div className="mt-2.5 overflow-hidden rounded-2xl border border-gray-100 dark:border-white/[0.07]">
                                                        {hasImage ? (
                                                            <a href={item.file_url} target="_blank" rel="noreferrer" className="block">
                                                                <img src={item.file_url} alt={item.note ?? "attachment"} className="max-h-[280px] w-full object-cover transition-transform hover:scale-[1.02]" />
                                                            </a>
                                                        ) : (
                                                            <a href={item.file_url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-2 bg-gray-50 px-3 py-2.5 transition hover:bg-indigo-50/40 dark:bg-white/[0.035] dark:hover:bg-white/[0.06]">
                                                                <span className="flex min-w-0 items-center gap-2">
                                                                    <FileText size={13} className="shrink-0 text-indigo-500" />
                                                                    <span className="truncate text-[10px] font-bold text-gray-600 dark:text-white/70">
                                                                        {decodeURIComponent(item.file_url.split("/").pop() ?? "فایل")}
                                                                    </span>
                                                                </span>
                                                                <Download size={13} className="shrink-0 text-indigo-500" />
                                                            </a>
                                                        )}
                                                    </div>
                                                )}

                                                {!item.note && !item.file_url && (
                                                    <div className="rounded-2xl bg-gray-50 px-3 py-2.5 text-center text-[10px] font-medium text-gray-400 dark:bg-white/[0.035]">
                                                        جزئیات بیشتری ثبت نشده است
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}