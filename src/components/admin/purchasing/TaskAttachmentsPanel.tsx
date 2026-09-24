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


const TYPE_META: Record<

    string,

    { label: string; color: string; bg: string; Icon: typeof FileText }

> = {

    advance: {

        label: "پیشرفت",

        color: "#2563EB",

        bg: "rgba(37,99,235,0.12)",

        Icon: ArrowLeftCircle,

    },

    revert: {

        label: "بازگشت",

        color: "#F43F5E",

        bg: "rgba(244,63,94,0.12)",

        Icon: ArrowRightCircle,

    },

    note: {

        label: "یادداشت",

        color: "#0891B2",

        bg: "rgba(6,182,212,0.12)",

        Icon: FileText,

    },

    other: {

        label: "سایر",

        color: "#5D7595",

        bg: "rgba(93,117,149,0.12)",

        Icon: Paperclip,

    },

};


function formatDateTime(value: string) {

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("fa-IR", {

        year: "numeric",

        month: "2-digit",

        day: "2-digit",

        hour: "2-digit",

        minute: "2-digit",

    });

}


function isImageUrl(url: string) {

    const lowered = url.toLowerCase();

    return (

        lowered.endsWith(".png") ||

        lowered.endsWith(".jpg") ||

        lowered.endsWith(".jpeg") ||

        lowered.endsWith(".webp") ||

        lowered.endsWith(".gif") ||

        lowered.includes("/image/")

    );

}


