"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Loader2, Send, Trash2, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { useAuthStore } from "@/store/authStore";

export interface CalendarNote {
    id: number;
    description: string;
    created_at?: string;
    updated_at?: string;
}

interface CalendarNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date | null;
    notes: CalendarNote[];
    onCreated: (note: CalendarNote) => void;
    onDeleted: (id: number) => void;
}

const pad = (v: number) => String(v).padStart(2, "0");

const toDateKey = (date: Date) => {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const extractNoteInfo = (description: string, rawCreatedAt?: string) => {
    const match = description.match(/^\[DATE:(\d{4}-\d{2}-\d{2})\]\s*([\s\S]*)$/);
    if (match) {
        return {
            cleanDescription: match[2],
            targetDate: match[1],
        };
    }
    const fallback = rawCreatedAt ? rawCreatedAt.split("T")[0] : "";
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

const isPastDay = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    return target.getTime() < today.getTime();
};

export default function CalendarNoteModal({
    isOpen,
    onClose,
    selectedDate,
    notes,
    onCreated,
    onDeleted,
}: CalendarNoteModalProps) {
    const { userId } = useAuthStore();

    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const selectedKey = selectedDate ? toDateKey(selectedDate) : "";

    const dayNotes = useMemo(() => {
        if (!selectedKey) return [];
        return notes
            .filter((note) => {
                const info = extractNoteInfo(note.description, note.created_at);
                return info.targetDate === selectedKey;
            })
            .map((note) => {
                const info = extractNoteInfo(note.description, note.created_at);
                return {
                    ...note,
                    displayDescription: info.cleanDescription,
                };
            });
    }, [notes, selectedKey]);

    const disabled = isPastDay(selectedDate);

    const handleSubmit = async () => {
        if (!selectedDate || !description.trim() || !userId || submitting || disabled) return;

        const key = toDateKey(selectedDate);
        const payloadDescription = `[DATE:${key}] ${description.trim()}`;

        setSubmitting(true);
        try {
            const { data } = await axiosInstance.post("/note/api/v1/create/", {
                user: Number(userId),
                description: payloadDescription,
            });

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
            await axiosInstance.delete(`/note/api/v1/${id}/delete/`);
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
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-2xl rounded-[2rem] border border-zinc-200/70 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-zinc-200/70 dark:border-zinc-800 px-6 py-5">
                            <div className="space-y-1">
                                <h3 className="text-base font-medium text-zinc-900 dark:text-white">
                                    یادداشت‌های روز
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                    <CalendarDays size={14} />
                                    <span>{formatDayTitle(selectedDate)}</span>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                                <X size={18} className="text-zinc-500" />
                            </button>
                        </div>

                        <div className="space-y-5 p-6">
                            <div className="relative">
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder=" "
                                    rows={4}
                                    disabled={disabled}
                                    className="peer w-full rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 px-5 pt-7 pb-16 text-sm leading-7 text-zinc-800 dark:text-zinc-100 outline-none transition-all focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10 resize-none disabled:cursor-not-allowed disabled:opacity-60"
                                />
                                <label className="absolute right-5 top-5 text-sm text-zinc-400 transition-all pointer-events-none peer-focus:top-3 peer-focus:text-[11px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-[11px]">
                                    {disabled ? "برای روزهای گذشته امکان ثبت یادداشت وجود ندارد" : "یادداشت این روز..."}
                                </label>

                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || !description.trim() || disabled}
                                    className="absolute left-4 bottom-4 flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white transition-all hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Send size={18} />
                                    )}
                                </button>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto space-y-3">
                                {dayNotes.length === 0 ? (
                                    <div className="rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 px-6 py-10 text-center">
                                        <p className="text-sm text-zinc-400">
                                            برای این روز هنوز یادداشتی ثبت نشده
                                        </p>
                                    </div>
                                ) : (
                                    <AnimatePresence>
                                        {dayNotes.map((note) => (
                                            <motion.div
                                                key={note.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.2 }}
                                                className="rounded-[2rem] border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 p-4"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <p className="whitespace-pre-wrap break-words text-sm leading-7 text-zinc-700 dark:text-zinc-200">
                                                        {note.displayDescription}
                                                    </p>

                                                    <button
                                                        onClick={() => handleDelete(note.id)}
                                                        disabled={deletingId === note.id}
                                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all hover:bg-red-50 dark:hover:bg-red-950/30"
                                                    >
                                                        {deletingId === note.id ? (
                                                            <Loader2 size={16} className="animate-spin text-red-500" />
                                                        ) : (
                                                            <Trash2 size={16} className="text-red-500" />
                                                        )}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
