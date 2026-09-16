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
    UserRound,
    UsersRound,
    X,
} from "lucide-react";

import axiosInstance from "@/lib/axiosInstance";
import { useAuthStore } from "@/store/authStore";

export interface CalendarPerson {
    id: number;
    full_name: string;
}

export interface CalendarPeople {
    assigned_employee?: CalendarPerson[];
    created_by?: CalendarPerson | null;
}

export interface CalendarEvent {
    id: number;
    title: string;
    start: string;
    end: string;
    type: string;
    people?: CalendarPeople | null;
}

export interface CalendarResponse {
    start: string;
    end: string;
    events: CalendarEvent[];
}

export interface CalendarNote {
    id: number;
    user?: number;
    description: string;
    created_at?: string;
    updated_at?: string;
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

const formatEventDate = (value?: string) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
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
    tasks: "وظیفه",
    internal_task: "تسک داخلی",
    "internal-task": "تسک داخلی",
    reminder: "یادآور",
    deadline: "مهلت",
    note: "یادداشت",
    notes: "یادداشت",
};

const EVENT_TYPE_COLOR: Record<
    string,
    {
        bg: string;
        text: string;
        dot: string;
        border: string;
    }
> = {
    meeting: {
        bg: "bg-violet-500/10",
        text: "text-violet-500 dark:text-violet-300",
        dot: "bg-violet-500",
        border: "border-violet-500/10",
    },
    task: {
        bg: "bg-indigo-500/10",
        text: "text-indigo-600 dark:text-indigo-300",
        dot: "bg-indigo-500",
        border: "border-indigo-500/10",
    },
    internal_task: {
        bg: "bg-amber-500/10",
        text: "text-amber-500 dark:text-amber-300",
        dot: "bg-amber-500",
        border: "border-amber-500/10",
    },
    reminder: {
        bg: "bg-cyan-500/10",
        text: "text-cyan-500 dark:text-cyan-300",
        dot: "bg-cyan-500",
        border: "border-cyan-500/10",
    },
    deadline: {
        bg: "bg-rose-500/10",
        text: "text-rose-500 dark:text-rose-300",
        dot: "bg-rose-500",
        border: "border-rose-500/10",
    },
    note: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-500 dark:text-emerald-300",
        dot: "bg-emerald-500",
        border: "border-emerald-500/10",
    },
    default: {
        bg: "bg-slate-500/10",
        text: "text-slate-500 dark:text-slate-300",
        dot: "bg-slate-500",
        border: "border-slate-500/10",
    },
};

function getEventType(type: string) {
    const normalized = String(type || "").toLowerCase();

    if (
        normalized === "internal_task" ||
        normalized === "internal-task"
    ) {
        return "internal_task";
    }

    if (
        normalized === "task" ||
        normalized === "tasks"
    ) {
        return "task";
    }

    if (
        normalized === "note" ||
        normalized === "notes"
    ) {
        return "note";
    }

    return normalized;
}

function getTypeStyle(type: string) {
    return (
        EVENT_TYPE_COLOR[getEventType(type)] ??
        EVENT_TYPE_COLOR.default
    );
}

