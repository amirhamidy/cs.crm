"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Ban,
    Calendar,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    ListTodo,
    Loader2,
    Repeat,
    Search,
    X,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { InternalTask, InternalTaskRoutine } from "./Types";
import { createInternalTaskRoutine } from "./Api";
import {
    JALALI_MONTHS,
    pad2,
    toGregorian,
    toJalali,
    toPersianDigits,
} from "@/lib/jalali";

const NEVER_REPEAT_VALUE = 2147483647;
const INTERVAL_PRESETS = [1, 3, 7, 14, 30];

type DateField = {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
};

interface CreateTaskRoutineModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: InternalTask[];
    onCreated: (routine: InternalTaskRoutine) => void;
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
        date.getDate(),
    );
    return jalaliYear === year && jalaliMonth === 12 && jalaliDay === 30
        ? 30
        : 29;
}

function nowToField(): DateField {
    const now = new Date();
    const [year, month, day] = toJalali(
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate(),
    );
    return {
        year: getSafeNumber(year, 1404),
        month: getSafeNumber(month, 1),
        day: getSafeNumber(day, 1),
        hour: now.getHours(),
        minute: now.getMinutes(),
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
        0,
    );
    return localDate.toISOString();
}

function formatField(field: DateField) {
    return `${toPersianDigits(field.day)} ${JALALI_MONTHS[field.month - 1]
        } ${toPersianDigits(field.year)}، ساعت ${toPersianDigits(
            pad2(field.hour),
        )}:${toPersianDigits(pad2(field.minute))}`;
}

interface NiceSelectOption {
    value: number;
    label: string;
}

