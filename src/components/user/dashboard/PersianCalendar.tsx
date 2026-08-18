"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import CalendarNoteModal, { CalendarNote } from "./CalendarNoteModal";

interface CalendarEvent {
    id: number;
    title: string;
    start: string;
    end: string;
    type: string;
}

const persianMonths = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
];

const weekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

const pad = (value: number) => String(value).padStart(2, "0");

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

const isToday = (date: Date) => {
    const today = new Date();
    return (
        today.getFullYear() === date.getFullYear() &&
        today.getMonth() === date.getMonth() &&
        today.getDate() === date.getDate()
    );
};

const getMonthRange = (baseDate: Date) => {
    const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
    return { start, end };
};

const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const firstWeekDay = (firstDay.getDay() + 1) % 7;
    const daysCount = lastDay.getDate();

    const cells: (Date | null)[] = [];

    for (let i = 0; i < firstWeekDay; i++) {
        cells.push(null);
    }

    for (let day = 1; day <= daysCount; day++) {
        cells.push(new Date(year, month, day));
    }

    while (cells.length % 7 !== 0) {
        cells.push(null);
    }

    return cells;
};

const getPersianMonthLabel = (date: Date) => {
    const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        year: "numeric",
        month: "numeric",
    }).formatToParts(date);

    const yearPart = parts.find((item) => item.type === "year")?.value || "";
    const monthPart = parts.find((item) => item.type === "month")?.value || "1";
    const monthIndex = Number(monthPart) - 1;

    return `${persianMonths[monthIndex]} ${yearPart}`;
};

const getPersianDayNumber = (date: Date) => {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        day: "numeric",
    }).format(date);
};

export default function PersianCalendar() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [notes, setNotes] = useState<CalendarNote[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const monthDays = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);

    const fetchMonthData = async () => {
        setLoading(true);
        try {
            const { start, end } = getMonthRange(currentMonth);

            const startParam = toDateKey(start);
            const endParam = toDateKey(end);

            const [calendarRes, notesRes] = await Promise.all([
                axiosInstance.get(`/appraisal/api/v1/calendar/?start=${startParam}&end=${endParam}`),
                axiosInstance.get("/note/api/v1/"),
            ]);

            setCalendarEvents(Array.isArray(calendarRes.data?.events) ? calendarRes.data.events : []);
            setNotes(Array.isArray(notesRes.data) ? notesRes.data : []);
        } catch (error) {
            console.error(error);
            setCalendarEvents([]);
            setNotes([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMonthData();
    }, [currentMonth]);

    const noteCountByDay = useMemo(() => {
        const map = new Map<string, number>();

        notes.forEach((note) => {
            const { targetDate } = extractNoteInfo(note.description, note.created_at);
            if (!targetDate) return;
            map.set(targetDate, (map.get(targetDate) || 0) + 1);
        });

        return map;
    }, [notes]);

    const eventCountByDay = useMemo(() => {
        const map = new Map<string, number>();

        calendarEvents.forEach((event) => {
            if (!event.start) return;
            const key = event.start.split("T")[0];
            map.set(key, (map.get(key) || 0) + 1);
        });

        return map;
    }, [calendarEvents]);

    const handlePrevMonth = () => {
        setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleSelectDate = (date: Date) => {
        setSelectedDate(date);
        setIsModalOpen(true);
    };

    const handleCreatedNote = (note: CalendarNote) => {
        setNotes((prev) => [note, ...prev]);
    };

    const handleDeletedNote = (id: number) => {
        setNotes((prev) => prev.filter((item) => item.id !== id));
    };

    return (
        <>
            <div className="w-full max-w-5xl mx-auto rounded-[2rem] border border-zinc-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-[0_20px_60px_-25px_rgba(0,0,0,0.15)] overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-200/70 dark:border-zinc-800 px-4 py-4 sm:px-6">
                    <button
                        onClick={handleNextMonth}
                        className="flex h-11 w-11 items-center justify-center rounded-full transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                        <ChevronRight size={18} className="text-zinc-600 dark:text-zinc-300" />
                    </button>

                    <h2 className="text-sm sm:text-base font-medium text-zinc-900 dark:text-white">
                        {getPersianMonthLabel(currentMonth)}
                    </h2>

                    <button
                        onClick={handlePrevMonth}
                        className="flex h-11 w-11 items-center justify-center rounded-full transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                        <ChevronLeft size={18} className="text-zinc-600 dark:text-zinc-300" />
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-px bg-zinc-200/70 dark:border-zinc-800/70">
                    {weekDays.map((day) => (
                        <div
                            key={day}
                            className="bg-zinc-50 dark:bg-zinc-950/60 py-3 text-center text-xs text-zinc-400"
                        >
                            {day}
                        </div>
                    ))}

                    {loading ? (
                        <div className="col-span-7 flex justify-center bg-white dark:bg-zinc-900 py-20">
                            <Loader2 size={24} className="animate-spin text-zinc-400" />
                        </div>
                    ) : (
                        monthDays.map((date, index) => {
                            if (!date) {
                                return (
                                    <div
                                        key={`empty-${index}`}
                                        className="min-h-[110px] bg-white dark:bg-zinc-900"
                                    />
                                );
                            }

                            const key = toDateKey(date);
                            const noteCount = noteCountByDay.get(key) || 0;
                            const eventCount = eventCountByDay.get(key) || 0;
                            const isSelected = selectedDate ? toDateKey(selectedDate) === key : false;

                            return (
                                <motion.button
                                    key={key}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSelectDate(date)}
                                    className={`relative min-h-[110px] bg-white dark:bg-zinc-900 p-3 text-right transition-all ${isSelected
                                            ? "ring-2 ring-blue-500/70"
                                            : "hover:bg-zinc-50 dark:hover:bg-zinc-950/70"
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div
                                            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm ${isToday(date)
                                                    ? "bg-blue-600 text-white"
                                                    : "text-zinc-700 dark:text-zinc-200"
                                                }`}
                                        >
                                            {getPersianDayNumber(date)}
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                            {eventCount > 0 && (
                                                <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-1 text-[10px] text-amber-700 dark:text-amber-300">
                                                    {eventCount} رویداد
                                                </span>
                                            )}

                                            {noteCount > 0 && (
                                                <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-[10px] text-blue-700 dark:text-blue-300">
                                                    {noteCount} یادداشت
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.button>
                            );
                        })
                    )}
                </div>
            </div>

            <CalendarNoteModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedDate={selectedDate}
                notes={notes}
                onCreated={handleCreatedNote}
                onDeleted={handleDeletedNote}
            />
        </>
    );
}
