"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    CalendarDays,
    Clock3,
    Loader2,
    Send,
    Tag,
    Trash2,
    X,
    FileText,
    CalendarCheck2,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { useAuthStore } from "@/store/authStore";

export interface CalendarNote {
    id: number;
    description: string;
    created_at?: string;
    updated_at?: string;
}

interface CalendarEvent {
    id: number;
    title: string;
    start: string;
    end: string;
    type: string;
}

interface CalendarNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date | null;
    notes: CalendarNote[];
    events: CalendarEvent[];
    onCreated: (note: CalendarNote) => void;
    onDeleted: (id: number) => void;
}

const pad = (value: number) => String(value).padStart(2, "0");

const toDateKey = (date: Date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const extractNoteInfo = (
    description: string,
    rawCreatedAt?: string
) => {
    const match = description.match(
        /^\*\*\[\*\*DATE:(\d{4}-\d{2}-\d{2})\*\*\]\*\*\s([\s\S]*)$/
    );

    if (match) {
        return {
            cleanDescription: match[2],
            targetDate: match[1],
        };
    }

    const fallback = rawCreatedAt
        ? rawCreatedAt.split("T")[0]
        : "";

    return {
        cleanDescription: description,
        targetDate: fallback,
    };
};

const formatDayTitle = (date: Date | null) => {
    if (!date) return "";

    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(date);
};

const formatTime = (value?: string) => {
    if (!value?.includes("T")) return null;

    return value.split("T")[1]?.slice(0, 5) || null;
};

const isPastDay = (date: Date | null) => {
    if (!date) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    return target.getTime() < today.getTime();
};

const EVENT_TYPE_LABEL: Record<string, string> = {
    meeting: "جلسه",
    task: "تسک",
    reminder: "یادآور",
    deadline: "مهلت",
    note: "یادداشت",
};

const EVENT_TYPE_STYLE: Record<
    string,
    {
        bg: string;
        text: string;
        dot: string;
        border: string;
    }
> = {
    meeting: {
        bg: "bg-violet-500/[0.07] dark:bg-violet-400/[0.08]",
        text: "text-violet-600 dark:text-violet-300",
        dot: "bg-violet-500",
        border: "border-violet-500/10 dark:border-violet-400/10",
    },
    task: {
        bg: "bg-amber-500/[0.07] dark:bg-amber-400/[0.08]",
        text: "text-amber-600 dark:text-amber-300",
        dot: "bg-amber-500",
        border: "border-amber-500/10 dark:border-amber-400/10",
    },
    reminder: {
        bg: "bg-cyan-500/[0.07] dark:bg-cyan-400/[0.08]",
        text: "text-cyan-600 dark:text-cyan-300",
        dot: "bg-cyan-500",
        border: "border-cyan-500/10 dark:border-cyan-400/10",
    },
    deadline: {
        bg: "bg-rose-500/[0.07] dark:bg-rose-400/[0.08]",
        text: "text-rose-600 dark:text-rose-300",
        dot: "bg-rose-500",
        border: "border-rose-500/10 dark:border-rose-400/10",
    },
    note: {
        bg: "bg-emerald-500/[0.07] dark:bg-emerald-400/[0.08]",
        text: "text-emerald-600 dark:text-emerald-300",
        dot: "bg-emerald-500",
        border: "border-emerald-500/10 dark:border-emerald-400/10",
    },
    default: {
        bg: "bg-slate-500/[0.05] dark:bg-white/[0.04]",
        text: "text-slate-500 dark:text-slate-400",
        dot: "bg-slate-400 dark:bg-slate-500",
        border: "border-slate-200 dark:border-white/[0.06]",
    },
};

function getEventStyle(type: string) {
    return EVENT_TYPE_STYLE[type] ?? EVENT_TYPE_STYLE.default;
}

export default function CalendarNoteModal({
    isOpen,
    onClose,
    selectedDate,
    notes,
    events,
    onCreated,
    onDeleted,
}: CalendarNoteModalProps) {
    const { userId } = useAuthStore();

    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const selectedKey = selectedDate
        ? toDateKey(selectedDate)
        : "";

    const disabled = isPastDay(selectedDate);

    const dayNotes = useMemo(() => {
        if (!selectedKey) return [];

        return notes
            .filter((note) => {
                const info = extractNoteInfo(
                    note.description,
                    note.created_at
                );

                return info.targetDate === selectedKey;
            })
            .map((note) => {
                const info = extractNoteInfo(
                    note.description,
                    note.created_at
                );

                return {
                    ...note,
                    displayDescription: info.cleanDescription,
                };
            });
    }, [notes, selectedKey]);

    const dayEvents = useMemo(() => {
        if (!selectedKey) return [];

        return events.filter((event) => {
            if (!event.start) return false;

            const eventStart = event.start.split("T")[0];
            const eventEnd = event.end
                ? event.end.split("T")[0]
                : eventStart;

            return (
                selectedKey >= eventStart &&
                selectedKey <= eventEnd
            );
        });
    }, [events, selectedKey]);

    const handleSubmit = async () => {
        if (
            !selectedDate ||
            !description.trim() ||
            !userId ||
            submitting ||
            disabled
        ) {
            return;
        }

        const payloadDescription = `**[**DATE:${selectedKey}**]** ${description.trim()}`;

        setSubmitting(true);

        try {
            const { data } = await axiosInstance.post(
                "/note/api/v1/create/",
                {
                    user: Number(userId),
                    description: payloadDescription,
                }
            );

            onCreated(data);
            setDescription("");
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (deletingId !== null) return;

        setDeletingId(id);

        try {
            await axiosInstance.delete(
                `/note/api/v1/${id}/delete/`
            );

            onDeleted(id);
        } catch (error) {
            console.error(error);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && selectedDate && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[3px]"
                    onMouseDown={onClose}
                >
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 12,
                            scale: 0.985,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                        }}
                        exit={{
                            opacity: 0,
                            y: 12,
                            scale: 0.985,
                        }}
                        transition={{
                            duration: 0.2,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        dir="rtl"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                        className="flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] dark:border-white/[0.07] dark:bg-[#111827] dark:shadow-[0_24px_80px_-32px_rgba(0,0,0,0.65)]"
                    >
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/[0.06]">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/10 bg-indigo-500/[0.07] text-indigo-600 dark:border-indigo-400/10 dark:bg-indigo-400/[0.08] dark:text-indigo-300">
                                    <CalendarDays size={17} />
                                </div>

                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="truncate text-[13px] font-extrabold text-slate-900 dark:text-white">
                                            جزئیات روز
                                        </h3>

                                        {disabled ? (
                                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-400 dark:bg-white/[0.05] dark:text-slate-500">
                                                گذشته
                                            </span>
                                        ) : (
                                            <span className="rounded-md bg-emerald-500/[0.08] px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:bg-emerald-400/[0.08] dark:text-emerald-300">
                                                فعال
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-1 flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-400 dark:text-slate-500">
                                        <CalendarCheck2 size={11} />
                                        <span>
                                            {formatDayTitle(
                                                selectedDate
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto">
                            <div className="space-y-5 p-5">
                                {dayEvents.length > 0 && (
                                    <section>
                                        <div className="mb-2.5 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                                <h4 className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                                                    برنامه‌های این روز
                                                </h4>
                                            </div>

                                            <span className="rounded-md bg-slate-100 px-1.5 py-1 text-[9px] font-bold text-slate-400 dark:bg-white/[0.05] dark:text-slate-500">
                                                {dayEvents.length}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            {dayEvents.map((event) => {
                                                const style =
                                                    getEventStyle(
                                                        event.type
                                                    );

                                                const label =
                                                    EVENT_TYPE_LABEL[
                                                    event.type
                                                    ] ??
                                                    event.type;

                                                const start =
                                                    formatTime(
                                                        event.start
                                                    );

                                                const end =
                                                    formatTime(
                                                        event.end
                                                    );

                                                return (
                                                    <div
                                                        key={event.id}
                                                        className={`group flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors ${style.bg} ${style.border}`}
                                                    >
                                                        <span
                                                            className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`}
                                                        />

                                                        <div className="min-w-0 flex-1">
                                                            <p
                                                                className={`truncate text-[11.5px] font-bold ${style.text}`}
                                                            >
                                                                {
                                                                    event.title
                                                                }
                                                            </p>

                                                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                                                <span className="flex items-center gap-1 text-[9.5px] font-medium text-slate-400 dark:text-slate-500">
                                                                    <Tag
                                                                        size={
                                                                            9
                                                                        }
                                                                    />
                                                                    {
                                                                        label
                                                                    }
                                                                </span>

                                                                {start && (
                                                                    <span className="flex items-center gap-1 text-[9.5px] font-medium text-slate-400 dark:text-slate-500">
                                                                        <Clock3
                                                                            size={
                                                                                9
                                                                            }
                                                                        />
                                                                        {start}
                                                                        {end
                                                                            ? ` — ${end}`
                                                                            : ""}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </section>
                                )}

                                <section>
                                    <div className="mb-2.5 flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        <h4 className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                                            یادداشت جدید
                                        </h4>
                                    </div>

                                    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 transition-all focus-within:border-indigo-500/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/[0.06] dark:border-white/[0.07] dark:bg-white/[0.025] dark:focus-within:border-indigo-400/30 dark:focus-within:bg-white/[0.035]">
                                        <textarea
                                            value={description}
                                            onChange={(event) =>
                                                setDescription(
                                                    event.target
                                                        .value
                                                )
                                            }
                                            placeholder={
                                                disabled
                                                    ? "برای روزهای گذشته امکان ثبت یادداشت وجود ندارد"
                                                    : "یادداشت خود را برای این روز بنویسید..."
                                            }
                                            rows={4}
                                            disabled={disabled}
                                            className="min-h-[118px] w-full resize-none bg-transparent px-4 pb-14 pt-4 text-[12px] font-medium leading-7 text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:placeholder:text-slate-600"
                                        />

                                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                            <span className="text-[9px] font-medium text-slate-400 dark:text-slate-600">
                                                {description.trim()
                                                    ? `${description.trim().length} کاراکتر`
                                                    : "یادداشت شخصی"}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={
                                                    handleSubmit
                                                }
                                                disabled={
                                                    submitting ||
                                                    !description.trim() ||
                                                    disabled
                                                }
                                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-35 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                                            >
                                                {submitting ? (
                                                    <Loader2
                                                        size={15}
                                                        className="animate-spin"
                                                    />
                                                ) : (
                                                    <Send
                                                        size={15}
                                                    />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <div className="mb-2.5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                            <h4 className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                                                یادداشت‌های ثبت‌شده
                                            </h4>
                                        </div>

                                        {dayNotes.length > 0 && (
                                            <span className="rounded-md bg-slate-100 px-1.5 py-1 text-[9px] font-bold text-slate-400 dark:bg-white/[0.05] dark:text-slate-500">
                                                {dayNotes.length}
                                            </span>
                                        )}
                                    </div>

                                    {dayNotes.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-5 py-9 text-center dark:border-white/[0.07] dark:bg-white/[0.015]">
                                            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-white/[0.05] dark:text-slate-500">
                                                <FileText
                                                    size={15}
                                                />
                                            </div>

                                            <p className="text-[10.5px] font-semibold text-slate-400 dark:text-slate-500">
                                                هنوز یادداشتی برای این
                                                روز ثبت نشده
                                            </p>

                                            <p className="mt-1 text-[9px] font-medium text-slate-300 dark:text-slate-600">
                                                اولین یادداشت را همین
                                                جا ثبت کنید
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5">
                                            <AnimatePresence initial={false}>
                                                {dayNotes.map(
                                                    (note) => (
                                                        <motion.div
                                                            key={
                                                                note.id
                                                            }
                                                            layout
                                                            initial={{
                                                                opacity: 0,
                                                                y: 8,
                                                            }}
                                                            animate={{
                                                                opacity: 1,
                                                                y: 0,
                                                            }}
                                                            exit={{
                                                                opacity: 0,
                                                                height: 0,
                                                                marginBottom: 0,
                                                            }}
                                                            transition={{
                                                                duration: 0.18,
                                                            }}
                                                            className="group rounded-2xl border border-slate-200/80 bg-white p-3.5 transition-all hover:border-slate-300 hover:shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.1]"
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/[0.08] text-emerald-600 dark:bg-emerald-400/[0.08] dark:text-emerald-300">
                                                                    <FileText
                                                                        size={
                                                                            13
                                                                        }
                                                                    />
                                                                </div>

                                                                <div className="min-w-0 flex-1">
                                                                    <p className="whitespace-pre-wrap break-words text-[11px] font-medium leading-6 text-slate-600 dark:text-slate-300">
                                                                        {
                                                                            note.displayDescription
                                                                        }
                                                                    </p>

                                                                    {note.created_at && (
                                                                        <p className="mt-2 text-[8.5px] font-medium text-slate-300 dark:text-slate-600">
                                                                            {new Intl.DateTimeFormat(
                                                                                "fa-IR",
                                                                                {
                                                                                    hour: "2-digit",
                                                                                    minute: "2-digit",
                                                                                }
                                                                            ).format(
                                                                                new Date(
                                                                                    note.created_at
                                                                                )
                                                                            )}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            note.id
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        deletingId ===
                                                                        note.id
                                                                    }
                                                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-300 opacity-0 transition-all hover:bg-rose-500/[0.08] hover:text-rose-500 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-100 dark:text-slate-600 dark:hover:text-rose-400"
                                                                >
                                                                    {deletingId ===
                                                                        note.id ? (
                                                                        <Loader2
                                                                            size={
                                                                                13
                                                                            }
                                                                            className="animate-spin"
                                                                        />
                                                                    ) : (
                                                                        <Trash2
                                                                            size={
                                                                                13
                                                                            }
                                                                        />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    )
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </section>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3 dark:border-white/[0.06] dark:bg-white/[0.015]">
                            <div className="flex items-center gap-1.5 text-[9px] font-medium text-slate-400 dark:text-slate-500">
                                <CalendarDays size={10} />
                                <span>
                                    {disabled
                                        ? "روز گذشته"
                                        : "یادداشت‌های شخصی شما"}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-500 transition-colors hover:bg-white hover:text-slate-700 dark:hover:bg-white/[0.05] dark:hover:text-slate-200"
                            >
                                بستن
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}