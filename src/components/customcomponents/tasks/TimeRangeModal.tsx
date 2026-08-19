"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Clock, Check, Loader, CalendarDays } from "lucide-react";
import {
    toJalali, toGregorian, jalaliMonthLength, jalaliWeekday,
    JALALI_MONTHS, JALALI_WEEKDAYS, toPersianDigits, pad2, todayJalali,
} from "@/lib/jalali";

interface FieldState { jy: number; jm: number; jd: number; hour: number; minute: number }
interface TimeRangeModalProps {
    open: boolean;
    initialStartedAt?: string | null;
    initialDeadline?: string | null;
    loading?: boolean;
    onClose: () => void;
    onSubmit: (startedAt: string, deadline: string) => Promise<void>;
    error?: string | null;
}

function parseIsoToField(iso?: string | null): FieldState {
    const d = iso ? new Date(iso) : new Date();
    const [jy, jm, jd] = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return { jy, jm, jd, hour: d.getHours(), minute: d.getMinutes() };
}

function fieldToIso(f: FieldState) {
    const [gy, gm, gd] = toGregorian(f.jy, f.jm, f.jd);
    return new Date(gy, gm - 1, gd, f.hour, f.minute, 0).toISOString();
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export default function TimeRangeModal({ open, initialStartedAt, initialDeadline, loading, onClose, onSubmit }: TimeRangeModalProps) {
    const [start, setStart] = useState<FieldState>(() => parseIsoToField(initialStartedAt));
    const [deadline, setDeadline] = useState<FieldState>(() => parseIsoToField(initialDeadline));
    const [activeField, setActiveField] = useState<"start" | "deadline">("start");
    const [viewJy, setViewJy] = useState(start.jy);
    const [viewJm, setViewJm] = useState(start.jm);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;
        setStart(parseIsoToField(initialStartedAt));
        setDeadline(parseIsoToField(initialDeadline));
        setActiveField("start");
        setError("");
    }, [open, initialStartedAt, initialDeadline]);

    useEffect(() => {
        const cur = activeField === "start" ? start : deadline;
        setViewJy(cur.jy); setViewJm(cur.jm);
    }, [activeField]);

    if (!open) return null;

    const current = activeField === "start" ? start : deadline;
    const setCurrent = activeField === "start" ? setStart : setDeadline;

    const weekdayOffset = jalaliWeekday(viewJy, viewJm, 1);
    const daysInMonth = jalaliMonthLength(viewJy, viewJm);
    const cells: (number | null)[] = [...Array(weekdayOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

    function prevMonth() {
        if (viewJm === 1) { setViewJm(12); setViewJy(y => y - 1); } else setViewJm(m => m - 1);
    }
    function nextMonth() {
        if (viewJm === 12) { setViewJm(1); setViewJy(y => y + 1); } else setViewJm(m => m + 1);
    }

    function handleSubmit() {
        const s = fieldToIso(start), d = fieldToIso(deadline);
        if (new Date(d) <= new Date(s)) { setError("مهلت انجام باید بعد از زمان شروع باشد"); return; }
        setError(""); onSubmit(s, d);
    }

    const [ty, tm, td] = todayJalali();

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    onClick={(e) => e.stopPropagation()} dir="rtl"
                    className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]"
                >
                    <div className="flex shrink-0 items-center justify-between px-8 pb-6 pt-8">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                                <Clock size={15} className="text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">تعیین بازه زمانی</h3>
                                <p className="mt-0.5 text-[11px] text-gray-400">شروع و مهلت انجام</p>
                            </div>
                        </div>
                        <button type="button" onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 dark:bg-white/[0.05] dark:hover:text-gray-300"
                        >
                            <X size={15} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 pb-2">
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-2">
                                {(["start", "deadline"] as const).map(field => {
                                    const f = field === "start" ? start : deadline;
                                    const active = activeField === field;
                                    return (
                                        <button key={field} type="button" onClick={() => setActiveField(field)}
                                            className={`rounded-2xl border px-3 py-2.5 text-right transition-all duration-200 ${active
                                                ? "border-blue-500 bg-blue-50/50 dark:border-blue-500/50 dark:bg-blue-500/[0.06]"
                                                : "border-gray-100 bg-gray-50 hover:border-gray-200 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12]"
                                                }`}
                                        >
                                            <div className={`mb-1 text-[10.5px] font-bold ${active ? "text-blue-500" : "text-gray-400"}`}>
                                                {field === "start" ? "شروع" : "مهلت انجام"}
                                            </div>
                                            <div className={`text-[12.5px] font-bold ${active ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>
                                                {toPersianDigits(f.jd)} {JALALI_MONTHS[f.jm - 1]} — {toPersianDigits(pad2(f.hour))}:{toPersianDigits(pad2(f.minute))}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50/60 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                                <div className="mb-4 flex items-center justify-between">
                                    <button type="button" onClick={prevMonth}
                                        className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm transition-colors hover:text-gray-600 dark:bg-white/[0.05] dark:hover:text-gray-200"
                                    >
                                        <ChevronRight size={15} />
                                    </button>
                                    <div className="flex items-center gap-1.5 text-[13px] font-bold text-gray-900 dark:text-white">
                                        <CalendarDays size={14} className="text-gray-400" />
                                        <span>{JALALI_MONTHS[viewJm - 1]}</span>
                                        <span className="text-gray-400">{toPersianDigits(viewJy)}</span>
                                    </div>
                                    <button type="button" onClick={nextMonth}
                                        className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm transition-colors hover:text-gray-600 dark:bg-white/[0.05] dark:hover:text-gray-200"
                                    >
                                        <ChevronLeft size={15} />
                                    </button>
                                </div>

                                <div className="mb-2 grid grid-cols-7 gap-1">
                                    {JALALI_WEEKDAYS.map(w => (
                                        <div key={w} className="py-1 text-center text-[10.5px] font-bold text-gray-300 dark:text-white/25">{w}</div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                    {cells.map((day, idx) => {
                                        const isSelected = day !== null && current.jy === viewJy && current.jm === viewJm && current.jd === day;
                                        const isToday = day !== null && ty === viewJy && tm === viewJm && td === day;
                                        return (
                                            <button key={idx} type="button" disabled={day === null}
                                                onClick={() => day && setCurrent(p => ({ ...p, jy: viewJy, jm: viewJm, jd: day }))}
                                                className={`aspect-square rounded-xl text-[12.5px] font-bold transition-colors ${day === null ? "invisible"
                                                    : isSelected ? "bg-blue-600 text-white"
                                                        : isToday ? "border border-blue-400 bg-blue-50 text-blue-600 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-300"
                                                            : "text-gray-500 hover:bg-gray-100 dark:text-white/60 dark:hover:bg-white/[0.06] dark:hover:text-white"
                                                    }`}
                                            >
                                                {day !== null ? toPersianDigits(day) : ""}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: "ساعت", key: "hour" as const, options: HOURS },
                                    { label: "دقیقه", key: "minute" as const, options: MINUTES },
                                ].map(({ label, key, options }) => (
                                    <div key={key}>
                                        <label className="mb-2 block text-[11.5px] font-bold text-gray-400">{label}</label>
                                        <select value={current[key]}
                                            onChange={e => setCurrent(p => ({ ...p, [key]: Number(e.target.value) }))}
                                            className="h-[52px] w-full rounded-2xl border border-gray-100 bg-gray-50 px-3 text-[12.5px] font-bold text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:focus:border-blue-500/50"
                                        >
                                            {options.map(v => (
                                                <option key={v} value={v}>{toPersianDigits(pad2(v))}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                                        className="rounded-2xl bg-red-50 px-3.5 py-3 text-center text-[11.5px] font-semibold text-red-500 dark:bg-red-500/10 dark:text-red-400"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 px-8 pb-8 pt-5">
                        <button type="button" onClick={onClose}
                            className="flex h-11 flex-1 items-center justify-center rounded-full border border-gray-100 bg-gray-50 text-[13px] font-bold text-gray-500 transition-colors hover:text-gray-700 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white/50 dark:hover:text-white/80"
                        >
                            انصراف
                        </button>
                        <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={loading}
                            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 text-[13px] font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
                        >
                            {loading ? <Loader size={15} className="animate-spin" /> : <><Check size={14} strokeWidth={3} />تأیید</>}
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
