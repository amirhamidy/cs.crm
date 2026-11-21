"use client";
import { STAT_HINTS } from "./glossary";

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
import { listAll } from "@/lib/api";
import { isValidTimeRange, formatHoursWorked, toHHMM } from "@/lib/productionTime";
import { formatProductionPercent, formatProductionLogHours, formatProductionInteger } from "@/lib/productionFormat";
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

export interface Machine {
    id: number;
    name: string;
    code: string;
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
    product?: number | null;
    product_name?: string | null;
    product_code?: string | null;
    waste_cause?: number | null;
    waste_cause_name?: string | null;
    breakdown_cause?: number | null;
    breakdown_cause_name?: string | null;
    downtime_minutes?: number;
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

export interface Product {
    id: number;
    name: string;
    code: string;
    std_production_per_hour: string;
    std_waste_per_hour: string;
    unit_price?: string | null;
    is_active: boolean;
}

export type CauseKind = "waste" | "breakdown";

export interface Cause {
    id: number;
    kind: CauseKind;
    kind_display?: string;
    name: string;
    description: string;
    is_active: boolean;
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

export interface MonthlyReportDay {
    log_id: number;
    date: string;
    jalali_date: string;
    hours: string;
    start_time?: string | null;
    end_time?: string | null;
    produced: number;
    waste: number;
    expected_production: string;
    expected_waste: string;
    efficiency: number | null;
    note: string;
    product_name?: string | null;
    waste_cause_name?: string | null;
    breakdown_cause_name?: string | null;
    downtime_minutes?: number | null;
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

export interface MachineMonthlyProduct {
    product_id: number | null;
    product_name: string | null;
    product_code: string | null;
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
    products: MachineMonthlyProduct[];
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
        const FIELD_FA: Record<string, string> = {
            date: "تاریخ", employee: "پرسنل", machine: "ماشین", start_time: "ساعت شروع",
            end_time: "ساعت پایان", hours_worked: "ساعت کار", produced_qty: "تعداد تولید",
            waste_qty: "ضایعات", note: "توضیحات",
        };
        const [k, first] = Object.entries(data as Record<string, unknown>)[0] ?? [];
        const msg = Array.isArray(first) ? String(first[0]) : typeof first === "string" ? first : "";
        if (msg) return k && FIELD_FA[k] ? `${FIELD_FA[k]}: ${msg}` : msg;
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

export function normalizeIsoDate(v: string): string {
    const [y, m, d] = (v || "").slice(0, 10).split("-").map(Number);
    if (!y || !m || !d) return v;
    return `${y}-${pad2(m)}-${pad2(d)}`;
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

export type PeriodUnit = "day" | "week" | "month" | "year";

/** Snap a Gregorian ISO date to the start/end of its Jalali day/week/month/year. */
export function alignToPeriod(iso: string, unit: PeriodUnit, edge: "start" | "end"): string {
    if (!iso || unit === "day") return iso;
    const [gy, gm, gd] = iso.split("-").map(Number);
    if (!gy || !gm || !gd) return iso;
    let [jy, jm, jd] = toJalali(gy, gm, gd);
    if (unit === "year") {
        jm = edge === "start" ? 1 : 12;
        jd = edge === "start" ? 1 : jalaliMonthLength(jy, 12);
    } else if (unit === "month") {
        jd = edge === "start" ? 1 : jalaliMonthLength(jy, jm);
    } else {
        const wd = jalaliWeekday(jy, jm, jd); // Saturday = 0
        const [y2, m2, d2] = toGregorian(jy, jm, jd);
        const dt = new Date(y2, m2 - 1, d2);
        dt.setDate(dt.getDate() + (edge === "start" ? -wd : 6 - wd));
        return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    }
    const [y, m, d] = toGregorian(jy, jm, jd);
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Start/end (Gregorian ISO) of the current Jalali month. */
export function currentMonthRange(): { from: string; to: string } {
    const n = new Date();
    const iso = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
    return { from: alignToPeriod(iso, "month", "start"), to: alignToPeriod(iso, "month", "end") };
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
    min,
    max,
}: {
    label: string;
    value: string;
    onChange: (iso: string) => void;
    placeholder?: string;
    required?: boolean;
    min?: string;
    max?: string;
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
            const hint = min || max;
            const hp = hint ? hint.split("-").map(Number) : [];
            if (hp[0] && hp[1] && hp[2]) {
                const [jy, jm] = toJalali(hp[0], hp[1], hp[2]);
                setViewJy(jy);
                setViewJm(jm);
            } else {
                const { jy, jm } = currentJalaliYearMonth();
                setViewJy(jy);
                setViewJm(jm);
            }
        }
    }, [open, value, min, max]);

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
        const t0 = todayGregorian();
        if ((min && t0 < min) || (max && t0 > max)) return;
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

