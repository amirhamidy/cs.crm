"use client";

import { useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import {
    CalendarDays,
    Loader2,
    Send,
    Tag,
    Trash2,
    X,
} from "lucide-react";

import axiosInstance from "@/lib/axiosInstance";

import { useAuthStore } from "@/store/authStore";

export interface CalendarNote {
    id: number;
    user?: number;
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

const pad = (v: number) => String(v).padStart(2, "0");

const toDateKey = (date: Date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate()
    )}`;

const getNoteDate = (note: CalendarNote) =>
    note.created_at ? note.created_at.slice(0, 10) : "";

const formatDayTitle = (date: Date | null) => {
    if (!date) return "";

    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(date);
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
    task: "وظیفه",
    internal_task: "تسک داخلی",
    reminder: "یادآور",
    deadline: "مهلت",
    note: "یادداشت",
};

const EVENT_TYPE_COLOR: Record<
    string,
    { bg: string; text: string; dot: string }
> = {
    meeting: {
        bg: "bg-violet-500/10",
        text: "text-violet-400",
        dot: "bg-violet-400",
    },
    task: {
        bg: "bg-blue-400/10",
        text: "text-gray-800",
        dot: "bg-blue-600",
    },
    internal_task: {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        dot: "bg-amber-400",
    },
    reminder: {
        bg: "bg-sky-500/10",
        text: "text-sky-400",
        dot: "bg-sky-400",
    },
    deadline: {
        bg: "bg-rose-500/10",
        text: "text-rose-400",
        dot: "bg-rose-400",
    },
    note: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        dot: "bg-emerald-400",
    },
    default: {
        bg: "bg-gray-500/10",
        text: "text-gray-400",
        dot: "bg-gray-400",
    },
};

function getTypeStyle(type: string) {
    if (type === "internal-task") {
        return EVENT_TYPE_COLOR.internal_task;
    }

    return EVENT_TYPE_COLOR[type] ?? EVENT_TYPE_COLOR.default;
}

function getEventType(type: string) {
    if (type === "internal_task" || type === "internal-task") {
        return "internal_task";
    }

    if (type === "task" || type === "tasks") {
        return "task";
    }

    if (type === "note" || type === "notes") {
        return "note";
    }

    return type;
}

function isEventOnDate(
    event: CalendarEvent,
    dateISO: string
) {
    if (!event.start) return false;

    const eventStart = event.start.slice(0, 10);

    const eventEnd = event.end
        ? event.end.slice(0, 10)
        : eventStart;

    return eventStart <= dateISO && eventEnd >= dateISO;
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
    const [deletingId, setDeletingId] =
        useState<number | null>(null);

    const selectedKey = selectedDate
        ? toDateKey(selectedDate)
        : "";

    const dayNotes = useMemo(() => {
        if (!selectedKey) return [];

        return notes.filter(
            (note) => getNoteDate(note) === selectedKey
        );
    }, [notes, selectedKey]);

    const dayEvents = useMemo(() => {
        if (!selectedKey) return [];

        return events.filter((event) =>
            isEventOnDate(event, selectedKey)
        );
    }, [events, selectedKey]);

    const disabled = isPastDay(selectedDate);

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

        setSubmitting(true);

        try {
            const { data } =
                await axiosInstance.post<CalendarNote>(
                    "/note/api/v1/create/",
                    {
                        user: Number(userId),
                        description: description.trim(),
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
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 20,
                            scale: 0.98,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                        }}
                        exit={{
                            opacity: 0,
                            y: 20,
                            scale: 0.98,
                        }}
                        transition={{ duration: 0.2 }}
                        dir="rtl"
                        className="w-full max-w-2xl rounded-[2rem] border border-gray-100 dark:border-white/[0.06] bg-white/95 dark:bg-[#0f172a]/95 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur-2xl flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/[0.06] px-6 py-5 flex-shrink-0">
                            <div className="space-y-1">
                                <h3 className="text-[13.5px] font-extrabold text-gray-900 dark:text-white">
                                    جزئیات روز
                                </h3>

                                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                                    <CalendarDays size={13} />

                                    <span>
                                        {formatDayTitle(
                                            selectedDate
                                        )}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.05] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <div className="space-y-5 p-6">
                                {dayEvents.length > 0 && (
                                    <div className="flex flex-col gap-2">
                                        <p className="text-[12.5px] font-bold text-gray-400">
                                            رویدادهای این روز
                                        </p>

                                        {dayEvents.map((ev) => {
                                            const normalizedType =
                                                getEventType(
                                                    ev.type
                                                );

                                            const s =
                                                getTypeStyle(
                                                    normalizedType
                                                );

                                            const label =
                                                EVENT_TYPE_LABEL[
                                                normalizedType
                                                ] ?? ev.type;

                                            return (
                                                <div
                                                    key={ev.id}
                                                    className={`flex items-start gap-2.5 rounded-2xl ${s.bg} px-3 py-2.5`}
                                                >
                                                    <span
                                                        className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${s.dot}`}
                                                    />

                                                    <div className="flex-1 min-w-0">
                                                        <p
                                                            className={`truncate text-[13.5px] font-semibold ${s.text}`}
                                                        >
                                                            {ev.title}
                                                        </p>

                                                        <div className="mt-0.5 flex items-center gap-2">
                                                            <span className="flex items-center gap-1 text-[12px] text-gray-400">
                                                                <Tag
                                                                    size={
                                                                        9
                                                                    }
                                                                />

                                                                {
                                                                    label
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="relative">
                                    <textarea
                                        value={description}
                                        onChange={(e) =>
                                            setDescription(
                                                e.target.value
                                            )
                                        }
                                        placeholder=" "
                                        rows={4}
                                        disabled={disabled}
                                        className="peer w-full rounded-[2rem] border border-gray-200 dark:border-white/[0.06] bg-gray-50/80 dark:bg-white/[0.03] px-5 pt-7 pb-16 text-sm leading-7 text-gray-800 dark:text-gray-100 outline-none transition-all focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10 resize-none disabled:cursor-not-allowed disabled:opacity-60"
                                    />

                                    <label className="absolute right-5 top-5 text-sm text-gray-400 transition-all pointer-events-none peer-focus:top-3 peer-focus:text-[11px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-[11px]">
                                        {disabled
                                            ? "برای روزهای گذشته امکان ثبت یادداشت وجود ندارد"
                                            : "یادداشت این روز..."}
                                    </label>

                                    <button
                                        onClick={handleSubmit}
                                        disabled={
                                            submitting ||
                                            !description.trim() ||
                                            disabled
                                        }
                                        className="absolute left-4 bottom-4 flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 text-white transition-all hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? (
                                            <Loader2
                                                size={18}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Send size={18} />
                                        )}
                                    </button>
                                </div>

                                <div className="max-h-[300px] overflow-y-auto space-y-3">
                                    {dayNotes.length === 0 ? (
                                        <div className="rounded-[2rem] border border-dashed border-gray-100 dark:border-white/[0.06] bg-gray-50/70 dark:bg-white/[0.015] px-6 py-10 text-center">
                                            <p className="text-[11px] font-semibold text-gray-400">
                                                برای این روز هنوز
                                                یادداشتی ثبت نشده
                                            </p>
                                        </div>
                                    ) : (
                                        <AnimatePresence>
                                            {dayNotes.map(
                                                (note) => (
                                                    <motion.div
                                                        key={note.id}
                                                        layout
                                                        initial={{
                                                            opacity: 0,
                                                            y: 10,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            y: 0,
                                                        }}
                                                        exit={{
                                                            opacity: 0,
                                                            x: -20,
                                                        }}
                                                        transition={{
                                                            duration: 0.2,
                                                        }}
                                                        className="rounded-[2rem] border border-gray-100 dark:border-white/[0.06] bg-white/70 dark:bg-white/[0.02] p-4"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <p className="whitespace-pre-wrap break-words text-[11.5px] leading-7 font-semibold text-gray-700 dark:text-gray-200">
                                                                {
                                                                    note.description
                                                                }
                                                            </p>

                                                            <button
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        note.id
                                                                    )
                                                                }
                                                                disabled={
                                                                    deletingId ===
                                                                    note.id
                                                                }
                                                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all hover:bg-rose-500/10 disabled:opacity-50"
                                                            >
                                                                {deletingId ===
                                                                    note.id ? (
                                                                    <Loader2
                                                                        size={
                                                                            15
                                                                        }
                                                                        className="animate-spin text-rose-500"
                                                                    />
                                                                ) : (
                                                                    <Trash2
                                                                        size={
                                                                            15
                                                                        }
                                                                        className="text-rose-500"
                                                                    />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )
                                            )}
                                        </AnimatePresence>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}