function getTypeLabel(type: string) {
    const normalized = getEventType(type);

    return (
        EVENT_TYPE_LABEL[normalized] ??
        (type || "رویداد")
    );
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
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
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
                        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white/95 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur-2xl dark:border-white/[0.06] dark:bg-[#0f172a]/95"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-white/[0.06]">
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
                                type="button"
                                onClick={onClose}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-700 dark:bg-white/[0.05] dark:hover:text-gray-200"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <div className="space-y-5 p-6">
                                {dayEvents.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[12.5px] font-bold text-gray-400">
                                                رویدادهای این روز
                                            </p>

                                            <span className="rounded-lg bg-indigo-50 px-2 py-1 text-[9px] font-bold text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300">
                                                {dayEvents.length} رویداد
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            {dayEvents.map((event) => {
                                                const normalizedType =
                                                    getEventType(
                                                        event.type
                                                    );

                                                const style =
                                                    getTypeStyle(
                                                        normalizedType
                                                    );

                                                const assignedEmployees =
                                                    event.people
                                                        ?.assigned_employee ??
                                                    [];

                                                const creator =
                                                    event.people
                                                        ?.created_by;

                                                return (
                                                    <motion.div
                                                        key={`${event.type}-${event.id}`}
                                                        layout
                                                        initial={{
                                                            opacity: 0,
                                                            y: 8,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            y: 0,
                                                        }}
                                                        className={`rounded-[1.5rem] border ${style.border} ${style.bg} p-4`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <span
                                                                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`}
                                                            />

                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                                    <div className="min-w-0">
                                                                        <p
                                                                            className={`break-words text-[13px] font-extrabold ${style.text}`}
                                                                        >
                                                                            {
                                                                                event.title
                                                                            }
                                                                        </p>

                                                                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                                                            <span
                                                                                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[9.5px] font-bold ${style.bg} ${style.text}`}
                                                                            >
                                                                                <Tag
                                                                                    size={
                                                                                        10
                                                                                    }
                                                                                />

                                                                                {
                                                                                    getTypeLabel(
                                                                                        event.type
                                                                                    )
                                                                                }
                                                                            </span>

                                                                            <span className="rounded-lg bg-black/[0.03] px-2 py-1 text-[9px] font-bold text-gray-400 dark:bg-white/[0.04] dark:text-gray-500">
                                                                                #{event.id}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                                    <div className="flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2 dark:bg-white/[0.035]">
                                                                        <Clock3
                                                                            size={
                                                                                12
                                                                            }
                                                                            className="shrink-0 text-gray-400"
                                                                        />

                                                                        <div className="min-w-0">
                                                                            <p className="text-[8.5px] font-bold text-gray-400">
                                                                                شروع
                                                                            </p>

                                                                            <p className="mt-0.5 truncate text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                                                                {formatEventDate(
                                                                                    event.start
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2 dark:bg-white/[0.035]">
                                                                        <Clock3
                                                                            size={
                                                                                12
                                                                            }
                                                                            className="shrink-0 text-gray-400"
                                                                        />

                                                                        <div className="min-w-0">
                                                                            <p className="text-[8.5px] font-bold text-gray-400">
                                                                                پایان
                                                                            </p>

                                                                            <p className="mt-0.5 truncate text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                                                                {formatEventDate(
                                                                                    event.end
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {(assignedEmployees.length >
                                                                    0 ||
                                                                    creator) && (
                                                                        <div className="mt-3 space-y-2">
                                                                            {assignedEmployees.length >
                                                                                0 && (
                                                                                    <div className="rounded-xl bg-white/60 p-3 dark:bg-white/[0.035]">
                                                                                        <div className="mb-2 flex items-center gap-1.5">
                                                                                            <UsersRound
                                                                                                size={
                                                                                                    11
                                                                                                }
                                                                                                className="text-gray-400"
                                                                                            />

                                                                                            <span className="text-[9px] font-bold text-gray-400">
                                                                                                مسئول / افراد تخصیص‌یافته
                                                                                            </span>
                                                                                        </div>

                                                                                        <div className="flex flex-wrap gap-1.5">
                                                                                            {assignedEmployees.map(
                                                                                                (
                                                                                                    employee
                                                                                                ) => (
                                                                                                    <span
                                                                                                        key={
                                                                                                            employee.id
                                                                                                        }
                                                                                                        className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-[9.5px] font-bold text-gray-600 dark:bg-white/[0.05] dark:text-gray-300"
                                                                                                    >
                                                                                                        {
                                                                                                            employee.full_name
                                                                                                        }
                                                                                                    </span>
                                                                                                )
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                            {creator && (
                                                                                <div className="flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2.5 dark:bg-white/[0.035]">
                                                                                    <UserRound
                                                                                        size={
                                                                                            12
                                                                                        }
                                                                                        className="text-gray-400"
                                                                                    />

                                                                                    <div>
                                                                                        <p className="text-[8.5px] font-bold text-gray-400">
                                                                                            ایجادکننده
                                                                                        </p>

                                                                                        <p className="mt-0.5 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                                                                            {
                                                                                                creator.full_name
                                                                                            }
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {dayEvents.length === 0 && (
                                    <div className="rounded-[1.5rem] border border-dashed border-gray-100 bg-gray-50/70 px-6 py-8 text-center dark:border-white/[0.06] dark:bg-white/[0.015]">
                                        <p className="text-[11px] font-semibold text-gray-400">
                                            برای این روز رویدادی در تقویم ثبت نشده
                                        </p>
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
                                        className="peer w-full resize-none rounded-[2rem] border border-gray-200 bg-gray-50/80 px-5 pb-16 pt-7 text-sm leading-7 text-gray-800 outline-none transition-all focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-gray-100"
                                    />

                                    <label className="pointer-events-none absolute right-5 top-5 text-sm text-gray-400 transition-all peer-focus:top-3 peer-focus:text-[11px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-[11px]">
                                        {disabled
                                            ? "برای روزهای گذشته امکان ثبت یادداشت وجود ندارد"
                                            : "یادداشت این روز..."}
                                    </label>

                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={
                                            submitting ||
                                            !description.trim() ||
                                            disabled
                                        }
                                        className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 text-white transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
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

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[12.5px] font-bold text-gray-400">
                                            یادداشت‌های این روز
                                        </p>

                                        {dayNotes.length > 0 && (
                                            <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-300">
                                                {dayNotes.length} یادداشت
                                            </span>
                                        )}
                                    </div>

                                    <div className="max-h-[300px] space-y-3 overflow-y-auto">
                                        {dayNotes.length === 0 ? (
                                            <div className="rounded-[2rem] border border-dashed border-gray-100 bg-gray-50/70 px-6 py-10 text-center dark:border-white/[0.06] dark:bg-white/[0.015]">
                                                <p className="text-[11px] font-semibold text-gray-400">
                                                    برای این روز هنوز یادداشتی ثبت نشده
                                                </p>
                                            </div>
                                        ) : (
                                            <AnimatePresence>
                                                {dayNotes.map(
                                                    (note) => (
                                                        <motion.div
                                                            key={
                                                                note.id
                                                            }
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
                                                            className="rounded-[2rem] border border-gray-100 bg-white/70 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]"
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="whitespace-pre-wrap break-words text-[11.5px] font-semibold leading-7 text-gray-700 dark:text-gray-200">
                                                                        {
                                                                            note.description
                                                                        }
                                                                    </p>

                                                                    {note.created_at && (
                                                                        <p className="mt-2 text-[9px] font-medium text-gray-400">
                                                                            {formatEventDate(
                                                                                note.created_at
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
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}