"use client";




import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { m, AnimatePresence } from "framer-motion";
import { Power, Check, X, AlertCircle, Loader2, ChevronDown, ChevronLeft, ChevronRight, Search, CalendarDays, Info, Sparkles } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import TimePicker from "@/components/TimePicker";
import { cached, listAll } from "@/lib/api";

import { toPersianDigits, toJalali, toGregorian, jalaliMonthLength, jalaliWeekday, JALALI_MONTHS, JALALI_WEEKDAYS, pad2, todayJalali } from "@/lib/jalali";

export interface Machine {
    id: number;
    name: string;
    code: string;
    std_production_per_hour: string;
    std_waste_per_hour: string;
    is_active: boolean;
    created_at: string;
}

export interface ProductionLog {
    id: number;
    date: string;
    employee: number;
    employee_name: string;
    machine: number;
    machine_name: string;
    machine_code: string;
    hours_worked: string;
    start_time?: string | null;
    end_time?: string | null;
    produced_qty: number;
    waste_qty: number;
    note: string;
    expected_production: string;
    expected_waste: string;
    efficiency: number | null;
}

export interface EmployeeItem {
    id: number;
    full_name: string;
    username: string;
}

export interface Option {
    id: number;
    label: string;
    sub?: string;
}

export const EMPLOYEES_URL = "/accounts/api/v1/employee/list/";

export function fetchAllEmployeesCached(): Promise<EmployeeItem[]> {
    return cached<EmployeeItem[]>(
        "accounts:production:machines:employees",
        () => listAll<EmployeeItem>(EMPLOYEES_URL),
        5 * 60_000
    );
}

export interface MonthlyReportDay {
    log_id: number;
    date: string;
    jalali_date: string;
    hours: string;
    produced: number;
    waste: number;
    expected_production: string;
    expected_waste: string;
    efficiency: number | null;
    note: string;
}

export interface MonthlyReportMachine {
    machine_id: number;
    machine_name: string;
    machine_code: string;
    hours: string;
    produced: number;
    waste: number;
    expected_production: string;
    expected_waste: string;
    efficiency: number | null;
    days: MonthlyReportDay[];
}

export interface MonthlyReportEmployee {
    employee_id: number;
    employee_name: string;
    hours: string;
    produced: number;
    waste: number;
    expected_production: string;
    expected_waste: string;
    efficiency: number | null;
    machines: MonthlyReportMachine[];
}

export interface MonthlyReport {
    year: number;
    month: number;
    date_from: string;
    date_to: string;
    totals: {
        hours: string;
        produced: number;
        waste: number;
        expected_production: string;
        expected_waste: string;
        efficiency: number | null;
    };
    employees: MonthlyReportEmployee[];
}

export interface MachineMonthlyOperator {
    employee_id: number;
    employee_name: string;
    hours: string;
    produced: number;
    waste: number;
    expected_production: string;
    expected_waste: string;
    efficiency: number | null;
}

export interface MachineMonthlyItem {
    machine_id: number;
    machine_name: string;
    machine_code: string;
    is_active: boolean;
    days_worked: number;
    hours: string;
    produced: number;
    waste: number;
    expected_production: string;
    expected_waste: string;
    efficiency: number | null;
    operators: MachineMonthlyOperator[];
}

export interface MachineMonthlyReport {
    year: number;
    month: number;
    date_from: string;
    date_to: string;
    totals: {
        hours: string;
        produced: number;
        waste: number;
        expected_production: string;
        expected_waste: string;
        efficiency: number | null;
    };
    machines: MachineMonthlyItem[];
}

export type GroupBy = "day" | "week" | "month" | "year";

export interface SummaryPeriod {
    key: string;
    label: string;
    date_from: string;
    date_to: string;
    hours: string;
    produced: number;
    waste: number;
    expected_production: string;
    expected_waste: string;
    efficiency: number | null;
}

export interface SummaryMachine {
    machine_id: number;
    machine_name: string;
    machine_code: string;
    hours: string;
    produced: number;
    waste: number;
    expected_production: string;
    expected_waste: string;
    efficiency: number | null;
    periods: SummaryPeriod[];
}

export interface MachineSummaryReport {
    group_by: GroupBy;
    date_from: string;
    date_to: string;
    totals: {
        hours: string;
        produced: number;
        waste: number;
        expected_production: string;
        expected_waste: string;
        efficiency: number | null;
    };
    machines: SummaryMachine[];
}

export const GRADIENTS = [
    "from-blue-500 to-indigo-500",
    "from-violet-500 to-fuchsia-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
    "from-cyan-500 to-sky-500",
];

