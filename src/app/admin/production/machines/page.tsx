"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Factory,
    Plus,
    SquarePen,
    Power,
    Check,
    X,
    AlertCircle,
    Loader2,
    TrendingUp,
    BarChart3,
    AlertTriangle,
    ClipboardList,
    Trash2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Search,
    CalendarDays,
    Gauge,
    Filter,
    LineChart,
    Users,
    Info,
    Sparkles,
    Eye,
    CalendarCogIcon,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import TimePicker from "@/components/TimePicker";
import ProductionBarChart from "@/components/charts/ProductionBarChart";
import { cached, listAll } from "@/lib/api";
import { calcHoursWorked, toHHMM } from "@/lib/productionTime";
import {
    toPersianDigits,
    toJalali,
    toGregorian,
    jalaliMonthLength,
    jalaliWeekday,
    JALALI_MONTHS,
    JALALI_WEEKDAYS,
    pad2,
    todayJalali,
} from "@/lib/jalali";

interface Machine {
    id: number;
    name: string;
    code: string;
    std_production_per_hour: string;
    std_waste_per_hour: string;
    is_active: boolean;
    created_at: string;
}

interface ProductionLog {
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

interface EmployeeItem {
    id: number;
    full_name: string;
    username: string;
}

interface Option {
    id: number;
    label: string;
    sub?: string;
}

const EMPLOYEES_URL = "/accounts/api/v1/employee/list/";

function fetchAllEmployeesCached(): Promise<EmployeeItem[]> {
    return cached<EmployeeItem[]>(
        "accounts:production:machines:employees",
        () => listAll<EmployeeItem>(EMPLOYEES_URL),
        5 * 60_000
    );
}

interface MonthlyReportDay {
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

interface MonthlyReportMachine {
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

interface MonthlyReportEmployee {
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

interface MonthlyReport {
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

interface MachineMonthlyOperator {
    employee_id: number;
    employee_name: string;
    hours: string;
    produced: number;
    waste: number;
    expected_production: string;
    expected_waste: string;
    efficiency: number | null;
}

interface MachineMonthlyItem {
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

interface MachineMonthlyReport {
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

type GroupBy = "day" | "week" | "month" | "year";

interface SummaryPeriod {
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

interface SummaryMachine {
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

interface MachineSummaryReport {
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

const GRADIENTS = [
    "from-blue-500 to-indigo-500",
    "from-violet-500 to-fuchsia-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
    "from-cyan-500 to-sky-500",
];

const gradientOf = (seed: number) => GRADIENTS[Math.abs(seed) % GRADIENTS.length];
const initialOf = (text: string) => (text || "").trim().charAt(0) || "؟";

function parseBackendError(error: unknown, fallback: string): string {
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

function isoToJalaliString(iso: string): string {
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return iso;
    const j = toJalali(y, m, d);
    return `${j[0]}/${pad2(j[1])}/${pad2(j[2])}`;
}

function jalaliToIso(jy: number, jm: number, jd: number): string {
    const [gy, gm, gd] = toGregorian(jy, jm, jd);
    return `${gy}-${pad2(gm)}-${pad2(gd)}`;
}

function todayGregorian(): string {
    const n = new Date();
    return `${n.getFullYear()}-${pad2(n.getMonth() + 1)}-${pad2(n.getDate())}`;
}

function currentJalaliYearMonth(): { jy: number; jm: number } {
    const n = new Date();
    const [jy, jm] = toJalali(n.getFullYear(), n.getMonth() + 1, n.getDate());
    return { jy, jm };
}

const INPUT_CLS =
    "h-[52px] w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 text-[12.5px] font-bold text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:focus:border-blue-500/50";

const SOFT_BUTTON =
    "rounded-full bg-gray-100 text-[13px] font-bold text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.08]";

function JalaliDatePicker({
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
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={14} className="shrink-0 text-gray-400" />
                </motion.span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
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
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function FloatingInput({
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

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <label className="mb-2 block text-[11.5px] font-bold text-gray-400">{label}</label>
            {children}
        </div>
    );
}

function NumberField({
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

function TimeField({
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

function NiceSelect({
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

                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={14} className="shrink-0 text-gray-400" />
                </motion.span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
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
                                        <motion.button
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
                                        </motion.button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatusSwitch({
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

function ErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
    return (
        <AnimatePresence>
            {message && (
                <motion.div
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
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function InfoBanner({ message }: { message: string }) {
    return (
        <div className="flex items-start gap-2.5 rounded-2xl bg-blue-50 px-3.5 py-3 dark:bg-blue-500/10">
            <Info size={14} className="mt-0.5 shrink-0 text-blue-500" />
            <p className="flex-1 text-[11.5px] font-semibold leading-5 text-blue-600 dark:text-blue-400">
                {message}
            </p>
        </div>
    );
}

function ModalShell({
    icon,
    iconTone = "blue",
    title,
    subtitle,
    locked = false,
    maxWidth = "max-w-md",
    onClose,
    children,
    footer,
}: {
    icon: ReactNode;
    iconTone?: "blue" | "emerald" | "red" | "indigo";
    title: string;
    subtitle?: string;
    locked?: boolean;
    maxWidth?: string;
    onClose: () => void;
    children: ReactNode;
    footer: ReactNode;
}) {
    const onCloseRef = useRef(onClose);
    const lockedRef = useRef(locked);

    useEffect(() => {
        onCloseRef.current = onClose;
        lockedRef.current = locked;
    });

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !lockedRef.current) onCloseRef.current();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);

    const toneClass = {
        blue: "bg-blue-50 dark:bg-blue-500/10",
        emerald: "bg-emerald-50 dark:bg-emerald-500/10",
        red: "bg-red-50 dark:bg-red-500/10",
        indigo: "bg-indigo-50 dark:bg-indigo-500/10",
    }[iconTone];

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-[99999] flex items-center justify-center px-4"
            style={{ isolation: "isolate" }}
            onClick={() => {
                if (!locked) onClose();
            }}
            dir="rtl"
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="absolute inset-0 bg-black/45"
                style={{ backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)", pointerEvents: "none" }}
            />
            <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.97 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={`relative flex max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.22)] dark:border-white/[0.06] dark:bg-[#0f172a]`}
            >
                <div className="flex shrink-0 items-center justify-between px-8 pb-6 pt-8">
                    <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${toneClass}`}>
                            {icon}
                        </div>
                        <div>
                            <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                {title}
                            </h3>
                            {subtitle && <p className="mt-0.5 text-[11px] text-gray-400">{subtitle}</p>}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={locked}
                        aria-label="بستن"
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                    >
                        <X size={15} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-8 pb-2">
                    <div className="flex flex-col gap-4 pb-2">{children}</div>
                </div>

                <div className="flex shrink-0 items-center gap-2 px-8 pb-8 pt-5">{footer}</div>
            </motion.div>
        </motion.div>,
        document.body
    );
}

function MachineModal({
    machine,
    onClose,
    onSaved,
}: {
    machine: Machine | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [name, setName] = useState(machine?.name ?? "");
    const [code, setCode] = useState(machine?.code ?? "");
    const [stdProd, setStdProd] = useState(machine?.std_production_per_hour ?? "");
    const [stdWaste, setStdWaste] = useState(machine?.std_waste_per_hour ?? "0");
    const [isActive, setIsActive] = useState(machine?.is_active ?? true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const canSubmit = name.trim() !== "" && code.trim() !== "" && stdProd !== "" && !saving;

    async function handleSave() {
        if (!canSubmit) return;
        setSaving(true);
        setError("");

        const payload = {
            name: name.trim(),
            code: code.trim(),
            std_production_per_hour: stdProd,
            std_waste_per_hour: stdWaste || "0",
            is_active: isActive,
        };

        try {
            if (machine) {
                await axiosInstance.put(`/production/api/v1/machine/${machine.id}/update/`, payload);
            } else {
                await axiosInstance.post("/production/api/v1/machine/create/", payload);
            }
            onSaved();
        } catch (err) {
            setError(parseBackendError(err, "خطا در ذخیره ماشین. احتمالاً کد تکراری است."));
        } finally {
            setSaving(false);
        }
    }

    return (
        <ModalShell
            icon={<Factory size={15} className="text-blue-500" />}
            title={machine ? "ویرایش ماشین" : "تعریف ماشین جدید"}
            subtitle="مشخصات و استانداردهای تولید"
            locked={saving}
            onClose={onClose}
            footer={
                <>
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSave}
                        disabled={!canSubmit}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 text-[13px] font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
                    >
                        {saving ? (
                            <Loader2 size={15} className="animate-spin" />
                        ) : (
                            <>
                                <Check size={14} strokeWidth={3} />
                                ذخیره اطلاعات
                            </>
                        )}
                    </motion.button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className={`h-11 px-6 ${SOFT_BUTTON}`}
                    >
                        انصراف
                    </button>
                </>
            }
        >
            <ErrorBanner message={error} onClose={() => setError("")} />

            <FloatingInput id="machine_name" label="نام ماشین" value={name} onChange={setName} />
            <FloatingInput id="machine_code" label="کد یکتا (مثلاً M-01)" value={code} onChange={setCode} ltr />

            <div className="grid grid-cols-2 gap-3">
                <NumberField
                    label="تولید استاندارد در ساعت"
                    value={stdProd}
                    onChange={setStdProd}
                    step="0.01"
                    min="0"
                />
                <NumberField
                    label="ضایعات استاندارد در ساعت"
                    value={stdWaste}
                    onChange={setStdWaste}
                    step="0.01"
                    min="0"
                />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div>
                    <p className="text-[12.5px] font-bold text-gray-800 dark:text-gray-100">وضعیت ماشین</p>
                    <p className="mt-0.5 text-[10.5px] text-gray-400">
                        {isActive ? "ماشین فعال است و در لیست ثبت لاگ نمایش داده می‌شود" : "ماشین غیرفعال است"}
                    </p>
                </div>
                <StatusSwitch isActive={isActive} onToggle={() => setIsActive((v) => !v)} />
            </div>
        </ModalShell>
    );
}

function LogModal({
    machines,
    onClose,
    onSaved,
}: {
    machines: Machine[];
    onClose: () => void;
    onSaved: () => void;
}) {
    const [employees, setEmployees] = useState<EmployeeItem[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);

    const [date, setDate] = useState(() => todayGregorian());
    const [employeeId, setEmployeeId] = useState<number | null>(null);
    const [machineId, setMachineId] = useState<number | null>(null);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [produced, setProduced] = useState("");
    const [waste, setWaste] = useState("0");
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let alive = true;
        fetchAllEmployeesCached()
            .then((all) => {
                if (alive) setEmployees(all);
            })
            .catch(() => {
                if (alive) setError("دریافت لیست کارمندان انجام نشد");
            })
            .finally(() => {
                if (alive) setLoadingEmployees(false);
            });
        return () => {
            alive = false;
        };
    }, []);

    const employeeOptions = useMemo<Option[]>(
        () =>
            employees.map((e) => ({
                id: e.id,
                label: e.full_name || e.username,
                sub: `@${e.username}`,
            })),
        [employees]
    );

    const machineOptions = useMemo<Option[]>(
        () =>
            machines
                .filter((m) => m.is_active)
                .map((m) => ({ id: m.id, label: m.name, sub: `کد: ${m.code}` })),
        [machines]
    );

    const selectedMachine = machines.find((m) => m.id === machineId);
    const hours = calcHoursWorked(startTime, endTime);
    const expectedProd = selectedMachine && hours !== null ? hours * Number(selectedMachine.std_production_per_hour || 0) : null;
    const expectedWasteVal = selectedMachine && hours !== null ? hours * Number(selectedMachine.std_waste_per_hour || 0) : null;
    const liveEff = expectedProd && produced !== "" ? Math.round((Number(produced) / expectedProd) * 1000) / 10 : null;

    const canSubmit =
        employeeId !== null &&
        machineId !== null &&
        produced !== "" &&
        hours !== null &&
        startTime !== "" &&
        endTime !== "" &&
        date !== "" &&
        !saving;

    async function handleSave() {
        if (!canSubmit) return;

        setSaving(true);
        setError("");

        try {
            await axiosInstance.post("/production/api/v1/log/create/", {
                date,
                employee: employeeId,
                machine: machineId,
                start_time: startTime,
                end_time: endTime,
                hours_worked: String(hours),
                produced_qty: Number(produced),
                waste_qty: Number(waste || 0),
                note: note.trim(),
            });
            onSaved();
        } catch (err) {
            setError(
                parseBackendError(
                    err,
                    "خطا در ثبت لاگ. احتمالاً برای این تاریخ و ماشین، رکوردی از این کارمند ثبت شده است."
                )
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <ModalShell
            icon={<ClipboardList size={15} className="text-emerald-500" />}
            iconTone="emerald"
            title="ثبت لاگ تولید"
            subtitle="ثبت رکورد تولید روزانه"
            maxWidth="max-w-lg"
            locked={saving}
            onClose={onClose}
            footer={
                <>
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSave}
                        disabled={!canSubmit}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 text-[13px] font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
                    >
                        {saving ? (
                            <Loader2 size={15} className="animate-spin" />
                        ) : (
                            <>
                                <Check size={14} strokeWidth={3} />
                                ثبت نهایی
                            </>
                        )}
                    </motion.button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="flex h-11 flex-1 items-center justify-center rounded-full border border-gray-100 bg-gray-50 text-[13px] font-bold text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-40 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white/50 dark:hover:text-white/80"
                    >
                        انصراف
                    </button>
                </>
            }
        >
            <ErrorBanner message={error} onClose={() => setError("")} />
            <InfoBanner message="روی تاریخ کلیک کنید و از تقویم شمسی، روز مورد نظر را انتخاب کنید." />

            <NiceSelect
                label="پرسنل"
                placeholder="انتخاب کارمند"
                emptyText="کارمندی یافت نشد"
                loading={loadingEmployees}
                options={employeeOptions}
                value={employeeId}
                onChange={(id) => {
                    setEmployeeId(id);
                    setError("");
                }}
            />

            <NiceSelect
                label="ماشین"
                placeholder="انتخاب دستگاه"
                emptyText="ماشین فعالی وجود ندارد"
                options={machineOptions}
                value={machineId}
                onChange={(id) => {
                    setMachineId(id);
                    setError("");
                }}
            />

            <div className="grid grid-cols-2 gap-3">
                <JalaliDatePicker
                    label="تاریخ"
                    value={date}
                    onChange={setDate}
                    placeholder="انتخاب تاریخ"
                    required
                />
                <TimeField label="ساعت شروع" value={startTime} onChange={setStartTime} required />
                <TimeField label="ساعت پایان" value={endTime} onChange={setEndTime} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <NumberField label="تعداد تولید شده" value={produced} onChange={setProduced} min="0" />
                <NumberField label="مقدار ضایعات" value={waste} onChange={setWaste} min="0" />
            </div>

            {expectedProd !== null && (
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] px-4 py-3 text-[12px] font-bold text-blue-600 dark:text-blue-300">
                    تولید مورد انتظار: {toPersianDigits(expectedProd.toFixed(2))} | ضایعات مورد انتظار: {toPersianDigits((expectedWasteVal ?? 0).toFixed(2))} | راندمان: {liveEff === null ? "—" : toPersianDigits(String(liveEff)) + "٪"}
                </div>
            )}

            <FloatingInput
                id="log_note"
                label="توضیحات (اختیاری)"
                value={note}
                onChange={setNote}
                maxLength={255}
            />
        </ModalShell>
    );
}

function ConfirmDeleteLog({
    log,
    onClose,
    onDeleted,
}: {
    log: ProductionLog;
    onClose: () => void;
    onDeleted: () => void;
}) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");

    async function handleDelete() {
        setDeleting(true);
        setError("");
        try {
            await axiosInstance.delete(`/production/api/v1/log/${log.id}/delete/`);
            onDeleted();
        } catch (err) {
            setError(parseBackendError(err, "حذف رکورد با خطا مواجه شد"));
        } finally {
            setDeleting(false);
        }
    }

    return (
        <ModalShell
            icon={<Trash2 size={15} className="text-red-500" />}
            iconTone="red"
            title="حذف رکورد تولید"
            maxWidth="max-w-sm"
            locked={deleting}
            onClose={onClose}
            footer={
                <>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-red-600 text-[13px] font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                    >
                        {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={14} />}
                        {deleting ? "در حال حذف..." : "حذف کن"}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className={`h-11 px-6 ${SOFT_BUTTON}`}
                    >
                        انصراف
                    </button>
                </>
            }
        >
            <p className="text-[12.5px] leading-6 text-gray-600 dark:text-gray-400">
                رکورد{" "}
                <span className="font-extrabold text-gray-900 dark:text-white">«{log.employee_name}»</span> روی
                ماشین{" "}
                <span className="font-extrabold text-gray-900 dark:text-white">«{log.machine_name}»</span> در
                تاریخ {toPersianDigits(isoToJalaliString(log.date))} حذف می‌شود. این عملیات قابل بازگشت نیست.
            </p>
            <ErrorBanner message={error} onClose={() => setError("")} />
        </ModalShell>
    );
}

function ViewNoteModal({
    log,
    onClose,
}: {
    log: ProductionLog;
    onClose: () => void;
}) {
    return (
        <ModalShell
            icon={<Eye size={15} className="text-blue-500" />}
            title="مشاهده جزئیات و توضیحات"
            maxWidth="max-w-md"
            onClose={onClose}
            footer={
                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-11 w-full items-center justify-center rounded-full bg-gray-100 text-[13px] font-bold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.08]"
                >
                    بستن
                </button>
            }
        >
            <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div className="flex items-center justify-between text-[12px]">
                    <span className="text-gray-500">پرسنل:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{log.employee_name}</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                    <span className="text-gray-500">ماشین:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                        {log.machine_name} ({log.machine_code})
                    </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                    <span className="text-gray-500">تاریخ:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                        {toPersianDigits(isoToJalaliString(log.date))}
                    </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                    <span className="text-gray-500">ساعت کار:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                        {toPersianDigits(log.hours_worked)} ساعت
                    </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                    <span className="text-gray-500">تولید / ضایعات:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                        {toPersianDigits(log.produced_qty)} / {toPersianDigits(log.waste_qty)}
                    </span>
                </div>
            </div>

            <div className="mt-2">
                <label className="mb-2 block text-[11.5px] font-bold text-gray-400">توضیحات ثبت شده:</label>
                <div className="min-h-[80px] rounded-2xl border border-gray-100 bg-white p-4 text-[12.5px] leading-6 text-gray-700 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-gray-300">
                    {log.note && log.note.trim() !== "" ? (
                        log.note
                    ) : (
                        <span className="text-gray-400 italic">بدون توضیحات</span>
                    )}
                </div>
            </div>
        </ModalShell>
    );
}

function StatCard({
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

function EfficiencyBadge({ value }: { value: number | null }) {
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

type TabKey = "dashboard" | "machines" | "logs" | "monthly" | "machineSummary" | "machineMonthly";

export default function AdminProductionManagementPage() {
    const [machines, setMachines] = useState<Machine[]>([]);
    const [logs, setLogs] = useState<ProductionLog[]>([]);
    const [employees, setEmployees] = useState<EmployeeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState("");
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>("dashboard");

    const [machineModal, setMachineModal] = useState<{ open: boolean; machine: Machine | null }>({
        open: false,
        machine: null,
    });
    const [showLogModal, setShowLogModal] = useState(false);
    const [logToDelete, setLogToDelete] = useState<ProductionLog | null>(null);
    const [logToView, setLogToView] = useState<ProductionLog | null>(null);

    const [filterEmployeeId, setFilterEmployeeId] = useState<number | null>(null);
    const [filterMachineId, setFilterMachineId] = useState<number | null>(null);
    const [filterDateFrom, setFilterDateFrom] = useState("");
    const [filterDateTo, setFilterDateTo] = useState("");
    const [machineStatusFilter, setMachineStatusFilter] = useState<number | null>(null);

    const { jy: currentJy, jm: currentJm } = useMemo(() => currentJalaliYearMonth(), []);
    const [reportYear, setReportYear] = useState(currentJy);
    const [reportMonth, setReportMonth] = useState(currentJm);
    const [reportEmployeeId, setReportEmployeeId] = useState<number | null>(null);
    const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
    const [monthlyLoading, setMonthlyLoading] = useState(false);
    const [monthlyError, setMonthlyError] = useState("");

    const [summaryMachineId, setSummaryMachineId] = useState<number | null>(null);
    const [summaryGroupBy, setSummaryGroupBy] = useState<number | null>(0);
    const [summaryDateFrom, setSummaryDateFrom] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 6);
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    });
    const [summaryDateTo, setSummaryDateTo] = useState(todayGregorian());
    const [summaryReport, setSummaryReport] = useState<MachineSummaryReport | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState("");

    const [machineMonthlyReport, setMachineMonthlyReport] = useState<MachineMonthlyReport | null>(null);
    const [machineMonthlyLoading, setMachineMonthlyLoading] = useState(false);
    const [machineMonthlyError, setMachineMonthlyError] = useState("");

    const fetchData = useCallback(async () => {
        try {
            const [mach, logsAll, emp] = await Promise.all([
                listAll<Machine>("/production/api/v1/machine/"),
                listAll<ProductionLog>("/production/api/v1/log/"),
                fetchAllEmployeesCached(),
            ]);
            setMachines(mach);
            setLogs(logsAll);
            setEmployees(emp);
        } catch (err) {
            setPageError(parseBackendError(err, "دریافت اطلاعات تولید با خطا مواجه شد"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const stats = useMemo(() => {
        let produced = 0;
        let waste = 0;
        let effSum = 0;
        let effCount = 0;

        logs.forEach((l) => {
            produced += Number(l.produced_qty || 0);
            waste += Number(l.waste_qty || 0);
            if (l.efficiency !== null && l.efficiency !== undefined) {
                effSum += Number(l.efficiency);
                effCount++;
            }
        });

        return {
            produced,
            waste,
            avgEfficiency: effCount > 0 ? effSum / effCount : 0,
        };
    }, [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter((l) => {
            if (filterEmployeeId !== null && l.employee !== filterEmployeeId) return false;
            if (filterMachineId !== null && l.machine !== filterMachineId) return false;
            if (filterDateFrom && l.date < filterDateFrom) return false;
            if (filterDateTo && l.date > filterDateTo) return false;
            return true;
        });
    }, [logs, filterEmployeeId, filterMachineId, filterDateFrom, filterDateTo]);

    const filteredMachines = useMemo(() => {
        if (machineStatusFilter === null) return machines;
        if (machineStatusFilter === 1) return machines.filter((m) => m.is_active);
        return machines.filter((m) => !m.is_active);
    }, [machines, machineStatusFilter]);

    const employeeOptions = useMemo<Option[]>(
        () =>
            employees.map((e) => ({
                id: e.id,
                label: e.full_name || e.username,
                sub: `@${e.username}`,
            })),
        [employees]
    );

    const machineOptions = useMemo<Option[]>(
        () =>
            machines.map((m) => ({
                id: m.id,
                label: m.name,
                sub: `کد: ${m.code}${m.is_active ? "" : " (غیرفعال)"}`,
            })),
        [machines]
    );

    const machineStatusOptions = useMemo<Option[]>(
        () => [
            { id: null as unknown as number, label: "همه وضعیت‌ها", sub: "" },
            { id: 1, label: "فعال", sub: "" },
            { id: 0, label: "غیرفعال", sub: "" },
        ],
        []
    );

    const monthOptions = useMemo<Option[]>(
        () => JALALI_MONTHS.map((name, idx) => ({ id: idx + 1, label: name, sub: "" })),
        []
    );

    const groupByOptions = useMemo<Option[]>(
        () => [
            { id: 0, label: "روزانه", sub: "" },
            { id: 1, label: "هفتگی", sub: "" },
            { id: 2, label: "ماهانه", sub: "" },
            { id: 3, label: "سالانه", sub: "" },
        ],
        []
    );

    async function handleToggleActive(m: Machine) {
        if (togglingId !== null) return;
        setTogglingId(m.id);
        setPageError("");
        try {
            await axiosInstance.patch(`/production/api/v1/machine/${m.id}/update/`, {
                is_active: !m.is_active,
            });
            setMachines((prev) =>
                prev.map((item) => (item.id === m.id ? { ...item, is_active: !m.is_active } : item))
            );
        } catch (err) {
            setPageError(parseBackendError(err, "خطا در تغییر وضعیت ماشین"));
        } finally {
            setTogglingId(null);
        }
    }

    async function handleDeleteMachine(m: Machine) {
        setPageError("");
        try {
            await axiosInstance.delete(`/production/api/v1/machine/${m.id}/delete/`);
            fetchData();
        } catch (err) {
            setPageError(
                parseBackendError(
                    err,
                    `حذف ماشین «${m.name}» ممکن نیست. اگر این ماشین سابقه تولید دارد، به‌جای حذف، آن را غیرفعال کنید.`
                )
            );
        }
    }

    async function loadMonthlyReport() {
        setMonthlyLoading(true);
        setMonthlyError("");
        try {
            const params: Record<string, string | number> = { year: reportYear, month: reportMonth };
            if (reportEmployeeId !== null) params.employee_id = reportEmployeeId;
            const res = await axiosInstance.get("/production/api/v1/report/monthly/", { params });
            setMonthlyReport(res.data as MonthlyReport);
        } catch (err) {
            setMonthlyError(parseBackendError(err, "دریافت گزارش ماهانه با خطا مواجه شد"));
            setMonthlyReport(null);
        } finally {
            setMonthlyLoading(false);
        }
    }

    async function loadSummaryReport() {
        setSummaryLoading(true);
        setSummaryError("");
        try {
            const groupByMap: Record<number, GroupBy> = { 0: "day", 1: "week", 2: "month", 3: "year" };
            const params: Record<string, string> = {
                date_from: summaryDateFrom,
                date_to: summaryDateTo,
                group_by: groupByMap[summaryGroupBy ?? 0],
            };
            if (summaryMachineId !== null) params.machine_id = String(summaryMachineId);
            const res = await axiosInstance.get("/production/api/v1/report/machine/summary/", { params });
            setSummaryReport(res.data as MachineSummaryReport);
        } catch (err) {
            setSummaryError(parseBackendError(err, "دریافت گزارش روند تولید با خطا مواجه شد"));
            setSummaryReport(null);
        } finally {
            setSummaryLoading(false);
        }
    }

    async function loadMachineMonthlyReport() {
        setMachineMonthlyLoading(true);
        setMachineMonthlyError("");
        try {
            const res = await axiosInstance.get("/production/api/v1/report/machine/monthly/", {
                params: { year: reportYear, month: reportMonth },
            });
            setMachineMonthlyReport(res.data as MachineMonthlyReport);
        } catch (err) {
            setMachineMonthlyError(parseBackendError(err, "دریافت گزارش ماهانه ماشین با خطا مواجه شد"));
            setMachineMonthlyReport(null);
        } finally {
            setMachineMonthlyLoading(false);
        }
    }

    useEffect(() => {
        if (activeTab === "monthly") loadMonthlyReport();
    }, [activeTab, reportYear, reportMonth, reportEmployeeId]);

    useEffect(() => {
        if (activeTab === "machineSummary") loadSummaryReport();
    }, [activeTab, summaryDateFrom, summaryDateTo, summaryGroupBy, summaryMachineId]);

    useEffect(() => {
        if (activeTab === "machineMonthly") loadMachineMonthlyReport();
    }, [activeTab, reportYear, reportMonth]);

    const tabs: { key: TabKey; label: string; icon: ReactNode }[] = [
        { key: "dashboard", label: "داشبورد", icon: <BarChart3 size={14} /> },
        { key: "machines", label: "ماشین‌آلات", icon: <Factory size={14} /> },
        { key: "logs", label: "سوابق تولید", icon: <ClipboardList size={14} /> },
        { key: "monthly", label: "عملکرد نیرو", icon: <Users size={14} /> },
        { key: "machineSummary", label: "عملکرد ماشین", icon: <CalendarCogIcon  size={14} /> },
        { key: "machineMonthly", label: " عملکرد ماهانه ماشین ", icon: <CalendarCogIcon size={14} /> },
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6" dir="rtl">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                        <Factory size={20} />
                    </div>
                    <div>
                        <h1 className="text-[16px] font-extrabold text-gray-900 dark:text-white">
                            مدیریت تولید و ماشین‌آلات
                        </h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-400">
                            آمار کلیدی، کنترل دستگاه‌ها و سوابق تولید
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowLogModal(true)}
                        className="flex h-11 items-center gap-2 rounded-full bg-emerald-600 px-5 text-[12.5px] font-bold text-white transition-colors hover:bg-emerald-500"
                    >
                        <ClipboardList size={15} />
                        ثبت عملکرد جدید
                    </motion.button>
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setMachineModal({ open: true, machine: null })}
                        className="flex h-11 items-center gap-2 rounded-full bg-blue-600 px-5 text-[12.5px] font-bold text-white transition-colors hover:bg-blue-500"
                    >
                        <Plus size={15} />
                        تعریف ماشین
                    </motion.button>
                </div>
            </div>

            <ErrorBanner message={pageError} onClose={() => setPageError("")} />

            <div className="flex flex-wrap gap-2 rounded-2xl border border-black/[0.06] bg-[#fafafa] p-2 dark:border-white/[0.06] dark:bg-white/[0.02]">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setActiveTab(t.key)}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-bold transition-all ${activeTab === t.key
                            ? "bg-white text-blue-600 shadow-sm dark:bg-white/[0.06] dark:text-blue-400"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            }`}
                    >
                        {t.icon}
                        {t.label}
                    </button>
                ))}
            </div>

            {activeTab === "dashboard" && (
                <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <StatCard
                            label="کل تولید واقعی"
                            value={toPersianDigits(stats.produced.toLocaleString())}
                            unit="عدد"
                            tone="emerald"
                            icon={<TrendingUp size={16} />}
                        />
                        <StatCard
                            label="میانگین راندمان"
                            value={`${toPersianDigits(stats.avgEfficiency.toFixed(1))}٪`}
                            tone="indigo"
                            icon={<BarChart3 size={16} />}
                        />
                        <StatCard
                            label="کل ضایعات ثبت‌شده"
                            value={toPersianDigits(stats.waste.toLocaleString())}
                            unit="عدد"
                            tone="red"
                            icon={<AlertTriangle size={16} />}
                        />
                    </div>

                    <section className="space-y-4">
                        <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                            <Factory size={15} className="text-indigo-500" />
                            ماشین‌آلات خط تولید ({toPersianDigits(machines.length)})
                        </h2>

                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 size={22} className="animate-spin text-indigo-500" />
                            </div>
                        ) : machines.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-[12px] text-gray-400 dark:border-white/[0.1]">
                                هنوز ماشینی تعریف نشده. با «تعریف ماشین» شروع کنید.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {machines.slice(0, 6).map((m, index) => (
                                    <motion.div
                                        key={m.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(index, 8) * 0.03 }}
                                        className="flex flex-col gap-3 rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 transition-shadow duration-200 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.35),0_14px_40px_rgba(99,102,241,0.25)] dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:shadow-[0_0_0_1px_rgba(129,140,248,0.45),0_14px_44px_rgba(99,102,241,0.35)]"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div
                                                    className={`flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-2xl bg-gradient-to-br text-[15px] font-extrabold text-white ${gradientOf(
                                                        m.id
                                                    )}`}
                                                >
                                                    {initialOf(m.name)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-[13.5px] font-extrabold leading-tight text-gray-800 dark:text-gray-100">
                                                        {m.name}
                                                    </p>
                                                    <p dir="ltr" className="mt-0.5 text-right font-mono text-[11px] text-gray-400 dark:text-gray-500">
                                                        {m.code}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setMachineModal({ open: true, machine: m })}
                                                aria-label="ویرایش ماشین"
                                                title="ویرایش"
                                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-black/[0.14] bg-[#e2e2e2] text-gray-700 transition-all hover:bg-blue-600 hover:text-white active:scale-95 dark:border-white/[0.13] dark:bg-[#1e1e1e] dark:text-gray-200 dark:hover:bg-blue-600"
                                            >
                                                <SquarePen size={15} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 border-t border-black/5 pt-3 dark:border-white/5">
                                            <div className="rounded-xl bg-black/[0.03] px-3 py-2 dark:bg-white/[0.03]">
                                                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                                    <Gauge size={11} />
                                                    تولید در ساعت
                                                </span>
                                                <span className="mt-0.5 block text-[13px] font-extrabold text-gray-800 dark:text-gray-100">
                                                    {toPersianDigits(m.std_production_per_hour)}
                                                </span>
                                            </div>
                                            <div className="rounded-xl bg-black/[0.03] px-3 py-2 dark:bg-white/[0.03]">
                                                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                                    <AlertTriangle size={11} />
                                                    ضایعات در ساعت
                                                </span>
                                                <span className="mt-0.5 block text-[13px] font-extrabold text-red-500">
                                                    {toPersianDigits(m.std_waste_per_hour)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`rounded-lg border px-2 py-0.5 text-[10.5px] font-bold ${m.is_active
                                                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                    : "border-slate-400/30 bg-slate-400/10 text-slate-500 dark:text-slate-400"
                                                    }`}
                                            >
                                                {m.is_active ? "فعال" : "غیرفعال"}
                                            </span>
                                            <StatusSwitch
                                                isActive={m.is_active}
                                                loading={togglingId === m.id}
                                                disabled={togglingId !== null && togglingId !== m.id}
                                                title={m.is_active ? "غیرفعال‌سازی ماشین" : "فعال‌سازی ماشین"}
                                                onToggle={() => handleToggleActive(m)}
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}

            {activeTab === "machines" && (
                <section className="space-y-4">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                            <Factory size={15} className="text-indigo-500" />
                            ماشین‌آلات ({toPersianDigits(filteredMachines.length)})
                        </h2>
                        <div className="w-48">
                            <NiceSelect
                                label="فیلتر وضعیت"
                                placeholder="همه وضعیت‌ها"
                                emptyText="گزینه‌ای یافت نشد"
                                options={machineStatusOptions}
                                value={machineStatusFilter}
                                onChange={setMachineStatusFilter}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 size={22} className="animate-spin text-indigo-500" />
                        </div>
                    ) : filteredMachines.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-[12px] text-gray-400 dark:border-white/[0.1]">
                            ماشینی با این فیلتر یافت نشد.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {filteredMachines.map((m, index) => (
                                <motion.div
                                    key={m.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(index, 8) * 0.03 }}
                                    className={`flex flex-col gap-3 rounded-2xl border p-4 transition-shadow duration-200 ${m.is_active
                                        ? "border-black/[0.06] bg-[#fafafa] hover:shadow-[0_0_0_1px_rgba(99,102,241,0.35),0_14px_40px_rgba(99,102,241,0.25)] dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:shadow-[0_0_0_1px_rgba(129,140,248,0.45),0_14px_44px_rgba(99,102,241,0.35)]"
                                        : "border-slate-300/40 bg-slate-50 opacity-75 dark:border-white/[0.08] dark:bg-white/[0.015]"
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div
                                                className={`flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-2xl bg-gradient-to-br text-[15px] font-extrabold text-white ${gradientOf(
                                                    m.id
                                                )}`}
                                            >
                                                {initialOf(m.name)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-[13.5px] font-extrabold leading-tight text-gray-800 dark:text-gray-100">
                                                    {m.name}
                                                </p>
                                                <p dir="ltr" className="mt-0.5 text-right font-mono text-[11px] text-gray-400 dark:text-gray-500">
                                                    {m.code}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setMachineModal({ open: true, machine: m })}
                                                aria-label="ویرایش ماشین"
                                                title="ویرایش"
                                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-black/[0.14] bg-[#e2e2e2] text-gray-700 transition-all hover:bg-blue-600 hover:text-white active:scale-95 dark:border-white/[0.13] dark:bg-[#1e1e1e] dark:text-gray-200 dark:hover:bg-blue-600"
                                            >
                                                <SquarePen size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (
                                                        confirm(
                                                            `ماشین «${m.name}» حذف شود؟\nاگر سابقه تولید داشته باشد، حذف ممکن نیست و باید غیرفعال شود.`
                                                        )
                                                    ) {
                                                        handleDeleteMachine(m);
                                                    }
                                                }}
                                                aria-label="حذف ماشین"
                                                title="حذف"
                                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-black/[0.14] bg-[#e2e2e2] text-gray-700 transition-all hover:bg-red-600 hover:text-white active:scale-95 dark:border-white/[0.13] dark:bg-[#1e1e1e] dark:text-gray-200 dark:hover:bg-red-600"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 border-t border-black/5 pt-3 dark:border-white/5">
                                        <div className="rounded-xl bg-black/[0.03] px-3 py-2 dark:bg-white/[0.03]">
                                            <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                                <Gauge size={11} />
                                                تولید در ساعت
                                            </span>
                                            <span className="mt-0.5 block text-[13px] font-extrabold text-gray-800 dark:text-gray-100">
                                                {toPersianDigits(m.std_production_per_hour)}
                                            </span>
                                        </div>
                                        <div className="rounded-xl bg-black/[0.03] px-3 py-2 dark:bg-white/[0.03]">
                                            <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                                <AlertTriangle size={11} />
                                                ضایعات در ساعت
                                            </span>
                                            <span className="mt-0.5 block text-[13px] font-extrabold text-red-500">
                                                {toPersianDigits(m.std_waste_per_hour)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`rounded-lg border px-2 py-0.5 text-[10.5px] font-bold ${m.is_active
                                                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                : "border-slate-400/30 bg-slate-400/10 text-slate-500 dark:text-slate-400"
                                                }`}
                                        >
                                            {m.is_active ? "فعال" : "غیرفعال"}
                                        </span>
                                        <StatusSwitch
                                            isActive={m.is_active}
                                            loading={togglingId === m.id}
                                            disabled={togglingId !== null && togglingId !== m.id}
                                            title={m.is_active ? "غیرفعال‌سازی ماشین" : "فعال‌سازی ماشین"}
                                            onToggle={() => handleToggleActive(m)}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {activeTab === "logs" && (
                <section className="space-y-4">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                            <ClipboardList size={15} className="text-emerald-500" />
                            سوابق تولید ({toPersianDigits(filteredLogs.length)} از {toPersianDigits(logs.length)})
                        </h2>
                    </div>

                    <div className="rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                        <div className="mb-3 flex items-center gap-2 text-[11.5px] font-bold text-gray-500">
                            <Filter size={13} />
                            فیلترها
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                            <NiceSelect
                                label="کارمند"
                                placeholder="همه کارمندان"
                                emptyText="کارمندی یافت نشد"
                                options={employeeOptions}
                                value={filterEmployeeId}
                                onChange={setFilterEmployeeId}
                            />
                            <NiceSelect
                                label="ماشین"
                                placeholder="همه ماشین‌ها"
                                emptyText="ماشینی یافت نشد"
                                options={machineOptions}
                                value={filterMachineId}
                                onChange={setFilterMachineId}
                            />
                            <JalaliDatePicker
                                label="از تاریخ"
                                value={filterDateFrom}
                                onChange={setFilterDateFrom}
                                placeholder="بدون محدودیت"
                            />
                            <JalaliDatePicker
                                label="تا تاریخ"
                                value={filterDateTo}
                                onChange={setFilterDateTo}
                                placeholder="بدون محدودیت"
                            />
                        </div>
                        {(filterEmployeeId !== null ||
                            filterMachineId !== null ||
                            filterDateFrom ||
                            filterDateTo) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFilterEmployeeId(null);
                                        setFilterMachineId(null);
                                        setFilterDateFrom("");
                                        setFilterDateTo("");
                                    }}
                                    className="mt-3 flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-[11px] font-bold text-gray-600 transition-colors hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.08]"
                                >
                                    <X size={12} />
                                    پاک‌کردن فیلترها
                                </button>
                            )}
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-[#fafafa] dark:border-white/[0.06] dark:bg-white/[0.02]">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-right text-[12px]">
                                <thead>
                                    <tr className="border-b border-black/5 text-[11px] text-gray-400 dark:border-white/5">
                                        {[
                                            "تاریخ",
                                            "پرسنل",
                                            "ماشین",
                                            "ساعت کار",
                                            "تولید",
                                            "انتظاری",
                                            "ضایعات",
                                            "انتظاری",
                                            "راندمان",
                                            "",
                                        ].map((h, i) => (
                                            <th key={i} className="whitespace-nowrap px-4 py-3 font-bold">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                    {filteredLogs.map((log) => {
                                        return (
                                            <tr
                                                key={log.id}
                                                className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                                            >
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                                        <CalendarDays size={12} className="shrink-0" />
                                                        {toPersianDigits(isoToJalaliString(log.date))}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 font-extrabold text-gray-800 dark:text-gray-100">
                                                    {log.employee_name}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">
                                                    {log.machine_name}{" "}
                                                    <span className="font-mono text-[10px] text-gray-400">
                                                        ({log.machine_code})
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">
                                                    {toPersianDigits(log.hours_worked)} ساعت
                                                    {toHHMM(log.start_time) && (
                                                        <div className="font-mono text-[10px] text-gray-400" dir="ltr">
                                                            {toPersianDigits(toHHMM(log.start_time))} → {toPersianDigits(toHHMM(log.end_time))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-black text-emerald-600 dark:text-emerald-400">
                                                    {toPersianDigits(log.produced_qty.toLocaleString())}
                                                </td>
                                                <td className="px-4 py-3 text-gray-400">
                                                    {toPersianDigits(Number(log.expected_production).toFixed(1))}
                                                </td>
                                                <td className="px-4 py-3 font-bold text-red-500">
                                                    {toPersianDigits(log.waste_qty)}
                                                </td>
                                                <td className="px-4 py-3 text-gray-400">
                                                    {toPersianDigits(Number(log.expected_waste).toFixed(1))}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <EfficiencyBadge value={log.efficiency} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setLogToView(log)}
                                                            aria-label="مشاهده توضیحات"
                                                            title="مشاهده توضیحات"
                                                            className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 transition-colors hover:bg-blue-500 hover:text-white"
                                                        >
                                                            <Eye size={13} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setLogToDelete(log)}
                                                            aria-label="حذف رکورد"
                                                            title="حذف"
                                                            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-500 transition-colors hover:bg-red-500 hover:text-white"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {!loading && filteredLogs.length === 0 && (
                                        <tr>
                                            <td colSpan={10} className="py-12 text-center text-[12px] text-gray-400">
                                                {logs.length === 0
                                                    ? "هنوز رکوردی ثبت نشده. با «ثبت لاگ جدید» اولین رکورد را اضافه کنید."
                                                    : "رکوردی با این فیلترها یافت نشد."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            )}

            {activeTab === "monthly" && (
                <section className="space-y-4">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                            <CalendarDays size={15} className="text-indigo-500" />
                            گزارش ماهانه تولید
                        </h2>
                    </div>

                    <div className="rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <Field label="سال (شمسی)">
                                <input
                                    type="number"
                                    dir="ltr"
                                    min="1300"
                                    max="1600"
                                    value={reportYear}
                                    onChange={(e) => setReportYear(parseInt(e.target.value, 10) || currentJy)}
                                    className={`${INPUT_CLS} text-left font-mono`}
                                />
                            </Field>
                            <NiceSelect
                                label="ماه (شمسی)"
                                placeholder="انتخاب ماه"
                                emptyText="ماهی یافت نشد"
                                options={monthOptions}
                                value={reportMonth}
                                onChange={(id) => id !== null && setReportMonth(id)}
                            />
                            <NiceSelect
                                label="کارمند (اختیاری)"
                                placeholder="همه کارمندان"
                                emptyText="کارمندی یافت نشد"
                                options={employeeOptions}
                                value={reportEmployeeId}
                                onChange={setReportEmployeeId}
                            />
                        </div>
                    </div>

                    {monthlyError && <ErrorBanner message={monthlyError} onClose={() => setMonthlyError("")} />}

                    {monthlyLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 size={22} className="animate-spin text-indigo-500" />
                        </div>
                    ) : monthlyReport ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                                <StatCard
                                    label="کل ساعت کار"
                                    value={toPersianDigits(monthlyReport.totals.hours)}
                                    unit="ساعت"
                                    tone="indigo"
                                    icon={<CalendarDays size={16} />}
                                />
                                <StatCard
                                    label="کل تولید"
                                    value={toPersianDigits(monthlyReport.totals.produced.toLocaleString())}
                                    unit="عدد"
                                    tone="emerald"
                                    icon={<TrendingUp size={16} />}
                                />
                                <StatCard
                                    label="تولید انتظاری"
                                    value={toPersianDigits(Number(monthlyReport.totals.expected_production).toFixed(0))}
                                    unit="عدد"
                                    tone="indigo"
                                    icon={<Gauge size={16} />}
                                />
                                <StatCard
                                    label="کل ضایعات"
                                    value={toPersianDigits(monthlyReport.totals.waste.toLocaleString())}
                                    unit="عدد"
                                    tone="red"
                                    icon={<AlertTriangle size={16} />}
                                />
                                <StatCard
                                    label="ضایعات انتظاری"
                                    value={toPersianDigits(Number(monthlyReport.totals.expected_waste).toFixed(0))}
                                    unit="عدد"
                                    tone="amber"
                                    icon={<AlertTriangle size={16} />}
                                />
                                <StatCard
                                    label="راندمان"
                                    value={
                                        monthlyReport.totals.efficiency === null
                                            ? "—"
                                            : `${toPersianDigits(monthlyReport.totals.efficiency.toFixed(1))}٪`
                                    }
                                    tone="emerald"
                                    icon={<BarChart3 size={16} />}
                                />
                            </div>

                            <ProductionBarChart
                                title="تولید واقعی در برابر انتظاری (نیرو)"
                                subtitle="گزارش ماهانه به تفکیک کارمند"
                                data={monthlyReport.employees.map((e) => ({
                                    name: e.employee_name,
                                    a: Number(e.produced),
                                    b: Number(e.expected_production),
                                }))}
                                seriesA={{ label: "تولید واقعی", color: "#3b82f6" }}
                                seriesB={{ label: "تولید انتظاری", color: "#8b5cf6" }}
                            />

                            {monthlyReport.employees.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-[12px] text-gray-400 dark:border-white/[0.1]">
                                    در این ماه هیچ رکوردی ثبت نشده است.
                                </div>
                            ) : (
                                monthlyReport.employees.map((emp) => (
                                    <div
                                        key={emp.employee_id}
                                        className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.06] dark:bg-white/[0.02]"
                                    >
                                        <div className="flex items-center justify-between border-b border-black/5 bg-gray-50 px-4 py-3 dark:border-white/5 dark:bg-white/[0.03]">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-[13px] font-extrabold text-white ${gradientOf(
                                                        emp.employee_id
                                                    )}`}
                                                >
                                                    {initialOf(emp.employee_name)}
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                                                        {emp.employee_name}
                                                    </p>
                                                    <p className="text-[10.5px] text-gray-400">
                                                        {toPersianDigits(emp.hours)} ساعت · راندمان{" "}
                                                        {emp.efficiency === null
                                                            ? "—"
                                                            : `${toPersianDigits(emp.efficiency.toFixed(1))}٪`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {emp.machines.map((mch) => (
                                            <div
                                                key={mch.machine_id}
                                                className="border-b border-black/5 p-4 last:border-b-0 dark:border-white/5"
                                            >
                                                <div className="mb-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Factory size={13} className="text-indigo-500" />
                                                        <span className="text-[12px] font-extrabold text-gray-800 dark:text-gray-100">
                                                            {mch.machine_name}
                                                        </span>
                                                        <span className="font-mono text-[10px] text-gray-400">
                                                            ({mch.machine_code})
                                                        </span>
                                                    </div>
                                                    <span className="text-[10.5px] font-bold text-gray-500">
                                                        {toPersianDigits(mch.hours)} ساعت · راندمان{" "}
                                                        {mch.efficiency === null
                                                            ? "—"
                                                            : `${toPersianDigits(mch.efficiency.toFixed(1))}٪`}
                                                    </span>
                                                </div>

                                                <div className="overflow-x-auto">
                                                    <table className="w-full border-collapse text-right text-[11.5px]">
                                                        <thead>
                                                            <tr className="border-b border-black/5 text-[10.5px] text-gray-400 dark:border-white/5">
                                                                {[
                                                                    "تاریخ",
                                                                    "ساعت",
                                                                    "تولید",
                                                                    "انتظاری",
                                                                    "ضایعات",
                                                                    "انتظاری",
                                                                    "راندمان",
                                                                    "توضیحات",
                                                                ].map((h, i) => (
                                                                    <th key={i} className="whitespace-nowrap px-2 py-2 font-bold">
                                                                        {h}
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                                            {mch.days.map((d) => (
                                                                <tr
                                                                    key={d.log_id}
                                                                    className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                                                                >
                                                                    <td className="whitespace-nowrap px-2 py-2 text-gray-500 dark:text-gray-400">
                                                                        {toPersianDigits(d.jalali_date)}
                                                                    </td>
                                                                    <td className="whitespace-nowrap px-2 py-2 text-gray-500">
                                                                        {toPersianDigits(d.hours)}
                                                                    </td>
                                                                    <td className="px-2 py-2 font-bold text-emerald-600 dark:text-emerald-400">
                                                                        {toPersianDigits(d.produced.toLocaleString())}
                                                                    </td>
                                                                    <td className="px-2 py-2 text-gray-400">
                                                                        {toPersianDigits(Number(d.expected_production).toFixed(0))}
                                                                    </td>
                                                                    <td className="px-2 py-2 font-bold text-red-500">
                                                                        {toPersianDigits(d.waste)}
                                                                    </td>
                                                                    <td className="px-2 py-2 text-gray-400">
                                                                        {toPersianDigits(Number(d.expected_waste).toFixed(0))}
                                                                    </td>
                                                                    <td className="px-2 py-2">
                                                                        <EfficiencyBadge value={d.efficiency} />
                                                                    </td>
                                                                    <td className="px-2 py-2 text-gray-400">
                                                                        {d.note || "—"}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                    ) : null}
                </section>
            )}

            {activeTab === "machineSummary" && (
                <section className="space-y-4">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                            <LineChart size={15} className="text-indigo-500" />
                            روند تولید ماشین
                        </h2>
                    </div>

                    <div className="rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                            <JalaliDatePicker
                                label="از تاریخ"
                                value={summaryDateFrom}
                                onChange={setSummaryDateFrom}
                                required
                            />
                            <JalaliDatePicker
                                label="تا تاریخ"
                                value={summaryDateTo}
                                onChange={setSummaryDateTo}
                                required
                            />
                            <NiceSelect
                                label="ماشین (اختیاری)"
                                placeholder="همه ماشین‌ها"
                                emptyText="ماشینی یافت نشد"
                                options={machineOptions}
                                value={summaryMachineId}
                                onChange={setSummaryMachineId}
                            />
                            <NiceSelect
                                label="گروه‌بندی"
                                placeholder="انتخاب گروه‌بندی"
                                emptyText="گزینه‌ای یافت نشد"
                                options={groupByOptions}
                                value={summaryGroupBy}
                                onChange={setSummaryGroupBy}
                            />
                        </div>
                    </div>

                    {summaryError && <ErrorBanner message={summaryError} onClose={() => setSummaryError("")} />}

                    {summaryLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 size={22} className="animate-spin text-indigo-500" />
                        </div>
                    ) : summaryReport ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                                <StatCard
                                    label="کل ساعت کار"
                                    value={toPersianDigits(summaryReport.totals.hours)}
                                    unit="ساعت"
                                    tone="indigo"
                                    icon={<CalendarDays size={16} />}
                                />
                                <StatCard
                                    label="کل تولید"
                                    value={toPersianDigits(summaryReport.totals.produced.toLocaleString())}
                                    unit="عدد"
                                    tone="emerald"
                                    icon={<TrendingUp size={16} />}
                                />
                                <StatCard
                                    label="تولید انتظاری"
                                    value={toPersianDigits(Number(summaryReport.totals.expected_production).toFixed(0))}
                                    unit="عدد"
                                    tone="indigo"
                                    icon={<Gauge size={16} />}
                                />
                                <StatCard
                                    label="کل ضایعات"
                                    value={toPersianDigits(summaryReport.totals.waste.toLocaleString())}
                                    unit="عدد"
                                    tone="red"
                                    icon={<AlertTriangle size={16} />}
                                />
                                <StatCard
                                    label="ضایعات انتظاری"
                                    value={toPersianDigits(Number(summaryReport.totals.expected_waste).toFixed(0))}
                                    unit="عدد"
                                    tone="amber"
                                    icon={<AlertTriangle size={16} />}
                                />
                                <StatCard
                                    label="راندمان"
                                    value={
                                        summaryReport.totals.efficiency === null
                                            ? "—"
                                            : `${toPersianDigits(summaryReport.totals.efficiency.toFixed(1))}٪`
                                    }
                                    tone="emerald"
                                    icon={<BarChart3 size={16} />}
                                />
                            </div>

                            <ProductionBarChart
                                tabs={[{ id: 0, label: "روز" }, { id: 1, label: "هفته" }, { id: 2, label: "ماه" }, { id: 3, label: "سال" }]}
                                activeTab={summaryGroupBy}
                                onTab={setSummaryGroupBy}
                                title="روند تولید واقعی و انتظاری"
                                subtitle="مجموع همه ماشین‌ها در هر دوره"
                                data={(() => {
                                    const map = new Map<string, { name: string; a: number; b: number }>();
                                    summaryReport.machines.forEach((m) =>
                                        m.periods.forEach((p) => {
                                            const cur = map.get(p.key) ?? { name: p.label, a: 0, b: 0 };
                                            cur.a += Number(p.produced);
                                            cur.b += Number(p.expected_production);
                                            map.set(p.key, cur);
                                        }),
                                    );
                                    return Array.from(map.values());
                                })()}
                                seriesA={{ label: "تولید واقعی", color: "#3b82f6" }}
                                seriesB={{ label: "تولید انتظاری", color: "#a66cff" }}
                            />

                            {summaryReport.machines.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-[12px] text-gray-400 dark:border-white/[0.1]">
                                    در این بازه هیچ رکوردی ثبت نشده است.
                                </div>
                            ) : (
                                summaryReport.machines.map((mch) => (
                                    <div
                                        key={mch.machine_id}
                                        className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.06] dark:bg-white/[0.02]"
                                    >
                                        <div className="flex items-center justify-between border-b border-black/5 bg-gray-50 px-4 py-3 dark:border-white/5 dark:bg-white/[0.03]">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-[13px] font-extrabold text-white ${gradientOf(
                                                        mch.machine_id
                                                    )}`}
                                                >
                                                    {initialOf(mch.machine_name)}
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                                                        {mch.machine_name}
                                                    </p>
                                                    <p className="font-mono text-[10.5px] text-gray-400">
                                                        {mch.machine_code}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[10.5px] font-bold text-gray-500">
                                                {toPersianDigits(mch.hours)} ساعت · راندمان{" "}
                                                {mch.efficiency === null
                                                    ? "—"
                                                    : `${toPersianDigits(mch.efficiency.toFixed(1))}٪`}
                                            </span>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse text-right text-[11.5px]">
                                                <thead>
                                                    <tr className="border-b border-black/5 text-[10.5px] text-gray-400 dark:border-white/5">
                                                        {[
                                                            "بازه",
                                                            "ساعت",
                                                            "تولید",
                                                            "انتظاری",
                                                            "ضایعات",
                                                            "انتظاری",
                                                            "راندمان",
                                                        ].map((h, i) => (
                                                            <th key={i} className="whitespace-nowrap px-3 py-2 font-bold">
                                                                {h}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                                    {mch.periods.map((p) => (
                                                        <tr
                                                            key={p.key}
                                                            className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                                                        >
                                                            <td className="whitespace-nowrap px-3 py-2 font-bold text-gray-700 dark:text-gray-200">
                                                                {toPersianDigits(p.label)}
                                                            </td>
                                                            <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                                                                {toPersianDigits(p.hours)}
                                                            </td>
                                                            <td className="px-3 py-2 font-bold text-emerald-600 dark:text-emerald-400">
                                                                {toPersianDigits(p.produced.toLocaleString())}
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-400">
                                                                {toPersianDigits(Number(p.expected_production).toFixed(0))}
                                                            </td>
                                                            <td className="px-3 py-2 font-bold text-red-500">
                                                                {toPersianDigits(p.waste)}
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-400">
                                                                {toPersianDigits(Number(p.expected_waste).toFixed(0))}
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <EfficiencyBadge value={p.efficiency} />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : null}
                </section>
            )}

            {activeTab === "machineMonthly" && (
                <section className="space-y-4">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                            <Users size={15} className="text-indigo-500" />
                            گزارش ماهانه ماشین‌ها
                        </h2>
                    </div>

                    <div className="rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <Field label="سال (شمسی)">
                                <input
                                    type="number"
                                    dir="ltr"
                                    min="1300"
                                    max="1600"
                                    value={reportYear}
                                    onChange={(e) => setReportYear(parseInt(e.target.value, 10) || currentJy)}
                                    className={`${INPUT_CLS} text-left font-mono`}
                                />
                            </Field>
                            <NiceSelect
                                label="ماه (شمسی)"
                                placeholder="انتخاب ماه"
                                emptyText="ماهی یافت نشد"
                                options={monthOptions}
                                value={reportMonth}
                                onChange={(id) => id !== null && setReportMonth(id)}
                            />
                        </div>
                    </div>

                    {machineMonthlyError && (
                        <ErrorBanner message={machineMonthlyError} onClose={() => setMachineMonthlyError("")} />
                    )}

                    {machineMonthlyLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 size={22} className="animate-spin text-indigo-500" />
                        </div>
                    ) : machineMonthlyReport ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                                <StatCard
                                    label="کل ساعت کار"
                                    value={toPersianDigits(machineMonthlyReport.totals.hours)}
                                    unit="ساعت"
                                    tone="indigo"
                                    icon={<CalendarDays size={16} />}
                                />
                                <StatCard
                                    label="کل تولید"
                                    value={toPersianDigits(machineMonthlyReport.totals.produced.toLocaleString())}
                                    unit="عدد"
                                    tone="emerald"
                                    icon={<TrendingUp size={16} />}
                                />
                                <StatCard
                                    label="تولید انتظاری"
                                    value={toPersianDigits(
                                        Number(machineMonthlyReport.totals.expected_production).toFixed(0)
                                    )}
                                    unit="عدد"
                                    tone="indigo"
                                    icon={<Gauge size={16} />}
                                />
                                <StatCard
                                    label="کل ضایعات"
                                    value={toPersianDigits(machineMonthlyReport.totals.waste.toLocaleString())}
                                    unit="عدد"
                                    tone="red"
                                    icon={<AlertTriangle size={16} />}
                                />
                                <StatCard
                                    label="ضایعات انتظاری"
                                    value={toPersianDigits(
                                        Number(machineMonthlyReport.totals.expected_waste).toFixed(0)
                                    )}
                                    unit="عدد"
                                    tone="amber"
                                    icon={<AlertTriangle size={16} />}
                                />
                                <StatCard
                                    label="راندمان"
                                    value={
                                        machineMonthlyReport.totals.efficiency === null
                                            ? "—"
                                            : `${toPersianDigits(machineMonthlyReport.totals.efficiency.toFixed(1))}٪`
                                    }
                                    tone="emerald"
                                    icon={<BarChart3 size={16} />}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                <ProductionBarChart
                                    title="تولید ماهانه ماشین‌ها"
                                    subtitle="واقعی در برابر انتظاری"
                                    data={machineMonthlyReport.machines.map((m) => ({
                                        name: m.machine_name,
                                        a: Number(m.produced),
                                        b: Number(m.expected_production),
                                    }))}
                                    seriesA={{ label: "تولید واقعی", color: "#3b82f6" }}
                                    seriesB={{ label: "تولید انتظاری", color: "#8b5cf6" }}
                                />
                                <ProductionBarChart
                                    title="انحراف از مقدار انتظاری"
                                    subtitle="تفاوت تولید و ضایعات با مقدار انتظاری (واقعی − انتظاری)"
                                    signed
                                    data={machineMonthlyReport.machines.map((m) => ({
                                        name: m.machine_name,
                                        a: Number((Number(m.produced) - Number(m.expected_production)).toFixed(1)),
                                        b: Number((Number(m.waste) - Number(m.expected_waste)).toFixed(1)),
                                    }))}
                                    seriesA={{ label: "انحراف تولید", color: "#3b82f6" }}
                                    seriesB={{ label: "انحراف ضایعات", color: "#8b5cf6" }}
                                />
                            </div>

                            {machineMonthlyReport.machines.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-[12px] text-gray-400 dark:border-white/[0.1]">
                                    ماشینی در این ماه ثبت نشده است.
                                </div>
                            ) : (
                                machineMonthlyReport.machines.map((mch) => (
                                    <div
                                        key={mch.machine_id}
                                        className={`overflow-hidden rounded-2xl border bg-white dark:bg-white/[0.02] ${mch.is_active
                                            ? "border-black/[0.06] dark:border-white/[0.06]"
                                            : "border-slate-300/40 opacity-75 dark:border-white/[0.08]"
                                            }`}
                                    >
                                        <div className="flex flex-col gap-2 border-b border-black/5 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/5 dark:bg-white/[0.03]">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-[13px] font-extrabold text-white ${gradientOf(
                                                        mch.machine_id
                                                    )}`}
                                                >
                                                    {initialOf(mch.machine_name)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                                                            {mch.machine_name}
                                                        </p>
                                                        <span
                                                            className={`rounded-md border px-1.5 py-0.5 text-[9.5px] font-bold ${mch.is_active
                                                                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                                : "border-slate-400/30 bg-slate-400/10 text-slate-500 dark:text-slate-400"
                                                                }`}
                                                        >
                                                            {mch.is_active ? "فعال" : "غیرفعال"}
                                                        </span>
                                                    </div>
                                                    <p className="font-mono text-[10.5px] text-gray-400">
                                                        {mch.machine_code} · {toPersianDigits(mch.days_worked)} روز کار
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[10.5px] font-bold text-gray-500">
                                                {toPersianDigits(mch.hours)} ساعت · راندمان{" "}
                                                {mch.efficiency === null
                                                    ? "—"
                                                    : `${toPersianDigits(mch.efficiency.toFixed(1))}٪`}
                                            </span>
                                        </div>

                                        {mch.operators.length === 0 ? (
                                            <div className="px-4 py-6 text-center text-[11.5px] text-gray-400">
                                                در این ماه اپراتوری روی این ماشین کار نکرده است.
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse text-right text-[11.5px]">
                                                    <thead>
                                                        <tr className="border-b border-black/5 text-[10.5px] text-gray-400 dark:border-white/5">
                                                            {[
                                                                "اپراتور",
                                                                "ساعت",
                                                                "تولید",
                                                                "انتظاری",
                                                                "ضایعات",
                                                                "انتظاری",
                                                                "راندمان",
                                                            ].map((h, i) => (
                                                                <th key={i} className="whitespace-nowrap px-3 py-2 font-bold">
                                                                    {h}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                                        {mch.operators.map((op) => (
                                                            <tr
                                                                key={op.employee_id}
                                                                className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                                                            >
                                                                <td className="whitespace-nowrap px-3 py-2 font-extrabold text-gray-800 dark:text-gray-100">
                                                                    {op.employee_name}
                                                                </td>
                                                                <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                                                                    {toPersianDigits(op.hours)}
                                                                </td>
                                                                <td className="px-3 py-2 font-bold text-emerald-600 dark:text-emerald-400">
                                                                    {toPersianDigits(op.produced.toLocaleString())}
                                                                </td>
                                                                <td className="px-3 py-2 text-gray-400">
                                                                    {toPersianDigits(Number(op.expected_production).toFixed(0))}
                                                                </td>
                                                                <td className="px-3 py-2 font-bold text-red-500">
                                                                    {toPersianDigits(op.waste)}
                                                                </td>
                                                                <td className="px-3 py-2 text-gray-400">
                                                                    {toPersianDigits(Number(op.expected_waste).toFixed(0))}
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    <EfficiencyBadge value={op.efficiency} />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    ) : null}
                </section>
            )}

            <AnimatePresence>
                {machineModal.open && (
                    <MachineModal
                        key={machineModal.machine?.id ?? "new"}
                        machine={machineModal.machine}
                        onClose={() => setMachineModal({ open: false, machine: null })}
                        onSaved={() => {
                            setMachineModal({ open: false, machine: null });
                            fetchData();
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showLogModal && (
                    <LogModal
                        key="log-modal"
                        machines={machines}
                        onClose={() => setShowLogModal(false)}
                        onSaved={() => {
                            setShowLogModal(false);
                            fetchData();
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {logToDelete && (
                    <ConfirmDeleteLog
                        key="delete-log"
                        log={logToDelete}
                        onClose={() => setLogToDelete(null)}
                        onDeleted={() => {
                            setLogToDelete(null);
                            fetchData();
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {logToView && (
                    <ViewNoteModal
                        key="view-log-note"
                        log={logToView}
                        onClose={() => setLogToView(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}