function NiceSelect({
    value,
    onChange,
    options,
    label,
}: {
    value: number;
    onChange: (value: number) => void;
    options: NiceSelectOption[];
    label: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selectedOption =
        options.find((option) => option.value === value) || options[0];

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div className="relative flex-1" ref={ref}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-indigo-500"
            >
                <span
                    className={
                        selectedOption
                            ? "text-black dark:text-white"
                            : "text-gray-400"
                    }
                >
                    {selectedOption ? selectedOption.label : label}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>
            <label
                className={`pointer-events-none absolute right-5 rounded bg-white px-1.5 text-sm text-gray-400 transition-all duration-200 dark:bg-[#0f172a] ${isOpen || selectedOption
                    ? "top-0 text-xs text-gray-500 dark:text-gray-400"
                    : "top-1/2 -translate-y-1/2"
                    }`}
            >
                {label}
            </label>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-gray-100 bg-white p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:border-white/[0.06] dark:bg-[#0f172a]"
                        style={{ scrollbarWidth: "thin" }}
                    >
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-[13px] font-bold transition-colors ${option.value === value
                                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.04]"
                                    }`}
                            >
                                {option.label}
                                {option.value === value && <Check size={14} />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function TaskPicker({
    tasks,
    selectedId,
    onSelect,
}: {
    tasks: InternalTask[];
    selectedId: number | null;
    onSelect: (id: number) => void;
}) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const filteredTasks = useMemo(() => {
        const trimmed = query.trim();
        if (!trimmed) return tasks;
        return tasks.filter((task) =>
            task.title.toLowerCase().includes(trimmed.toLowerCase()),
        );
    }, [tasks, query]);

    const selectedTask = tasks.find((task) => task.id === selectedId) || null;

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setIsOpen((previous) => !previous)}
                className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-right text-sm outline-none transition-all duration-200 focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:focus:border-indigo-500"
            >
                <span className="flex min-w-0 items-center gap-2">
                    <ListTodo size={15} className="shrink-0 text-indigo-500" />
                    <span
                        className={`truncate font-bold ${selectedTask
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-400"
                            }`}
                    >
                        {selectedTask ? selectedTask.title : "انتخاب تسک درون‌سازمانی"}
                    </span>
                </span>
                <ChevronDown
                    size={16}
                    className={`shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:border-white/[0.06] dark:bg-[#0f172a]"
                    >
                        <div className="flex items-center gap-2 border-b border-gray-100 px-3.5 py-2.5 dark:border-white/[0.06]">
                            <Search size={14} className="shrink-0 text-gray-400" />
                            <input
                                autoFocus
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="جستجوی تسک..."
                                className="w-full bg-transparent text-[13px] text-gray-800 outline-none placeholder:text-gray-400 dark:text-gray-100"
                            />
                        </div>
                        <div
                            className="max-h-56 overflow-y-auto p-1.5"
                            style={{ scrollbarWidth: "thin" }}
                        >
                            {filteredTasks.length === 0 ? (
                                <p className="px-4 py-6 text-center text-[12px] font-semibold text-gray-400">
                                    تسکی یافت نشد
                                </p>
                            ) : (
                                filteredTasks.map((task) => (
                                    <button
                                        key={task.id}
                                        type="button"
                                        onClick={() => {
                                            onSelect(task.id);
                                            setIsOpen(false);
                                            setQuery("");
                                        }}
                                        className={`flex w-full items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-right text-[13px] font-bold transition-colors ${task.id === selectedId
                                            ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                                            : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.04]"
                                            }`}
                                    >
                                        <span className="truncate">{task.title}</span>
                                        {task.id === selectedId && <Check size={14} />}
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function CreateTaskRoutineModal({
    isOpen,
    onClose,
    tasks,
    onCreated,
}: CreateTaskRoutineModalProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [startField, setStartField] = useState<DateField>(nowToField);
    const [calendarYear, setCalendarYear] = useState(() => nowToField().year);
    const [calendarMonth, setCalendarMonth] = useState(
        () => nowToField().month,
    );
    const [intervalDays, setIntervalDays] = useState(7);
    const [customInterval, setCustomInterval] = useState("");
    const [neverRepeat, setNeverRepeat] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        const field = nowToField();
        setSelectedTaskId(null);
        setStartField(field);
        setCalendarYear(field.year);
        setCalendarMonth(field.month);
        setIntervalDays(7);
        setCustomInterval("");
        setNeverRepeat(false);
        setError(null);
        setIsSubmitting(false);
    }, [isOpen]);

    const monthDays = useMemo(
        () => getMonthDays(calendarYear, calendarMonth),
        [calendarYear, calendarMonth],
    );
    const firstDayGregorian = useMemo(
        () => toGregorian(calendarYear, calendarMonth, 1),
        [calendarYear, calendarMonth],
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
        [firstDayWeekIndex, monthDays],
    );

    function updateStartField(partial: Partial<DateField>) {
        setError(null);
        setStartField((previous) => ({ ...previous, ...partial }));
    }

    function selectDay(day: number) {
        updateStartField({ year: calendarYear, month: calendarMonth, day });
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

    const effectiveIntervalDays = neverRepeat
        ? NEVER_REPEAT_VALUE
        : customInterval.trim()
            ? Number(customInterval)
            : intervalDays;

    async function handleSubmit() {
        if (!selectedTaskId) {
            setError("لطفاً یک تسک درون‌سازمانی را انتخاب کن.");
            return;
        }
        if (
            !neverRepeat &&
            (!Number.isFinite(effectiveIntervalDays) ||
                effectiveIntervalDays <= 0)
        ) {
            setError("بازه تکرار باید یک عدد صحیح مثبت باشد.");
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const { data } = await createInternalTaskRoutine({
                task: selectedTaskId,
                start_at: fieldToIso(startField),
                interval_days: effectiveIntervalDays,
            });
            onCreated(data);
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
                                    task?: string[];
                                    start_at?: string[];
                                    interval_days?: string[];
                                };
                            };
                        }
                    ).response?.data
                    : undefined;
            const errorMessage =
                errorData?.detail ||
                errorData?.task?.[0] ||
                errorData?.start_at?.[0] ||
                errorData?.interval_days?.[0] ||
                "خطا در ایجاد تسک روتین.";
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    }

    const hoursOptions = Array.from({ length: 24 }, (_, index) => ({
        value: index,
        label: toPersianDigits(pad2(index)),
    }));
    const minutesOptions = Array.from({ length: 60 }, (_, index) => ({
        value: index,
        label: toPersianDigits(pad2(index)),
    }));

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
                        className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-gray-100 bg-white shadow-2xl dark:border-white/[0.07] dark:bg-[#0f172a]"
                        style={{ scrollbarWidth: "thin" }}
                    >
                        <div className="flex items-center justify-between px-6 pb-4 pt-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                                    <Repeat size={18} />
                                </div>
                                <div>
                                    <h2 className="text-[15px] font-extrabold text-slate-900 dark:text-white">
                                        تسک روتین جدید
                                    </h2>
                                    <p className="mt-1 text-[11px] font-medium text-slate-400">
                                        یک تسک درون‌سازمانی را تکرارشونده کن
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

                        <div className="space-y-4 px-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400">
                                    تسک درون‌سازمانی
                                </label>
                                <TaskPicker
                                    tasks={tasks}
                                    selectedId={selectedTaskId}
                                    onSelect={setSelectedTaskId}
                                />
                            </div>

                            <div className="rounded-2xl border border-slate-100 p-3 dark:border-white/[0.06]">
                                <div className="mb-3 flex items-center gap-2 px-1 text-[12px] font-bold text-slate-500 dark:text-slate-400">
                                    <Calendar size={14} className="text-indigo-500" />
                                    زمان شروع
                                </div>
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
                                    {["ش", "ی", "د", "س", "چ", "پ", "ج"].map(
                                        (day, index) => (
                                            <span
                                                key={`weekday-${index}`}
                                                className="flex h-8 items-center justify-center text-[10px] font-bold text-slate-400"
                                            >
                                                {day}
                                            </span>
                                        ),
                                    )}
                                    {calendarCells.map((day, index) => {
                                        const isSelected =
                                            day !== null &&
                                            startField.year === calendarYear &&
                                            startField.month === calendarMonth &&
                                            startField.day === day;
                                        return (
                                            <div
                                                key={`calendar-${calendarYear}-${calendarMonth}-${day ?? "empty"
                                                    }-${index}`}
                                                className="flex h-9 items-center justify-center"
                                            >
                                                {day !== null && (
                                                    <button
                                                        type="button"
                                                        onClick={() => selectDay(day)}
                                                        className={`flex h-8 w-8 items-center justify-center rounded-xl text-[11px] font-bold transition-all ${isSelected
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

                            <div className="grid grid-cols-2 gap-3">
                                <NiceSelect
                                    label="ساعت"
                                    value={startField.hour}
                                    onChange={(hour) => updateStartField({ hour })}
                                    options={hoursOptions}
                                />
                                <NiceSelect
                                    label="دقیقه"
                                    value={startField.minute}
                                    onChange={(minute) => updateStartField({ minute })}
                                    options={minutesOptions}
                                />
                            </div>

                            <div className="rounded-2xl bg-indigo-50 px-3.5 py-3 dark:bg-indigo-500/[0.08]">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-500 dark:text-indigo-300">
                                    <Clock size={13} />
                                    زمان شروع انتخاب‌شده
                                </div>
                                <p className="mt-1.5 text-[11px] font-bold leading-6 text-indigo-700 dark:text-indigo-200">
                                    {formatField(startField)}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400">
                                        بازه تکرار
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setError(null);
                                            setNeverRepeat((previous) => !previous);
                                        }}
                                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10.5px] font-bold transition-colors ${neverRepeat
                                            ? "bg-red-500/10 text-red-500"
                                            : isDark
                                                ? "bg-white/[0.05] text-gray-400"
                                                : "bg-gray-100 text-gray-500"
                                            }`}
                                    >
                                        <Ban size={12} />
                                        فقط یک‌بار اجرا شود
                                    </button>
                                </div>
                                <div
                                    className={`flex flex-wrap gap-2 transition-opacity ${neverRepeat
                                        ? "pointer-events-none opacity-40"
                                        : "opacity-100"
                                        }`}
                                >
                                    {INTERVAL_PRESETS.map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => {
                                                setIntervalDays(preset);
                                                setCustomInterval("");
                                            }}
                                            className={`rounded-xl px-3.5 py-2 text-[11.5px] font-bold transition-colors ${!customInterval.trim() &&
                                                intervalDays === preset
                                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                                                : isDark
                                                    ? "bg-white/[0.05] text-gray-300"
                                                    : "bg-gray-100 text-gray-600"
                                                }`}
                                        >
                                            هر {toPersianDigits(preset)} روز
                                        </button>
                                    ))}
                                    <input
                                        value={customInterval}
                                        onChange={(event) =>
                                            setCustomInterval(
                                                event.target.value.replace(/[^0-9]/g, ""),
                                            )
                                        }
                                        placeholder="تعداد روز دلخواه"
                                        className="w-32 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-[11.5px] font-bold text-gray-700 outline-none transition-all focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-200"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-2xl bg-red-50 px-3.5 py-3 text-[11px] font-bold text-red-500 dark:bg-red-500/10 dark:text-red-400">
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
                                    <Loader2 size={15} className="animate-spin" />
                                ) : (
                                    <>
                                        <Check size={15} strokeWidth={2.7} />
                                        ثبت تسک روتین
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