                                    const dayIso = day !== null ? jalaliToIso(viewJy, viewJm, day) : "";
                                    const outOfRange = day !== null && ((!!min && dayIso < min) || (!!max && dayIso > max));

                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            disabled={day === null || outOfRange}
                                            onClick={() => day && handleSelectDay(day)}
                                            className={`aspect-square rounded-lg text-[11.5px] font-bold transition-colors ${day === null
                                                ? "invisible"
                                                : outOfRange
                                                    ? "cursor-not-allowed text-gray-300 line-through dark:text-white/15"
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
    displayValue,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    step?: string;
    min?: string;
    max?: string;
    displayValue?: string;
}) {
    return (
        <Field label={label}>
            <input
                type="number"
                inputMode="numeric"
                dir="ltr"
                step={step ?? "1"}
                min={min}
                max={max}
                value={displayValue ?? value}
                onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
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
                onClick={() => { if (!loading && options.length === 0) return; setOpen((v) => !v); }}
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

export function ModalShell({
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

export function MachineModal({
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
    const [isActive, setIsActive] = useState(machine?.is_active ?? true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const canSubmit = name.trim() !== "" && code.trim() !== "" && !saving;

    async function handleSave() {
        if (!canSubmit) return;
        setSaving(true);
        setError("");

        const payload = {
            name: name.trim(),
            code: code.trim(),
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
            subtitle="مشخصات ماشین (استاندارد تولید و ضایعات روی محصول تعریف می‌شود)"
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

export function LogModal({
    machines,
    log = null,
    onClose,
    onSaved,
}: {
    machines: Machine[];
    log?: ProductionLog | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [employees, setEmployees] = useState<EmployeeItem[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);

    const [date, setDate] = useState(() => (log ? log.date.slice(0, 10) : todayGregorian()));
    const [employeeId, setEmployeeId] = useState<number | null>(log?.employee ?? null);
    const [machineId, setMachineId] = useState<number | null>(log?.machine ?? null);
    const [products, setProducts] = useState<Product[]>([]);
    const [causes, setCauses] = useState<Cause[]>([]);
    const [productId, setProductId] = useState<number | null>(log?.product ?? null);
    const [wasteCauseId, setWasteCauseId] = useState<number | null>(log?.waste_cause ?? null);
    const [breakdownCauseId, setBreakdownCauseId] = useState<number | null>(log?.breakdown_cause ?? null);
    const [downtime, setDowntime] = useState(String(log?.downtime_minutes ?? 0));
    const [startTime, setStartTime] = useState(toHHMM(log?.start_time) || "");
    const [endTime, setEndTime] = useState(toHHMM(log?.end_time) || "");
    const [produced, setProduced] = useState(log ? String(log.produced_qty) : "");
    const [waste, setWaste] = useState(log ? String(log.waste_qty) : "0");
    const [note, setNote] = useState(log?.note ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        listAll<Product>("/production/api/v1/product/", log ? undefined : { is_active: true })
            .then((all) => setProducts(all.filter((p) => p.is_active || p.id === log?.product)))
            .catch(() => setError("دریافت لیست محصولات انجام نشد"));
        listAll<Cause>("/production/api/v1/cause/", log ? undefined : { is_active: true })
            .then((all) => setCauses(all.filter((c) => c.is_active || c.id === log?.waste_cause || c.id === log?.breakdown_cause)))
            .catch(() => setError("دریافت لیست علت‌ها انجام نشد"));
    }, []);

    const productOptions = useMemo<Option[]>(
        () => products.map((p) => ({ id: p.id, label: p.name, sub: `کد: ${p.code} · استاندارد: ${formatProductionInteger(p.std_production_per_hour)} تولید / ${formatProductionInteger(p.std_waste_per_hour)} ضایعات در ساعت` })),
        [products]
    );
    const wasteCauseOptions = useMemo<Option[]>(
        () => [
            { id: null as unknown as number, label: "بدون علت ضایعات", sub: "" },
            ...causes
                .filter((c) => c.kind === "waste")
                .map((c) => ({ id: c.id, label: c.name, sub: c.description || "" })),
        ],
        [causes]
    );
    const breakdownCauseOptions = useMemo<Option[]>(
        () => [
            { id: null as unknown as number, label: "بدون علت خرابی", sub: "" },
            ...causes
                .filter((c) => c.kind === "breakdown")
                .map((c) => ({ id: c.id, label: c.name, sub: c.description || "" })),
        ],
        [causes]
    );

    useEffect(() => {
        let alive = true;
        listAll<EmployeeItem>("/accounts/api/v1/employee/list/")
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
                .filter((m) => m.is_active || m.id === log?.machine)
                .map((m) => ({ id: m.id, label: m.name, sub: `کد: ${m.code}` })),
        [machines]
    );

    const validTimeRange = isValidTimeRange(startTime, endTime);

    const canSubmit =
        employeeId !== null &&
        machineId !== null &&
        productId !== null &&
        produced !== "" &&
        validTimeRange &&
        startTime !== "" &&
        endTime !== "" &&
        date !== "" &&
        !saving;

    async function handleSave() {
        if (!canSubmit) return;

        setSaving(true);
        setError("");

        try {
            const payload = {
                date: normalizeIsoDate(date),
                employee: employeeId,
                machine: machineId,
                product: productId,
                waste_cause: wasteCauseId,
                breakdown_cause: breakdownCauseId,
                downtime_minutes: Number(downtime || 0),
                start_time: startTime,
                end_time: endTime,
                produced_qty: Number(produced),
                waste_qty: Number(waste || 0),
                note: note.trim(),
            };
            if (log) await axiosInstance.patch(`/production/api/v1/log/${log.id}/update/`, payload);
            else await axiosInstance.post("/production/api/v1/log/create/", payload);
            onSaved();
        } catch (err) {
            setError(
                parseBackendError(
                    err,
                    "خطا در ثبت لاگ. احتمالاً برای این تاریخ و ماشین، رکوردی از این کارمند برای همین محصول ثبت شده است."
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
            title={log ? "ویرایش رکورد تولید" : "ثبت لاگ تولید"}
            subtitle={log ? "اصلاح اطلاعات ثبت‌شده" : "ثبت رکورد تولید روزانه"}
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
                                {log ? "ذخیره تغییرات" : "ثبت نهایی"}
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

            <NiceSelect
                label="محصول"
                placeholder="انتخاب محصول"
                emptyText="محصول فعالی وجود ندارد"
                options={productOptions}
                value={productId}
                onChange={(id) => {
                    setProductId(id);
                    setError("");
                }}
            />

            <div className="grid grid-cols-2 gap-3">
                <NiceSelect
                    label="علت ضایعات (اختیاری)"
                    placeholder="بدون علت ضایعات"
                    emptyText="علت ضایعاتی یافت نشد"
                    options={wasteCauseOptions}
                    value={wasteCauseId}
                    onChange={setWasteCauseId}
                />
                <NiceSelect
                    label="علت خرابی ماشین (اختیاری)"
                    placeholder="بدون علت خرابی"
                    emptyText="علت خرابی یافت نشد"
                    options={breakdownCauseOptions}
                    value={breakdownCauseId}
                    onChange={setBreakdownCauseId}
                />
            </div>

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
            {validTimeRange && (
                <p className="text-[11.5px] font-bold text-indigo-500">
                    مدت کار: {toPersianDigits(formatHoursWorked(startTime, endTime))}
                </p>
            )}

            <div className="grid grid-cols-2 gap-3">
                <NumberField label="تعداد تولید شده" value={produced} onChange={setProduced} min="0" />
                <NumberField label="مقدار ضایعات" value={waste} onChange={setWaste} min="0" />
                <NumberField label="مدت خرابی/توقف (دقیقه)" value={downtime} onChange={setDowntime} min="0" />
            </div>

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

export function ConfirmDeleteLog({
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

export function ViewNoteModal({
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
                    <span className="text-gray-500">محصول:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                        {log.product_name ? `${log.product_name} (${log.product_code})` : "—"}
                    </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                    <span className="text-gray-500">علت:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                        ضایعات: {log.waste_cause_name || "—"} · خرابی: {log.breakdown_cause_name || "—"}
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
                        {formatProductionLogHours(log.hours_worked, log.start_time, log.end_time)}
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
            {STAT_HINTS[label] && (
                <p className="-mt-3 text-[10px] leading-4 text-gray-400 dark:text-gray-500">({STAT_HINTS[label]})</p>
            )}
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
            {formatProductionPercent(value)}٪
        </span>
    );
}



export function CatalogModal({
    kind,
    item,
    onClose,
    onSaved,
}: {
    kind: "product" | "cause";
    item: Product | Cause | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const isProduct = kind === "product";
    const [name, setName] = useState(item?.name ?? "");
    const [code, setCode] = useState((item as Product | null)?.code ?? "");
    const [description, setDescription] = useState((item as Cause | null)?.description ?? "");
    const [stdProd, setStdProd] = useState((item as Product | null)?.std_production_per_hour ?? "");
    const [stdWaste, setStdWaste] = useState((item as Product | null)?.std_waste_per_hour ?? "0");
    const [unitPrice, setUnitPrice] = useState(String(Number((item as Product | null)?.unit_price ?? 0) || ""));
    const [causeKind, setCauseKind] = useState<CauseKind>((item as Cause | null)?.kind ?? "waste");
    const [isActive, setIsActive] = useState(item?.is_active ?? true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const canSubmit = name.trim() !== "" && (!isProduct || (code.trim() !== "" && stdProd !== "")) && !saving;

    async function handleSave() {
        if (!canSubmit) return;
        setSaving(true);
        setError("");
        const payload = isProduct
            ? { name: name.trim(), code: code.trim(), std_production_per_hour: stdProd, std_waste_per_hour: stdWaste || "0", unit_price: unitPrice === "" ? "0" : unitPrice, is_active: isActive }
            : { kind: causeKind, name: name.trim(), description: description.trim(), is_active: isActive };
        try {
            if (item) {
                await axiosInstance.patch(`/production/api/v1/${kind}/${item.id}/update/`, payload);
            } else {
                await axiosInstance.post(`/production/api/v1/${kind}/create/`, payload);
            }
            onSaved();
        } catch (err) {
            setError(parseBackendError(err, isProduct ? "خطا در ذخیره محصول. احتمالاً کد تکراری است." : "خطا در ذخیره علت. احتمالاً نام تکراری است."));
        } finally {
            setSaving(false);
        }
    }

    return (
        <ModalShell
            icon={<Factory size={15} className="text-blue-500" />}
            title={item ? (isProduct ? "ویرایش محصول" : "ویرایش علت") : isProduct ? "تعریف محصول جدید" : "تعریف علت جدید"}
            subtitle={isProduct ? "محصول و استانداردهای تولید و ضایعات آن" : "دلایل ضایعات بیشتر از استاندارد"}
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
                        {saving ? <Loader2 size={15} className="animate-spin" /> : (<><Check size={14} strokeWidth={3} />ذخیره اطلاعات</>)}
                    </motion.button>
                    <button type="button" onClick={onClose} disabled={saving} className={`h-11 px-6 ${SOFT_BUTTON}`}>
                        انصراف
                    </button>
                </>
            }
        >
            <ErrorBanner message={error} onClose={() => setError("")} />
            <FloatingInput id={`${kind}_name`} label={isProduct ? "نام محصول" : "عنوان علت"} value={name} onChange={setName} />
            {isProduct ? (
                <>
                    <FloatingInput id="product_code" label="کد یکتا (مثلاً P-01)" value={code} onChange={setCode} ltr />
                    <div className="grid grid-cols-2 gap-3">
                        <NumberField
                            label="تولید استاندارد در ساعت"
                            value={stdProd}
                            displayValue={Number.isFinite(Number(stdProd)) && stdProd !== "" ? String(Math.round(Number(stdProd))) : ""}
                            onChange={setStdProd}
                            step="1"
                            min="0"
                        />
                        <NumberField
                            label="ضایعات استاندارد در ساعت"
                            value={stdWaste}
                            displayValue={Number.isFinite(Number(stdWaste)) && stdWaste !== "" ? String(Math.round(Number(stdWaste))) : ""}
                            onChange={setStdWaste}
                            step="1"
                            min="0"
                        />
                    </div>
                    <NumberField
                        label="قیمت واحد (اختیاری)"
                        value={unitPrice}
                        displayValue={unitPrice !== "" && Number.isFinite(Number(unitPrice)) ? String(Number(unitPrice)) : ""}
                        onChange={setUnitPrice}
                        step="0.01"
                        min="0"
                    />
                </>
            ) : (
                <>
                    <NiceSelect
                        label="نوع علت"
                        placeholder="نوع علت"
                        emptyText=""
                        options={[
                            { id: "waste" as unknown as number, label: "علت ضایعات", sub: "در ثبت تولید به‌عنوان علت ضایعات انتخاب می‌شود" },
                            { id: "breakdown" as unknown as number, label: "علت خرابی ماشین", sub: "در ثبت تولید به‌عنوان علت خرابی انتخاب می‌شود" },
                        ]}
                        value={causeKind as unknown as number}
                        onChange={(v) => setCauseKind(v as unknown as CauseKind)}
                    />
                    <FloatingInput id="cause_desc" label="توضیحات (اختیاری)" value={description} onChange={setDescription} />
                </>
            )}
            <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div>
                    <p className="text-[12.5px] font-bold text-gray-800 dark:text-gray-100">وضعیت</p>
                    <p className="mt-0.5 text-[10.5px] text-gray-400">
                        {isActive ? "فعال است و در فرم ثبت لاگ نمایش داده می‌شود" : "غیرفعال است"}
                    </p>
                </div>
                <StatusSwitch isActive={isActive} onToggle={() => setIsActive((v) => !v)} />
            </div>
        </ModalShell>
    );
}
