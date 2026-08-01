"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, CalendarDays } from "lucide-react";

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
        const prevYearDays = prevJalaliLeap ? 366 : 365;
        let remaining = prevYearDays + gapToNowruz;
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
        const prevYearDays = isGregorianLeap(gregorianYear - 1) ? 366 : 365;
        nowruzGregorianDays += prevYearDays + 79;
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
        if (remainingGregorianDays < daysInMonth) {
            gMonth = i + 1;
            break;
        }
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
function daysInMonth(jm: number, jy: number) { return jm <= 6 ? 31 : jm <= 11 ? 30 : isLeap(jy) ? 30 : 29; }
function todayJalali(): [number, number, number] {
    const n = new Date();
    return toJalali(n.getFullYear(), n.getMonth() + 1, n.getDate());
}
function p(n: number | string) { return String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]); }

export default function PersianCalendar({ onDayClick, notes = {} }: PersianCalendarProps) {
    const [ty, tm, td] = todayJalali();
    const [vy, setVy] = useState(ty);
    const [vm, setVm] = useState(tm);
    const [sel, setSel] = useState<[number, number, number]>([ty, tm, td]);
    const [picker, setPicker] = useState(false);
    const [dir, setDir] = useState(0);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fn = (e: MouseEvent) => {
            if (picker && pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPicker(false);
        };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, [picker]);

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
    }, [vy, vm]);

    const years = Array.from({ length: 15 }, (_, i) => ty - 3 + i);

    const slideVar = {
        enter: (d: number) => ({ opacity: 0, x: d > 0 ? -16 : 16 }),
        center: { opacity: 1, x: 0 },
        exit: (d: number) => ({ opacity: 0, x: d > 0 ? 16 : -16 }),
    };

    return (
        <div className="rounded-2xl bg-white dark:bg-[#111118] border border-gray-100 dark:border-white/[0.06] overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-white/[0.05]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                            <CalendarDays className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                            {p(td)} {MONTHS[tm - 1]} {p(ty)}
                        </span>
                    </div>

                    <div className="flex items-center gap-0.5">
                        <button
                            onClick={() => nav(1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-white transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>

                        <div className="relative" ref={pickerRef}>
                            <button
                                onClick={() => setPicker(!picker)}
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
                                        transition={{ duration: 0.15, ease: "easeOut" }}
                                        className="text-sm font-semibold text-gray-800 dark:text-white"
                                    >
                                        {MONTHS[vm - 1]} {p(vy)}
                                    </motion.span>
                                </AnimatePresence>
                                <motion.svg
                                    animate={{ rotate: picker ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </motion.svg>
                            </button>

                            <AnimatePresence>
                                {picker && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                        transition={{ duration: 0.15, ease: "easeOut" }}
                                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-60 rounded-xl bg-white dark:bg-[#1c1c28] border border-gray-200 dark:border-white/10 shadow-xl shadow-black/10 dark:shadow-black/40 p-3"
                                    >
                                        <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 text-center mb-2">ماه</p>
                                        <div className="grid grid-cols-4 gap-1 mb-3">
                                            {MONTHS.map((m, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => { setVm(i + 1); setPicker(false); }}
                                                    className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${vm === i + 1
                                                        ? "bg-indigo-500 text-white"
                                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8"
                                                        }`}
                                                >
                                                    {m}
                                                </button>
                                            ))}
                                        </div>

                                        <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 text-center mb-2">سال</p>
                                        <div className="grid grid-cols-3 gap-1 max-h-28 overflow-y-auto">
                                            {years.map(y => (
                                                <button
                                                    key={y}
                                                    onClick={() => { setVy(y); setPicker(false); }}
                                                    className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${vy === y
                                                        ? "bg-indigo-500 text-white"
                                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8"
                                                        }`}
                                                >
                                                    {p(y)}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

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
                <div className="grid grid-cols-7 mb-1">
                    {WEEKDAYS.map((d, i) => (
                        <div
                            key={i}
                            className={`text-center text-[11px] font-medium py-1 ${i === 6 ? "text-rose-400" : "text-gray-300 dark:text-gray-600"
                                }`}
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
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="grid grid-cols-7"
                    >
                        {cells.map((day, idx) => {
                            if (!day) return <div key={`e-${idx}`} className="h-10" />;

                            const key = `${vy}-${vm}-${day}`;
                            const dayNotes = notes[key] ?? [];
                            const isToday = vy === ty && vm === tm && day === td;
                            const isSel = sel[0] === vy && sel[1] === vm && sel[2] === day;
                            const isJumah = idx % 7 === 6;
                            const hasNotes = dayNotes.length > 0;

                            return (
                                <button
                                    key={key}
                                    onClick={() => clickDay(day)}
                                    className={`
                    relative flex flex-col items-center justify-center h-10 mx-0.5 rounded-xl
                    text-xs font-medium transition-colors duration-100
                    ${isSel
                                            ? "bg-indigo-500 text-white"
                                            : isToday
                                                ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-500/30"
                                                : isJumah
                                                    ? "text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/8"
                                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                                        }
                  `}
                                >
                                    <span>{p(day)}</span>
                                    {hasNotes && (
                                        <span className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isSel ? "bg-white/60" : "bg-indigo-400"}`} />
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
    );
}