export const gradientOf = (seed: number) => GRADIENTS[Math.abs(seed) % GRADIENTS.length];
export const initialOf = (text: string) => (text || "").trim().charAt(0) || "؟";

export function parseBackendError(error: unknown, fallback: string): string {
    const data = (error as { response?: { data?: unknown } })?.response?.data;
    if (!data) return fallback;
    if (typeof data === "string") return data.length < 200 ? data : fallback;
    if (Array.isArray(data)) return String(data[0] ?? fallback);
    if (typeof data === "object") {
        const nonField = (data as Record<string, unknown>).non_field_errors;
        if (Array.isArray(nonField) && nonField.length > 0) return String(nonField[0]);
        const detail = (data as Record<string, unknown>).detail;
        if (typeof detail === "string") return detail;
        const first = Object.values(data as Record<string, unknown>)[0];
        if (Array.isArray(first)) return String(first[0]);
        if (typeof first === "string") return first;
    }
    return fallback;
}

export function isoToJalaliString(iso: string): string {
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return iso;
    const j = toJalali(y, m, d);
    return `${j[0]}/${pad2(j[1])}/${pad2(j[2])}`;
}

export function jalaliToIso(jy: number, jm: number, jd: number): string {
    const [gy, gm, gd] = toGregorian(jy, jm, jd);
    return `${gy}-${pad2(gm)}-${pad2(gd)}`;
}

export function todayGregorian(): string {
    const n = new Date();
    return `${n.getFullYear()}-${pad2(n.getMonth() + 1)}-${pad2(n.getDate())}`;
}

export function currentJalaliYearMonth(): { jy: number; jm: number } {
    const n = new Date();
    const [jy, jm] = toJalali(n.getFullYear(), n.getMonth() + 1, n.getDate());
    return { jy, jm };
}

export const INPUT_CLS =
    "h-[52px] w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 text-[12.5px] font-bold text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:focus:border-blue-500/50";

export const SOFT_BUTTON =
    "rounded-full bg-gray-100 text-[13px] font-bold text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.08]";

