"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    CalendarDays,
    Check,
    ChevronLeft,
    ChevronRight,
    Clock,
    Loader2,
    X,
} from "lucide-react";
import type { InternalTask } from "./types";
import { patchInternalTaskDeadline } from "./Api";
import {
    JALALI_MONTHS,
    pad2,
    toGregorian,
    toJalali,
    toPersianDigits,
} from "@/lib/jalali";

type DateField = {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
};

type ActiveTab = "started_at" | "deadline";

interface DeadlineModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: InternalTask;
    onUpdated: (
        data: Pick<InternalTask, "started_at" | "deadline">
    ) => void;
}

function getSafeNumber(value: number, fallback: number) {
    return Number.isFinite(value) ? value : fallback;
}

function getMonthDays(year: number, month: number) {
    if (month <= 6) return 31;
    if (month <= 11) return 30;

    const [gy, gm, gd] = toGregorian(year, 12, 30);
    const date = new Date(gy, gm - 1, gd);

    const [jalaliYear, jalaliMonth, jalaliDay] = toJalali(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    );

    return jalaliYear === year && jalaliMonth === 12 && jalaliDay === 30
        ? 30
        : 29;
}

function parseIsoToField(value?: string | null): DateField {
    const fallback = new Date();
    const date = value ? new Date(value) : fallback;
    const safeDate = Number.isNaN(date.getTime()) ? fallback : date;

    const [year, month, day] = toJalali(
        safeDate.getFullYear(),
        safeDate.getMonth() + 1,
        safeDate.getDate()
    );

    return {
        year: getSafeNumber(year, 1404),
        month: getSafeNumber(month, 1),
        day: getSafeNumber(day, 1),
        hour: getSafeNumber(safeDate.getHours(), 0),
        minute: getSafeNumber(safeDate.getMinutes(), 0),
    };
}

function fieldToIso(field: DateField) {
    const [gy, gm, gd] = toGregorian(field.year, field.month, field.day);
    const localDate = new Date(
        gy,
        gm - 1,
        gd,
        field.hour,
        field.minute,
        0,
        0
    );
    return localDate.toISOString();
}

function getTimestamp(field: DateField) {
    const [gy, gm, gd] = toGregorian(field.year, field.month, field.day);
    return new Date(gy, gm - 1, gd, field.hour, field.minute, 0).getTime();
}

function formatField(field: DateField) {
    return `${toPersianDigits(field.day)} ${
        JALALI_MONTHS[field.month - 1]
    } ${toPersianDigits(field.year)}، ساعت ${toPersianDigits(
        pad2(field.hour)
    )}:${toPersianDigits(pad2(field.minute))}`;
}