export default function TaskAttachmentsPanel({ attachments }: Props) {

    const [filter, setFilter] = useState<FilterType>("all");

    const [query, setQuery] = useState("");

    const [expandedId, setExpandedId] = useState<number | null>(null);


    const counts = useMemo(() => {

        const result: Record<FilterType, number> = {

            all: attachments.length,

            advance: 0,

            revert: 0,

            note: 0,

            other: 0,

        };

        attachments.forEach((item) => {

            const t = item.type as FilterType;

            if (t === "advance" || t === "revert" || t === "note") {

                result[t] += 1;

            } else {

                result.other += 1;

            }

        });

        return result;

    }, [attachments]);


    const filtered = useMemo(() => {

        const q = query.trim().toLowerCase();

        return [...attachments]

            .sort(

                (a, b) =>

                    new Date(b.created_at).getTime() -

                    new Date(a.created_at).getTime()

            )

            .filter((item) => {

                if (filter !== "all" && item.type !== filter) {

                    if (!(filter === "other" && !["advance", "revert", "note"].includes(item.type))) {

                        return false;

                    }

                }

                if (!q) return true;

                return (

                    item.note?.toLowerCase().includes(q) ||

                    item.created_by_name?.toLowerCase().includes(q) ||

                    item.type_display?.toLowerCase().includes(q)

                );

            });

    }, [attachments, filter, query]);


    const filters: { id: FilterType; label: string }[] = [

        { id: "all", label: "همه" },

        { id: "advance", label: "پیشرفت" },

        { id: "revert", label: "بازگشت" },

        { id: "note", label: "یادداشت" },

        { id: "other", label: "سایر" },

    ];


    return (

        <div className="flex flex-col gap-4" dir="rtl">

            <div className="flex flex-col gap-3 rounded-[1.8rem] border border-[#DCEAFB] bg-white p-4 dark:border-[rgba(96,165,250,0.14)] dark:bg-[#0A1930]">

                <div className="flex items-center justify-between gap-3">

                    <div className="flex items-center gap-2.5">

                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB]/15 to-[#06B6D4]/15 text-[#2563EB] dark:text-[#38BDF8]">

                            <Paperclip size={16} />

                        </div>

                        <div>

                            <h3 className="text-[13px] font-extrabold text-[#0F2647] dark:text-white">

                                پیوست‌ها و فعالیت‌ها

                            </h3>

                            <p className="mt-0.5 text-[9.5px] text-[#5D7595] dark:text-[#8FAAD1]">

                                {filtered.length} از {attachments.length} مورد

                            </p>

                        </div>

                    </div>

                </div>


                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

                    <div className="relative flex-1">

                        <Search

                            size={13}

                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5D7595] dark:text-[#8FAAD1]"

                        />

                        <input

                            type="text"

                            value={query}

                            onChange={(e) => setQuery(e.target.value)}

                            placeholder="جستجو در یادداشت‌ها و افراد..."

                            className="w-full rounded-2xl border border-[#DCEAFB] bg-white py-2.5 pr-9 pl-3 text-[11px] font-semibold text-[#0F2647] outline-none transition-all placeholder:text-[#8FAAD1] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 dark:border-[rgba(96,165,250,0.18)] dark:bg-[#0E1F38] dark:text-[#EAF2FF] dark:focus:border-[#38BDF8] dark:focus:ring-[#38BDF8]/10"

                        />

                        {query && (

                            <button

                                type="button"

                                onClick={() => setQuery("")}

                                className="absolute left-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg bg-[#F3F8FF] text-[#5D7595] dark:bg-[rgba(96,165,250,0.08)] dark:text-[#8FAAD1]"

                            >

                                <X size={11} />

                            </button>

                        )}

                    </div>


                    <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-[#DCEAFB] bg-[#F3F8FF] p-1 dark:border-[rgba(96,165,250,0.14)] dark:bg-[rgba(96,165,250,0.05)]">

                        {filters.map((f) => {

                            const active = filter === f.id;

                            return (

                                <button

                                    key={f.id}

                                    type="button"

                                    onClick={() => setFilter(f.id)}

                                    className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition ${active

                                            ? "bg-white text-[#2563EB] shadow-sm dark:bg-[#0E1F38] dark:text-[#38BDF8]"

                                            : "text-[#5D7595] hover:text-[#2563EB] dark:text-[#8FAAD1] dark:hover:text-[#38BDF8]"

                                        }`}

                                >

                                    {f.id === "all" && <Filter size={10} />}

                                    <span>{f.label}</span>

                                    <span

                                        className={`rounded-md px-1.5 py-0.5 text-[8.5px] font-extrabold ${active

                                                ? "bg-[#2563EB]/12 text-[#2563EB] dark:text-[#38BDF8]"

                                                : "bg-[#5D7595]/10 text-[#5D7595] dark:text-[#8FAAD1]"

                                            }`}

                                    >

                                        {counts[f.id]}

                                    </span>

                                </button>

                            );

                        })}

                    </div>

                </div>

            </div>


            {filtered.length === 0 ? (

                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-[#BFD9FA] bg-white dark:border-[rgba(96,165,250,0.2)] dark:bg-[rgba(96,165,250,0.03)]">

                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF5FF] text-[#2563EB] dark:bg-[rgba(96,165,250,0.08)] dark:text-[#38BDF8]">

                        <Paperclip size={21} />

                    </div>

                    <span className="text-[13px] font-bold text-[#3D5B82] dark:text-[#C7D9F2]">

                        پیوستی یافت نشد

                    </span>

                    <span className="mt-1 text-[10px] text-[#5D7595] dark:text-[#8FAAD1]">

                        {query || filter !== "all"

                            ? "فیلتر یا جستجو را تغییر دهید"

                            : "هنوز هیچ فعالیتی ثبت نشده است"}

                    </span>

                </div>

            ) : (

                <div className="flex flex-col gap-2.5">

                    {filtered.map((item, index) => {

                        const meta =

                            TYPE_META[item.type] ?? TYPE_META.other;

                        const Icon = meta.Icon;

                        const expanded = expandedId === item.id;

                        const hasImage =

                            item.file_url && isImageUrl(item.file_url);


                        return (

                            <motion.div

                                key={item.id}

                                initial={{ opacity: 0, y: 8 }}

                                animate={{ opacity: 1, y: 0 }}

                                transition={{ duration: 0.2, delay: index * 0.02 }}

                                className="group relative overflow-hidden rounded-[1.8rem] border border-[#DCEAFB] bg-white shadow-[0_6px_22px_rgba(37,99,235,0.05)] transition-all hover:shadow-[0_12px_32px_rgba(37,99,235,0.1)] dark:border-[rgba(96,165,250,0.14)] dark:bg-[#0E1F38]"

                            >

                                <div

                                    className="absolute right-0 top-0 h-full w-1"

                                    style={{

                                        background: `linear-gradient(180deg, ${meta.color}, ${meta.color}45)`,

                                    }}

                                />


                                <button

                                    type="button"

                                    onClick={() =>

                                        setExpandedId(expanded ? null : item.id)

                                    }

                                    className="flex w-full items-start gap-3 p-3.5 text-right"

                                >

                                    <div

                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"

                                        style={{ background: meta.bg, color: meta.color }}

                                    >

                                        <Icon size={16} />

                                    </div>


                                    <div className="min-w-0 flex-1">

                                        <div className="flex flex-wrap items-center gap-1.5">

                                            <span

                                                className="rounded-lg px-2 py-1 text-[8.5px] font-extrabold"

                                                style={{ background: meta.bg, color: meta.color }}

                                            >

                                                {item.type_display || meta.label}

                                            </span>


                                            {item.process_step_order != null && (

                                                <span className="rounded-lg bg-[#F3F8FF] px-2 py-1 text-[8.5px] font-bold text-[#5D7595] dark:bg-[rgba(96,165,250,0.06)] dark:text-[#8FAAD1]">

                                                    مرحله {item.process_step_order}

                                                </span>

                                            )}


                                            {item.file_url && (

                                                <span className="flex items-center gap-1 rounded-lg bg-[#2563EB]/10 px-2 py-1 text-[8.5px] font-bold text-[#2563EB] dark:text-[#38BDF8]">

                                                    {hasImage ? (

                                                        <ImageIcon size={9} />

                                                    ) : (

                                                        <FileText size={9} />

                                                    )}

                                                    {hasImage ? "تصویر" : "فایل"}

                                                </span>

                                            )}

                                        </div>


                                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] text-[#5D7595] dark:text-[#8FAAD1]">

                                            <span className="flex items-center gap-1">

                                                <UserRound size={10} />

                                                {item.created_by_name || "—"}

                                            </span>

                                            <span className="flex items-center gap-1">

                                                <Clock3 size={10} />

                                                {formatDateTime(item.created_at)}

                                            </span>

                                        </div>


                                        {item.note && !expanded && (

                                            <p className="mt-2 line-clamp-2 text-[10.5px] leading-5 text-[#3D5B82] dark:text-[#C7D9F2]">

                                                {item.note}

                                            </p>

                                        )}

                                    </div>


                                    <ChevronDown

                                        size={14}

                                        className={`mt-1 shrink-0 text-[#5D7595] transition-transform dark:text-[#8FAAD1] ${expanded ? "rotate-180" : ""

                                            }`}

                                    />

                                </button>


                                <AnimatePresence initial={false}>

                                    {expanded && (

                                        <motion.div

                                            initial={{ height: 0, opacity: 0 }}

                                            animate={{ height: "auto", opacity: 1 }}

                                            exit={{ height: 0, opacity: 0 }}

                                        >

                                            <div className="border-t border-[#DCEAFB] px-3.5 pb-3.5 pt-3 dark:border-[rgba(96,165,250,0.1)]">

                                                {item.note && (

                                                    <div className="rounded-2xl bg-[#F3F8FF] px-3 py-2.5 dark:bg-[rgba(96,165,250,0.06)]">

                                                        <p className="mb-1 text-[9px] font-extrabold text-[#5D7595] dark:text-[#8FAAD1]">

                                                            یادداشت

                                                        </p>

                                                        <p className="whitespace-pre-wrap text-[10.5px] leading-6 text-[#0F2647] dark:text-[#EAF2FF]">

                                                            {item.note}

                                                        </p>

                                                    </div>

                                                )}


                                                {item.file_url && (

                                                    <div className="mt-2.5 overflow-hidden rounded-2xl border border-[#DCEAFB] dark:border-[rgba(96,165,250,0.14)]">

                                                        {hasImage ? (

                                                            <a

                                                                href={item.file_url}

                                                                target="_blank"

                                                                rel="noreferrer"

                                                                className="block"

                                                            >

                                                                <img

                                                                    src={item.file_url}

                                                                    alt={item.note ?? "attachment"}

                                                                    className="max-h-[280px] w-full object-cover transition-transform hover:scale-[1.02]"

                                                                />

                                                            </a>

                                                        ) : (

                                                            <a

                                                                href={item.file_url}

                                                                target="_blank"

                                                                rel="noreferrer"

                                                                className="flex items-center justify-between gap-2 bg-[#F3F8FF] px-3 py-2.5 transition hover:bg-[#EAF3FF] dark:bg-[rgba(96,165,250,0.06)] dark:hover:bg-[rgba(96,165,250,0.1)]"

                                                            >

                                                                <span className="flex min-w-0 items-center gap-2">

                                                                    <FileText

                                                                        size={13}

                                                                        className="shrink-0 text-[#2563EB] dark:text-[#38BDF8]"

                                                                    />

                                                                    <span className="truncate text-[10px] font-bold text-[#3D5B82] dark:text-[#C7D9F2]">

                                                                        {decodeURIComponent(

                                                                            item.file_url.split("/").pop() ?? "فایل"

                                                                        )}

                                                                    </span>

                                                                </span>

                                                                <Download

                                                                    size={13}

                                                                    className="shrink-0 text-[#2563EB] dark:text-[#38BDF8]"

                                                                />

                                                            </a>

                                                        )}

                                                    </div>

                                                )}


                                                {!item.note && !item.file_url && (

                                                    <div className="rounded-2xl bg-[#F3F8FF] px-3 py-2.5 text-center text-[10px] text-[#5D7595] dark:bg-[rgba(96,165,250,0.06)] dark:text-[#8FAAD1]">

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



