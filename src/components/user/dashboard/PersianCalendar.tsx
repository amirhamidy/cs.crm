// PersianCalendar.tsx
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, CalendarDays, X } from "lucide-react";

export interface CalendarNote {
    id: string;
    title: string;
    body: string;
    time?: string;
    color: "sky" | "violet" | "emerald" | "amber" | "rose";
    createdAt: string;
}

interface PersianCalendarProps {
    onDayClick: (year: number, month: number, day: number) => void;
    notes?: Record<string, CalendarNote[]>;
}

const MONTHS = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];
const WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

function toJalali(gy: number, gm: number, gd: number): [number, number, number] {
    const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const jDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
    const isGregorianLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const isJalaliLeap = (y: number) => {
        const cycle = y % 33;
        return cycle === 1 || cycle === 5 || cycle === 9 || cycle === 13 || cycle === 17 || cycle === 22 || cycle === 26 || cycle === 30;
    };

    let gregorianDayOfYear = gd;
    for (let i = 0; i < gm - 1; i++) {
        gregorianDayOfYear += gDaysInMonth[i];
        if (i === 1 && isGregorianLeap(gy)) gregorianDayOfYear++;
    }

    let jalaliYear = gy - 621;
    if (gm <= 3) {
        const prevGregorianLeap = isGregorianLeap(gy - 1);
        const prevMarchDayCount = prevGregorianLeap ? 366 : 365;
        const gapToNowruz = gm === 1 ? gd : gm === 2 ? gd + 31 : gd + 31 + (isGregorianLeap(gy) ? 29 : 28);
        const daysSinceLastNowruz = prevMarchDayCount - gapToNowruz + 1;
        jalaliYear--;
        let remaining = daysSinceLastNowruz;
        let month = 0;
        while (month < 12) {
            const daysInThisMonth = month === 11 ? (isJalaliLeap(jalaliYear) ? 30 : 29) : jDaysInMonth[month];
            if (remaining <= daysInThisMonth) break;
            remaining -= daysInThisMonth;
            month++;
        }
        return [jalaliYear, month + 1, remaining];
    }

    const gapToNowruz = gregorianDayOfYear - (gm === 3 && gd < 21 ? gd : isGregorianLeap(gy) ? 80 : 79);
    if (gapToNowruz < 0) {
        jalaliYear--;
        const prevJalaliLeap = isJalaliLeap(jalaliYear);
        let remaining = (prevJalaliLeap ? 366 : 365) + gapToNowruz;
        let month = 0;
        while (month < 12) {
            const daysInThisMonth = month === 11 ? (prevJalaliLeap ? 30 : 29) : jDaysInMonth[month];
            if (remaining <= daysInThisMonth) break;
            remaining -= daysInThisMonth;
            month++;
        }
        return [jalaliYear, month + 1, remaining];
    }

    let remaining = gapToNowruz;
    let month = 0;
    while (month < 12) {
        const daysInThisMonth = month === 11 ? (isJalaliLeap(jalaliYear) ? 30 : 29) : jDaysInMonth[month];
        if (remaining <= daysInThisMonth) break;
        remaining -= daysInThisMonth;
        month++;
    }
    return [jalaliYear, month + 1, remaining];
}

function toGregorian(jy: number, jm: number, jd: number): [number, number, number] {
    const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const jDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
    const isGregorianLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const isJalaliLeap = (y: number) => {
        const cycle = y % 33;
        return cycle === 1 || cycle === 5 || cycle === 9 || cycle === 13 || cycle === 17 || cycle === 22 || cycle === 26 || cycle === 30;
    };

    let totalJalaliDays = jd;
    for (let i = 0; i < jm - 1; i++) totalJalaliDays += jDaysInMonth[i];
    if (jm > 12 && isJalaliLeap(jy)) totalJalaliDays++;

    let gregorianYear = jy + 621;
    let nowruzGregorianDays = 0;
    for (let y = 622; y < gregorianYear; y++) {
        nowruzGregorianDays += isGregorianLeap(y) ? 366 : 365;
    }

    if (isGregorianLeap(gregorianYear - 1) && isGregorianLeap(gregorianYear)) {
        nowruzGregorianDays += isGregorianLeap(gregorianYear - 1) ? 366 : 365;
        nowruzGregorianDays += 80;
    } else {
        nowruzGregorianDays += (isGregorianLeap(gregorianYear - 1) ? 366 : 365) + 79;
    }

    let remainingGregorianDays = nowruzGregorianDays + totalJalaliDays - 1;
    let gYear = 1;
    while (true) {
        const daysInYear = isGregorianLeap(gYear) ? 366 : 365;
        if (remainingGregorianDays < daysInYear) break;
        remainingGregorianDays -= daysInYear;
        gYear++;
    }

    let gMonth = 1;
    for (let i = 0; i < 12; i++) {
        let daysInMonth = gDaysInMonth[i];
        if (i === 1 && isGregorianLeap(gYear)) daysInMonth = 29;
        if (remainingGregorianDays < daysInMonth) { gMonth = i + 1; break; }
        remainingGregorianDays -= daysInMonth;
    }

    return [gYear, gMonth, remainingGregorianDays + 1];
}