export default function DeadlineModal({
    isOpen,
    onClose,
    task,
    onUpdated,
}: DeadlineModalProps) {
    const [activeTab, setActiveTab] = useState<ActiveTab>("started_at");
    const [startedAt, setStartedAt] = useState<DateField>(() =>
        parseIsoToField(task.started_at)
    );
    const [deadline, setDeadline] = useState<DateField>(() =>
        parseIsoToField(task.deadline)
    );
    const [calendarYear, setCalendarYear] = useState(() =>
        parseIsoToField(task.started_at).year
    );
    const [calendarMonth, setCalendarMonth] = useState(() =>
        parseIsoToField(task.started_at).month
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const nextStartedAt = parseIsoToField(task.started_at);
        const nextDeadline = parseIsoToField(task.deadline);

        setStartedAt(nextStartedAt);
        setDeadline(nextDeadline);
        setActiveTab("started_at");
        setCalendarYear(nextStartedAt.year);
        setCalendarMonth(nextStartedAt.month);
        setError(null);
    }, [isOpen, task.id, task.started_at, task.deadline]);

    const selectedField = activeTab === "started_at" ? startedAt : deadline;

    const monthDays = useMemo(
        () => getMonthDays(calendarYear, calendarMonth),
        [calendarYear, calendarMonth]
    );

    const firstDayGregorian = useMemo(
        () => toGregorian(calendarYear, calendarMonth, 1),
        [calendarYear, calendarMonth]
    );

    const firstDayWeekIndex = useMemo(() => {
        const [gy, gm, gd] = firstDayGregorian;
        const date = new Date(gy, gm - 1, gd);
        return (date.getDay() + 1) % 7;
    }, [firstDayGregorian]);

    const calendarCells = useMemo(
        () => [
            ...Array.from({ length: firstDayWeekIndex }, () => null),
            ...Array.from({ length: monthDays }, (_, index) => index + 1),
        ],
        [firstDayWeekIndex, monthDays]
    );

    function updateSelectedField(partial: Partial<DateField>) {
        setError(null);

        if (activeTab === "started_at") {
            setStartedAt((previous) => ({
                ...previous,
                ...partial,
            }));
            return;
        }

        setDeadline((previous) => ({
            ...previous,
            ...partial,
        }));
    }

    function selectDay(day: number) {
        updateSelectedField({
            year: calendarYear,
            month: calendarMonth,
            day,
        });
    }

    function goToPreviousMonth() {
        if (calendarMonth === 1) {
            setCalendarYear((previous) => previous - 1);
            setCalendarMonth(12);
            return;
        }

        setCalendarMonth((previous) => previous - 1);
    }

    function goToNextMonth() {
        if (calendarMonth === 12) {
            setCalendarYear((previous) => previous + 1);
            setCalendarMonth(1);
            return;
        }

        setCalendarMonth((previous) => previous + 1);
    }

    function changeTab(tab: ActiveTab) {
        setActiveTab(tab);
        setError(null);

        const field = tab === "started_at" ? startedAt : deadline;
        setCalendarYear(field.year);
        setCalendarMonth(field.month);
    }

    async function handleSubmit() {
        if (getTimestamp(deadline) <= getTimestamp(startedAt)) {
            setError("مهلت انجام باید بعد از زمان شروع باشد.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const startedIso = fieldToIso(startedAt);
            const deadlineIso = fieldToIso(deadline);

            const { data } = await patchInternalTaskDeadline(task.id, {
                started_at: startedIso,
                deadline: deadlineIso,
            });

            onUpdated({
                started_at: data.started_at ?? startedIso,
                deadline: data.deadline ?? deadlineIso,
            });

            onClose();
        } catch (requestError: unknown) {
            const errorData =
                typeof requestError === "object" &&
                requestError !== null &&
                "response" in requestError
                    ? (
                          requestError as {
                              response?: {
                                  data?: {
                                      detail?: string;
                                      started_at?: string[];
                                      deadline?: string[];
                                  };
                              };
                          }
                      ).response?.data
                    : undefined;

            const errorMsg =
                errorData?.detail ||
                errorData?.started_at?.[0] ||
                errorData?.deadline?.[0] ||
                "خطا در ثبت بازه زمانی.";

            setError(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    dir="rtl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    style={{
                        background: "rgba(2, 6, 23, 0.58)",
                        backdropFilter: "blur(6px)",
                    }}
                    onClick={() => {
                        if (!isSubmitting) onClose();
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.97 }}
                        transition={{ duration: 0.24, ease: "easeOut" }}
                        onClick={(event) => event.stopPropagation()}
                        className="w-full max-w-md overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-2xl dark:border-white/[0.07] dark:bg-[#0f172a]"
                    >
                        <div className="flex items-center justify-between px-6 pb-4 pt-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                                    <CalendarDays size={18} />
                                </div>

                                <div>
                                    <h2 className="text-[15px] font-extrabold text-slate-900 dark:text-white">
                                        تعیین بازه زمانی
                                    </h2>

                                    <p className="mt-1 line-clamp-1 max-w-[235px] text-[11px] font-medium text-slate-400">
                                        {task.title}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition-colors hover:text-slate-700 disabled:opacity-40 dark:bg-white/[0.06] dark:hover:text-white"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <div className="px-6">
                            <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1 dark:bg-white/[0.05]">
                                <button
                                    type="button"
                                    onClick={() => changeTab("started_at")}
                                    className={`flex h-10 items-center justify-center gap-2 rounded-xl text-[12px] font-bold transition-all ${
                                        activeTab === "started_at"
                                            ? "bg-white text-indigo-600 shadow-sm dark:bg-[#172033] dark:text-indigo-300"
                                            : "text-slate-400"
                                    }`}
                                >
                                    <Clock size={14} />
                                    زمان شروع
                                </button>

                                <button
                                    type="button"
                                    onClick={() => changeTab("deadline")}
                                    className={`flex h-10 items-center justify-center gap-2 rounded-xl text-[12px] font-bold transition-all ${
                                        activeTab === "deadline"
                                            ? "bg-white text-indigo-600 shadow-sm dark:bg-[#172033] dark:text-indigo-300"
                                            : "text-slate-400"
                                    }`}
                                >
                                    <CalendarDays size={14} />
                                    مهلت انجام
                                </button>
                            </div>

                            <div className="mt-4 rounded-2xl border border-slate-100 p-3 dark:border-white/[0.06]">
                                <div className="mb-4 flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={goToNextMonth}
                                        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-500 dark:hover:bg-indigo-500/10"
                                    >
                                        <ChevronRight size={16} />
                                    </button>

                                    <span className="text-[13px] font-extrabold text-slate-800 dark:text-slate-100">
                                        {JALALI_MONTHS[calendarMonth - 1]}{" "}
                                        {toPersianDigits(calendarYear)}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={goToPreviousMonth}
                                        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-500 dark:hover:bg-indigo-500/10"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                    {[
                                        "ش",
                                        "ی",
                                        "د",
                                        "س",
                                        "چ",
                                        "پ",
                                        "ج",
                                    ].map((day, index) => (
                                        <span
                                            key={`weekday-${index}`}
                                            className="flex h-8 items-center justify-center text-[10px] font-bold text-slate-400"
                                        >
                                            {day}
                                        </span>
                                    ))}

                                    {calendarCells.map((day, index) => {
                                        const isSelected =
                                            day !== null &&
                                            selectedField.year ===
                                                calendarYear &&
                                            selectedField.month ===
                                                calendarMonth &&
                                            selectedField.day === day;

                                        return (
                                            <div
                                                key={`calendar-${calendarYear}-${calendarMonth}-${day ?? "empty"}-${index}`}
                                                className="flex h-9 items-center justify-center"
                                            >
                                                {day !== null && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            selectDay(day)
                                                        }
                                                        className={`flex h-8 w-8 items-center justify-center rounded-xl text-[11px] font-bold transition-all ${
                                                            isSelected
                                                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                                                                : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                                                        }`}
                                                    >
                                                        {toPersianDigits(day)}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <label className="rounded-2xl border border-slate-100 px-3 py-2.5 dark:border-white/[0.06]">
                                    <span className="mb-1.5 block text-[10px] font-bold text-slate-400">
                                        ساعت
                                    </span>

                                    <select
                                        value={selectedField.hour}
                                        onChange={(event) =>
                                            updateSelectedField({
                                                hour: Number(
                                                    event.target.value
                                                ),
                                            })
                                        }
                                        className="w-full bg-transparent text-center text-[13px] font-extrabold text-slate-700 outline-none dark:text-slate-200"
                                    >
                                        {Array.from(
                                            { length: 24 },
                                            (_, hour) => (
                                                <option
                                                    key={`hour-${hour}`}
                                                    value={hour}
                                                >
                                                    {toPersianDigits(pad2(hour))}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </label>

                                <label className="rounded-2xl border border-slate-100 px-3 py-2.5 dark:border-white/[0.06]">
                                    <span className="mb-1.5 block text-[10px] font-bold text-slate-400">
                                        دقیقه
                                    </span>

                                    <select
                                        value={selectedField.minute}
                                        onChange={(event) =>
                                            updateSelectedField({
                                                minute: Number(
                                                    event.target.value
                                                ),
                                            })
                                        }
                                        className="w-full bg-transparent text-center text-[13px] font-extrabold text-slate-700 outline-none dark:text-slate-200"
                                    >
                                        {Array.from(
                                            { length: 60 },
                                            (_, minute) => (
                                                <option
                                                    key={`minute-${minute}`}
                                                    value={minute}
                                                >
                                                    {toPersianDigits(
                                                        pad2(minute)
                                                    )}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </label>
                            </div>

                            <div className="mt-4 rounded-2xl bg-indigo-50 px-3.5 py-3 dark:bg-indigo-500/[0.08]">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-500 dark:text-indigo-300">
                                    <Clock size={13} />
                                    {activeTab === "started_at"
                                        ? "زمان شروع انتخاب‌شده"
                                        : "مهلت انجام انتخاب‌شده"}
                                </div>

                                <p className="mt-1.5 text-[11px] font-bold leading-6 text-indigo-700 dark:text-indigo-200">
                                    {formatField(selectedField)}
                                </p>
                            </div>

                            {error && (
                                <div className="mt-3 rounded-2xl bg-red-50 px-3.5 py-3 text-[11px] font-bold text-red-500 dark:bg-red-500/10 dark:text-red-400">
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="mt-5 flex items-center gap-3 px-6 pb-6">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="flex h-11 flex-1 items-center justify-center rounded-full bg-slate-100 text-[12px] font-bold text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-40 dark:bg-white/[0.06] dark:text-slate-300"
                            >
                                انصراف
                            </button>

                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-indigo-600 text-[12px] font-bold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <Loader2
                                        size={15}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <>
                                        <Check size={15} strokeWidth={2.7} />
                                        ثبت زمان‌بندی
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