export function JalaliDatePicker({
    label,
    value,
    onChange,
    placeholder = "انتخاب تاریخ",
    required = false,
}: {
    label: string;
    value: string;
    onChange: (iso: string) => void;
    placeholder?: string;
    required?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const [viewJy, setViewJy] = useState(() => {
        if (value) {
            const [y, m] = value.split("-").map(Number);
            if (y && m) {
                const [jy, jm] = toJalali(y, m, 1);
                return jy;
            }
        }
        return currentJalaliYearMonth().jy;
    });

    const [viewJm, setViewJm] = useState(() => {
        if (value) {
            const [y, m] = value.split("-").map(Number);
            if (y && m) {
                const [, jm] = toJalali(y, m, 1);
                return jm;
            }
        }
        return currentJalaliYearMonth().jm;
    });

    useEffect(() => {
        if (!open) return;
        if (value) {
            const [y, m] = value.split("-").map(Number);
            if (y && m) {
                const [jy, jm] = toJalali(y, m, 1);
                setViewJy(jy);
                setViewJm(jm);
            }
        } else {
            const { jy, jm } = currentJalaliYearMonth();
            setViewJy(jy);
            setViewJm(jm);
        }
    }, [open, value]);

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const selectedJalali = useMemo(() => {
        if (!value) return null;
        const [y, m, d] = value.split("-").map(Number);
        if (!y || !m || !d) return null;
        const [jy, jm, jd] = toJalali(y, m, d);
        return { jy, jm, jd };
    }, [value]);

    const [ty, tm, td] = todayJalali();

    const weekdayOffset = jalaliWeekday(viewJy, viewJm, 1);
    const daysInMonth = jalaliMonthLength(viewJy, viewJm);

    const cells: (number | null)[] = [
        ...Array(weekdayOffset).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    function prevMonth() {
        if (viewJm === 1) {
            setViewJm(12);
            setViewJy((y) => y - 1);
        } else {
            setViewJm((m) => m - 1);
        }
    }

    function nextMonth() {
        if (viewJm === 12) {
            setViewJm(1);
            setViewJy((y) => y + 1);
        } else {
            setViewJm((m) => m + 1);
        }
    }

    function goToday() {
        const { jy, jm } = currentJalaliYearMonth();
        setViewJy(jy);
        setViewJm(jm);
        const iso = todayGregorian();
        onChange(iso);
        setOpen(false);
    }

    function clearValue(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        onChange("");
        setOpen(false);
    }

    function handleSelectDay(day: number) {
        const iso = jalaliToIso(viewJy, viewJm, day);
        onChange(iso);
        setOpen(false);
    }

    const displayValue = selectedJalali
        ? `${toPersianDigits(selectedJalali.jd)} ${JALALI_MONTHS[selectedJalali.jm - 1]} ${toPersianDigits(selectedJalali.jy)}`
        : "";

    return (
        <div ref={ref} className="relative w-full">
            <label className="mb-2 block text-[11.5px] font-bold text-gray-400">
                {label}
                {required && <span className="text-red-500"> *</span>}
            </label>

            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`flex h-[52px] w-full items-center gap-2.5 rounded-2xl border px-4 text-right transition-all duration-200 ${open
                    ? "border-blue-500 bg-blue-50/50 dark:border-blue-500/50 dark:bg-blue-500/[0.06]"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12]"
                    }`}
            >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                    <CalendarDays size={14} className="text-blue-500" />
                </span>
                <span
                    className={`min-w-0 flex-1 truncate text-[12.5px] font-bold ${displayValue ? "text-gray-900 dark:text-white" : "text-gray-400"
                        }`}
                >
                    {displayValue || placeholder}
                </span>
                {displayValue && (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={clearValue}
                        className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
                    >
                        <X size={12} />
                    </span>
                )}
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
                        transition={{ type: "spring", damping: 24, stiffness: 340 }}
                        className="absolute right-0 top-[calc(100%+8px)] z-[99999] w-[320px] origin-top overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)] dark:border-white/[0.08] dark:bg-[#0f172a]"
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/[0.06]">
                            <button
                                type="button"
                                onClick={prevMonth}
                                className="flex h-7 w-7 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:text-gray-700 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:text-white"
                            >
                                <ChevronRight size={14} />
                            </button>

                            <div className="flex items-center gap-1.5 text-[13px] font-extrabold text-gray-900 dark:text-white">
                                <CalendarDays size={13} className="text-blue-500" />
                                <span>{JALALI_MONTHS[viewJm - 1]}</span>
                                <span className="text-gray-400">{toPersianDigits(viewJy)}</span>
                            </div>

                            <button
                                type="button"
                                onClick={nextMonth}
                                className="flex h-7 w-7 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:text-gray-700 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:text-white"
                            >
                                <ChevronLeft size={14} />
                            </button>
                        </div>

                        <div className="px-4 pt-3">
                            <div className="mb-2 grid grid-cols-7 gap-1">
                                {JALALI_WEEKDAYS.map((w) => (
                                    <div
                                        key={w}
                                        className="py-1 text-center text-[10px] font-bold text-gray-300 dark:text-white/25"
                                    >
                                        {w}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {cells.map((day, idx) => {
                                    const isSelected =
                                        day !== null &&
                                        selectedJalali !== null &&
                                        selectedJalali.jy === viewJy &&
                                        selectedJalali.jm === viewJm &&
                                        selectedJalali.jd === day;

                                    const isToday =
                                        day !== null &&
                                        ty === viewJy &&
                                        tm === viewJm &&
                                        td === day;

                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            disabled={day === null}
                                            onClick={() => day && handleSelectDay(day)}
                                            className={`aspect-square rounded-lg text-[11.5px] font-bold transition-colors ${day === null
                                                ? "invisible"
                                                : isSelected
                                                    ? "bg-blue-600 text-white shadow-sm"
                                                    : isToday
                                                        ? "border border-blue-400 bg-blue-50 text-blue-600 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-300"
                                                        : "text-gray-600 hover:bg-gray-100 dark:text-white/70 dark:hover:bg-white/[0.06] dark:hover:text-white"
                                                }`}
                                        >
                                            {day !== null ? toPersianDigits(day) : ""}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5 dark:border-white/[0.06]">
                            <button
                                type="button"
                                onClick={goToday}
                                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                            >
                                <Sparkles size={11} />
                                امروز
                            </button>
                            {value && (
                                <button
                                    type="button"
                                    onClick={clearValue}
                                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                                >
                                    <X size={11} />
                                    پاک کردن
                                </button>
                            )}
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function FloatingInput({
    label,
    id,
    value,
    onChange,
    maxLength,
    ltr = false,
}: {
    label: string;
    id: string;
    value: string;
    onChange: (value: string) => void;
    maxLength?: number;
    ltr?: boolean;
}) {
    return (
        <div className="relative">
            <input
                id={id}
                type="text"
                placeholder=" "
                value={value}
                maxLength={maxLength}
                dir={ltr ? "ltr" : undefined}
                onChange={(e) => onChange(e.target.value)}
                className={`peer pt-4 ${INPUT_CLS} ${ltr ? "text-left font-mono" : ""}`}
            />
            <label
                htmlFor={id}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-gray-400 transition-all duration-200 peer-focus:top-[15px] peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-[15px] peer-[:not(:placeholder-shown)]:text-[10px]"
            >
                {label}
            </label>
        </div>
    );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <label className="mb-2 block text-[11.5px] font-bold text-gray-400">{label}</label>
            {children}
        </div>
    );
}

export function NumberField({
    label,
    value,
    onChange,
    step,
    min,
    max,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    step?: string;
    min?: string;
    max?: string;
}) {
    return (
        <Field label={label}>
            <input
                type="number"
                inputMode="decimal"
                dir="ltr"
                step={step}
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`${INPUT_CLS} text-left`}
            />
        </Field>
    );
}

export function TimeField({
    label,
    value,
    onChange,
    required,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    required?: boolean;
}) {
    return (
        <Field label={label + (required ? " *" : "")}>
            <TimePicker value={value} onChange={onChange} />
        </Field>
    );
}

export function NiceSelect({
    label,
    options,
    value,
    onChange,
    placeholder,
    emptyText,
    loading = false,
    disabled = false,
}: {
    label: string;
    options: Option[];
    value: number | null;
    onChange: (id: number | null) => void;
    placeholder: string;
    emptyText: string;
    loading?: boolean;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    const selected = options.find((o) => o.id === value) ?? null;

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (!open) setQuery("");
    }, [open]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter(
            (o) => o.label.toLowerCase().includes(q) || o.sub?.toLowerCase().includes(q)
        );
    }, [options, query]);

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
                {selected ? (
                    <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(
                            selected.id
                        )}`}
                    >
                        {initialOf(selected.label)}
                    </span>
                ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.06]">
                        {loading ? (
                            <Loader2 size={13} className="animate-spin text-gray-400" />
                        ) : (
                            <ChevronDown size={13} className="text-gray-400" />
                        )}
                    </span>
                )}

                <span className="min-w-0 flex-1">
                    <span
                        className={`block truncate text-[12.5px] font-bold ${selected ? "text-gray-900 dark:text-white" : "text-gray-400"
                            }`}
                    >
                        {loading ? "در حال بارگذاری..." : selected?.label || placeholder}
                    </span>
                    {selected?.sub && (
                        <span className="mt-0.5 block truncate text-[10.5px] text-gray-400">
                            {selected.sub}
                        </span>
                    )}
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
                        transition={{ type: "spring", damping: 24, stiffness: 340 }}
                        className="absolute z-50 mt-2 w-full origin-top overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-xl shadow-black/5 dark:border-white/[0.08] dark:bg-[#0f172a] dark:shadow-black/40"
                    >
                        {options.length > 5 && (
                            <div className="border-b border-gray-100 px-3 py-2.5 dark:border-white/[0.06]">
                                <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.04]">
                                    <Search size={13} className="shrink-0 text-gray-400" />
                                    <input
                                        autoFocus
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="جستجو..."
                                        className="w-full bg-transparent text-[12px] font-semibold text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="max-h-56 overflow-y-auto p-1.5">
                            {visible.length === 0 ? (
                                <p className="py-6 text-center text-[12px] text-gray-400">{emptyText}</p>
                            ) : (
                                visible.map((option, index) => {
                                    const active = option.id === value;
                                    return (
                                        <m.button
                                            key={option.id}
                                            type="button"
                                            initial={{ opacity: 0, x: 6 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: Math.min(index, 10) * 0.02 }}
                                            onClick={() => {
                                                onChange(active ? null : option.id);
                                                setOpen(false);
                                            }}
                                            className={`flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-right transition-colors ${active
                                                ? "bg-blue-50 dark:bg-blue-500/10"
                                                : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                                                }`}
                                        >
                                            <span
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(
                                                    option.id
                                                )}`}
                                            >
                                                {initialOf(option.label)}
                                            </span>

                                            <span className="min-w-0 flex-1">
                                                <span
                                                    className={`block truncate text-[12.5px] font-bold ${active
                                                        ? "text-blue-600 dark:text-blue-400"
                                                        : "text-gray-900 dark:text-white"
                                                        }`}
                                                >
                                                    {option.label}
                                                </span>
                                                {option.sub && (
                                                    <span className="mt-0.5 block truncate text-[10.5px] text-gray-400">
                                                        {option.sub}
                                                    </span>
                                                )}
                                            </span>

                                            {active && (
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600">
                                                    <Check size={11} className="text-white" strokeWidth={3} />
                                                </span>
                                            )}
                                        </m.button>
                                    );
                                })
                            )}
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function StatusSwitch({
    isActive,
    loading = false,
    disabled = false,
    title,
    onToggle,
}: {
    isActive: boolean;
    loading?: boolean;
    disabled?: boolean;
    title?: string;
    onToggle: () => void;
}) {
    const trackClass = isActive
        ? "border-emerald-500/30 bg-emerald-500/[0.14] dark:border-emerald-500/40 dark:bg-emerald-500/20"
        : "border-slate-400/35 bg-[#e9ecf1] dark:border-slate-400/30 dark:bg-slate-400/[0.16]";

    const knobClass = isActive
        ? "translate-x-0 bg-emerald-500"
        : "translate-x-6 bg-slate-400 dark:bg-slate-500";

    return (
        <button
            type="button"
            role="switch"
            aria-checked={isActive}
            dir="ltr"
            title={title}
            disabled={disabled || loading}
            onClick={(e) => {
                e.stopPropagation();
                onToggle();
            }}
            className={`relative inline-flex h-7 w-[52px] shrink-0 items-center rounded-full border-[1.5px] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 ${trackClass} ${disabled ? "cursor-not-allowed opacity-55" : loading ? "cursor-wait" : "cursor-pointer"
                }`}
        >
            <span
                className={`absolute left-[1.5px] top-[1.5px] flex h-6 w-6 items-center justify-center rounded-full text-white shadow-[0_2px_6px_rgba(15,23,42,0.22)] transition-[transform,background-color] duration-200 ${knobClass}`}
            >
                {loading ? (
                    <Loader2 size={12} className="animate-spin" />
                ) : isActive ? (
                    <Check size={13} strokeWidth={3.2} />
                ) : (
                    <Power size={12} strokeWidth={2.6} />
                )}
            </span>
        </button>
    );
}

export function ErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
    return (
        <AnimatePresence>
            {message && (
                <m.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10"
                >
                    <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
                    <p className="flex-1 text-[11.5px] font-semibold leading-5 text-red-500 dark:text-red-400">
                        {message}
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 text-red-400 transition-colors hover:text-red-600"
                    >
                        <X size={13} />
                    </button>
                </m.div>
            )}
        </AnimatePresence>
    );
}