function firstWeekday(jy: number, jm: number): number {
    const [gy, gm, gd] = toGregorian(jy, jm, 1);
    const d = new Date(gy, gm - 1, gd).getDay();
    return d === 6 ? 0 : d + 1;
}

function isLeap(jy: number) {
    const cycle = jy % 33;
    return cycle === 1 || cycle === 5 || cycle === 9 || cycle === 13 || cycle === 17 || cycle === 22 || cycle === 26 || cycle === 30;
}
function daysInMonth(jm: number, jy: number) {
    return jm <= 6 ? 31 : jm <= 11 ? 30 : isLeap(jy) ? 30 : 29;
}
function todayJalali(): [number, number, number] {
    const n = new Date();
    return toJalali(n.getFullYear(), n.getMonth() + 1, n.getDate());
}
function p(n: number | string) {
    return String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]);
}

const ease = [0.25, 0, 0, 1] as const;

const WEEKDAY_NAMES = ["شنبه", "یک‌شنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];

function getWeekdayName(jy: number, jm: number, jd: number): string {
    const [gy, gm, gd] = toGregorian(jy, jm, jd);
    const dow = new Date(gy, gm - 1, gd).getDay();
    const jalaliDow = dow === 6 ? 0 : dow + 1;
    return WEEKDAY_NAMES[jalaliDow];
}

interface DatePickerModalProps {
    currentYear: number;
    currentMonth: number;
    todayYear: number;
    onSelect: (year: number, month: number) => void;
    onClose: () => void;
}

function DatePickerModal({ currentYear, currentMonth, todayYear, onSelect, onClose }: DatePickerModalProps) {
    const [draftYear, setDraftYear] = useState(currentYear);
    const [draftMonth, setDraftMonth] = useState(currentMonth);
    const yearListRef = useRef<HTMLDivElement>(null);
    const years = Array.from({ length: 20 }, (_, i) => todayYear - 5 + i);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    useEffect(() => {
        if (!yearListRef.current) return;
        const idx = years.indexOf(draftYear);
        if (idx === -1) return;
        const item = yearListRef.current.children[idx] as HTMLElement;
        if (item) {
            item.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    }, []);

    function handleConfirm() {
        onSelect(draftYear, draftMonth);
        onClose();
    }

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
            >
                <motion.div
                    className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    className="relative w-full max-w-[340px] rounded-2xl bg-white dark:bg-[#111118] border border-gray-100 dark:border-white/[0.07] shadow-2xl shadow-black/20 dark:shadow-black/60 overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ duration: 0.22, ease }}
                >
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-white/[0.06]">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                <CalendarDays className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                            </div>
                            <span className="text-sm font-semibold text-gray-800 dark:text-white">
                                انتخاب ماه و سال
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-4 space-y-4">
                        <div>
                            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-2 tracking-wide">
                                ماه
                            </p>
                            <div className="grid grid-cols-4 gap-1.5">
                                {MONTHS.map((m, i) => {
                                    const isSelected = draftMonth === i + 1;
                                    const isCurrentMonth = currentMonth === i + 1 && draftYear === currentYear;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setDraftMonth(i + 1)}
                                            className={`
                                                py-2 rounded-xl text-xs font-medium transition-all duration-150
                                                ${isSelected
                                                    ? "bg-indigo-500 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-500/20"
                                                    : isCurrentMonth
                                                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
                                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                                                }
                                            `}
                                        >
                                            {m}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 dark:bg-white/[0.05]" />

                        <div>
                            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-2 tracking-wide">
                                سال
                            </p>
                            <div
                                ref={yearListRef}
                                className="grid grid-cols-4 gap-1.5 max-h-[108px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10"
                            >
                                {years.map(y => {
                                    const isSelected = draftYear === y;
                                    const isCurrentYear = currentYear === y;
                                    return (
                                        <button
                                            key={y}
                                            onClick={() => setDraftYear(y)}
                                            className={`
                                                py-2 rounded-xl text-xs font-medium transition-all duration-150
                                                ${isSelected
                                                    ? "bg-indigo-500 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-500/20"
                                                    : isCurrentYear && !isSelected
                                                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
                                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                                                }
                                            `}
                                        >
                                            {p(y)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="px-4 pb-4 flex gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 h-9 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                        >
                            انصراف
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-1 h-9 rounded-xl text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 active:scale-[0.97] transition-all shadow-sm shadow-indigo-200 dark:shadow-indigo-500/20"
                        >
                            تأیید
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default function PersianCalendar({ onDayClick, notes = {} }: PersianCalendarProps) {
    const [ty, tm, td] = todayJalali();
    const [vy, setVy] = useState(ty);
    const [vm, setVm] = useState(tm);
    const [sel, setSel] = useState<[number, number, number]>([ty, tm, td]);
    const [picker, setPicker] = useState(false);
    const [dir, setDir] = useState(0);

    function nav(d: number) {
        setDir(d);
        let m = vm + d, y = vy;
        if (m > 12) { m = 1; y++; }
        if (m < 1) { m = 12; y--; }
        setVm(m); setVy(y);
    }

    function clickDay(day: number) {
        setSel([vy, vm, day]);
        onDayClick(vy, vm, day);
    }

    const dim = daysInMonth(vm, vy);
    const fw = firstWeekday(vy, vm);

    const cells = useMemo(() => {
        const arr: (number | null)[] = Array.from({ length: fw }, () => null);
        for (let d = 1; d <= dim; d++) arr.push(d);
        while (arr.length % 7 !== 0) arr.push(null);
        return arr;
    }, [vy, vm, fw, dim]);

    const slideVar = {
        enter: (d: number) => ({ opacity: 0, x: d > 0 ? -14 : 14 }),
        center: { opacity: 1, x: 0 },
        exit: (d: number) => ({ opacity: 0, x: d > 0 ? 14 : -14 }),
    };

    const selectedWeekday = sel ? getWeekdayName(sel[0], sel[1], sel[2]) : "";

    return (
        <>
            <div className="rounded-2xl bg-white dark:bg-[#111118] border border-gray-100 dark:border-white/[0.06] overflow-hidden">
                <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-white/[0.05]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                <CalendarDays className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                            </div>
                            <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400">
                                {MONTHS[tm - 1]}
                                <span className="text-gray-400 dark:text-gray-500 font-normal mr-1">{p(ty)}</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-0.5">
                            <button
                                onClick={() => nav(1)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-white transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>

                            <button
                                onClick={() => setPicker(true)}
                                className="px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center gap-1"
                            >
                                <AnimatePresence mode="wait" custom={dir}>
                                    <motion.span
                                        key={`${vy}-${vm}`}
                                        custom={dir}
                                        variants={slideVar}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ duration: 0.2, ease }}
                                        className="text-sm font-semibold text-gray-800 dark:text-white"
                                    >
                                        {MONTHS[vm - 1]} {p(vy)}
                                    </motion.span>
                                </AnimatePresence>
                                <motion.svg
                                    animate={{ rotate: picker ? 180 : 0 }}
                                    transition={{ duration: 0.2, ease }}
                                    className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </motion.svg>
                            </button>

                            <button
                                onClick={() => nav(-1)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-white transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-3">
                    <div className="grid grid-cols-7 mb-1.5">
                        {WEEKDAYS.map((d, i) => (
                            <div
                                key={i}
                                className={`text-center text-[11px] font-semibold py-1 ${i === 6 ? "text-rose-400" : "text-gray-300 dark:text-gray-600"}`}
                            >
                                {d}
                            </div>
                        ))}
                    </div>

                    <AnimatePresence mode="wait" custom={dir}>
                        <motion.div
                            key={`${vy}-${vm}`}
                            custom={dir}
                            variants={slideVar}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.2, ease }}
                            className="grid grid-cols-7 gap-y-0.5"
                        >
                            {cells.map((day, idx) => {
                                if (!day) return <div key={`e-${idx}`} className="h-10" />;

                                const key = `${vy}-${vm}-${day}`;
                                const dayNotes = notes[key] ?? [];
                                const isToday = vy === ty && vm === tm && day === td;
                                const isSel = sel[0] === vy && sel[1] === vm && sel[2] === day;
                                const isJumah = idx % 7 === 6;
                                const noteCount = dayNotes.length;

                                return (
                                    <button
                                        key={key}
                                        onClick={() => clickDay(day)}
                                        className={`
                                            relative flex items-center justify-center h-10 mx-0.5 rounded-xl
                                            transition-colors duration-150
                                            ${isSel
                                                ? "bg-indigo-500 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-500/20"
                                                : isToday
                                                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                                                    : isJumah
                                                        ? "text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/8"
                                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                                            }
                                        `}
                                    >
                                        <span className={`text-xs leading-none ${isToday ? "font-bold" : "font-medium"}`}>
                                            {p(day)}
                                        </span>

                                        {isToday && !isSel && (
                                            <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400 dark:bg-indigo-400" />
                                        )}

                                        {noteCount > 0 && (
                                            <span className={`
                                                absolute top-1 right-1 min-w-[14px] h-[14px] px-[3px]
                                                rounded-full text-[9px] font-bold leading-[14px] text-center
                                                ${isSel
                                                    ? "bg-white/25 text-white"
                                                    : "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-500 dark:text-indigo-300"
                                                }
                                            `}>
                                                {noteCount > 9 ? "۹+" : p(noteCount)}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>

                    {(vy !== ty || vm !== tm) && (
                        <div className="mt-2 flex justify-center">
                            <button
                                onClick={() => { setVy(ty); setVm(tm); setSel([ty, tm, td]); onDayClick(ty, tm, td); }}
                                className="text-[11px] text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 py-1 px-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/8 transition-colors"
                            >
                                برو به امروز
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {picker && (
                <DatePickerModal
                    currentYear={vy}
                    currentMonth={vm}
                    todayYear={ty}
                    onSelect={(y, m) => {
                        setDir(y !== vy ? (y > vy ? -1 : 1) : (m > vm ? -1 : 1));
                        setVy(y);
                        setVm(m);
                    }}
                    onClose={() => setPicker(false)}
                />
            )}
        </>
    );
}