export function InfoBanner({ message }: { message: string }) {
    return (
        <div className="flex items-start gap-2.5 rounded-2xl bg-blue-50 px-3.5 py-3 dark:bg-blue-500/10">
            <Info size={14} className="mt-0.5 shrink-0 text-blue-500" />
            <p className="flex-1 text-[11.5px] font-semibold leading-5 text-blue-600 dark:text-blue-400">
                {message}
            </p>
        </div>
    );
}

export function StatCard({
    label,
    value,
    unit,
    icon,
    tone,
}: {
    label: string;
    value: string;
    unit?: string;
    icon: ReactNode;
    tone: "emerald" | "indigo" | "red" | "amber";
}) {
    const toneMap = {
        emerald: { box: "bg-emerald-500/10 text-emerald-500", text: "text-gray-900 dark:text-white" },
        indigo: { box: "bg-indigo-500/10 text-indigo-500", text: "text-indigo-600 dark:text-indigo-400" },
        red: { box: "bg-red-500/10 text-red-500", text: "text-red-600 dark:text-red-400" },
        amber: { box: "bg-amber-500/10 text-amber-500", text: "text-amber-600 dark:text-amber-400" },
    }[tone];

    return (
        <div className="flex flex-col justify-between gap-5 rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-bold text-gray-400 dark:text-gray-500">{label}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${toneMap.box}`}>
                    {icon}
                </div>
            </div>
            <p className={`text-2xl font-black ${toneMap.text}`}>
                {value}
                {unit && <span className="mr-1 text-[11px] font-bold text-gray-400">{unit}</span>}
            </p>
        </div>
    );
}

export function EfficiencyBadge({ value }: { value: number | null }) {
    if (value === null || value === undefined) {
        return <span className="text-gray-400">—</span>;
    }
    const effClass =
        value >= 90
            ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : value >= 70
                ? "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400";
    return (
        <span className={`rounded-lg border px-2 py-0.5 text-[10.5px] font-bold ${effClass}`}>
            {toPersianDigits(value.toFixed(1))}٪
        </span>
    );
}

