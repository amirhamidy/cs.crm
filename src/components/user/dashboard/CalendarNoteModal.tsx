"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, StickyNote, Plus, Trash2, Clock, Check, FileText } from "lucide-react";

export interface CalendarNote {
    id: string;
    title: string;
    body: string;
    time?: string;
    createdAt: string;
}

interface CalendarNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    year: number;
    month: number;
    day: number;
    onNotesChange?: (key: string, notes: CalendarNote[]) => void;
}

const MONTHS = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];
const WEEKDAYS: Record<number, string> = {
    0: "یکشنبه", 1: "دوشنبه", 2: "سه‌شنبه", 3: "چهارشنبه", 4: "پنج‌شنبه", 5: "جمعه", 6: "شنبه",
};
const STORAGE_KEY = "persian-calendar-notes";

function p(n: number | string) { return String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]); }

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

function loadNotes(key: string): CalendarNote[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const all = raw ? JSON.parse(raw) : {};
        return all[key] ?? [];
    } catch { return []; }
}

function saveNotes(key: string, notes: CalendarNote[]) {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const all = raw ? JSON.parse(raw) : {};
        if (notes.length === 0) delete all[key];
        else all[key] = notes;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch { }
}

export function loadAllNotes(): Record<string, CalendarNote[]> {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
}

type Tab = "view" | "add";

export default function CalendarNoteModal({
    isOpen, onClose, year, month, day, onNotesChange,
}: CalendarNoteModalProps) {
    const dateKey = `${year}-${month}-${day}`;
    const [notes, setNotes] = useState<CalendarNote[]>([]);
    const [tab, setTab] = useState<Tab>("view");
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [time, setTime] = useState("");
    const [saved, setSaved] = useState(false);
    const [delId, setDelId] = useState<string | null>(null);
    const titleRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const loaded = loadNotes(dateKey);
        setNotes(loaded);
        setTab(loaded.length === 0 ? "add" : "view");
        reset();
    }, [isOpen, dateKey]);

    useEffect(() => {
        if (tab === "add") setTimeout(() => titleRef.current?.focus(), 120);
    }, [tab]);

    useEffect(() => {
        const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", fn);
        return () => window.removeEventListener("keydown", fn);
    }, [onClose]);

    function reset() { setTitle(""); setBody(""); setTime(""); setSaved(false); setDelId(null); }

    function persist(updated: CalendarNote[]) {
        saveNotes(dateKey, updated);
        setNotes(updated);
        onNotesChange?.(dateKey, updated);
    }

    function handleSave() {
        if (!title.trim()) return;
        const note: CalendarNote = {
            id: Date.now().toString(),
            title: title.trim(),
            body: body.trim(),
            time: time || undefined,
            createdAt: `${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`,
        };
        persist([...notes, note]);
        setSaved(true);
        setTimeout(() => { setSaved(false); setTab("view"); reset(); }, 900);
    }

    function handleDelete(id: string) {
        persist(notes.filter(n => n.id !== id));
        setDelId(null);
    }

    const [gy, gm, gd] = toGregorian(year, month, day);
    const weekday = WEEKDAYS[new Date(gy, gm - 1, gd).getDay()];
    const canSave = title.trim().length > 0;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-40 bg-black/30 dark:bg-black/55 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                    key="modal"
                    initial={{ opacity: 0, scale: 0.95, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 12 }}
                    transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                    className="pointer-events-auto w-full max-w-[400px] rounded-2xl bg-white dark:bg-[#111118] border border-gray-100 dark:border-white/[0.07] shadow-2xl shadow-black/10 dark:shadow-black/50 overflow-hidden"
                >
                    <div className="px-5 pt-5 pb-0">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                                    {p(day)} {MONTHS[month - 1]}
                                    <span className="text-gray-400 dark:text-gray-500 font-normal text-sm mr-1">{p(year)}</span>
                                </h2>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{weekday}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-1 border-b border-gray-100 dark:border-white/[0.06]">
                            {(["view", "add"] as Tab[]).map(t => (
                                <button
                                    key={t}
                                    onClick={() => { setTab(t); if (t === "view") reset(); }}
                                    className={`relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${tab === t
                                        ? "text-gray-900 dark:text-white"
                                        : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                        }`}
                                >
                                    {t === "view"
                                        ? <><StickyNote className="w-3.5 h-3.5" />یادداشت‌ها{notes.length > 0 && <span className="bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{p(notes.length)}</span>}</>
                                        : <><Plus className="w-3.5 h-3.5" />افزودن</>
                                    }
                                    {tab === t && (
                                        <motion.div
                                            layoutId="tab-indicator"
                                            className="absolute bottom-0 inset-x-0 h-0.5 bg-indigo-500 rounded-full"
                                            transition={{ duration: 0.2 }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="px-5 py-4 max-h-[52vh] overflow-y-auto">
                        <AnimatePresence mode="wait">
                            {tab === "view" ? (
                                <motion.div
                                    key="view"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.12 }}
                                >
                                    {notes.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-10 text-center">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/4 border border-gray-100 dark:border-white/8 flex items-center justify-center mb-3">
                                                <FileText className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                                            </div>
                                            <p className="text-sm text-gray-400 dark:text-gray-500">یادداشتی ثبت نشده</p>
                                            <button
                                                onClick={() => setTab("add")}
                                                className="mt-2 text-xs text-indigo-500 dark:text-indigo-400 hover:underline"
                                            >
                                                اضافه کن
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {notes.map(note => (
                                                <motion.div
                                                    key={note.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.97 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="group rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.025] p-3.5 hover:border-gray-200 dark:hover:border-white/10 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-0.5" />
                                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{note.title}</p>
                                                        </div>

                                                        <AnimatePresence mode="wait">
                                                            {delId === note.id ? (
                                                                <motion.div
                                                                    key="confirm"
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    exit={{ opacity: 0 }}
                                                                    transition={{ duration: 0.1 }}
                                                                    className="flex items-center gap-1 flex-shrink-0"
                                                                >
                                                                    <button
                                                                        onClick={() => handleDelete(note.id)}
                                                                        className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-500 dark:text-rose-400 text-[11px] font-medium hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                                                                    >
                                                                        حذف
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setDelId(null)}
                                                                        className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </motion.div>
                                                            ) : (
                                                                <motion.button
                                                                    key="del-btn"
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    exit={{ opacity: 0 }}
                                                                    onClick={() => setDelId(note.id)}
                                                                    className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md text-gray-300 dark:text-gray-600 hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all flex-shrink-0"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </motion.button>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>

                                                    {note.body && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed pr-3.5">{note.body}</p>
                                                    )}
                                                    {note.time && (
                                                        <div className="flex items-center gap-1 mt-2 pr-3.5">
                                                            <Clock className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                                                            <span className="text-[11px] text-gray-400 dark:text-gray-500">{note.time}</span>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="add"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.12 }}
                                    className="space-y-3"
                                >
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">عنوان *</label>
                                        <input
                                            ref={titleRef}
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && canSave) handleSave(); }}
                                            placeholder="مثلاً: جلسه با مستفا"
                                            maxLength={60}
                                            dir="rtl"
                                            className="w-full h-10 px-3 rounded-xl text-sm text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] outline-none focus:border-indigo-300 dark:focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">توضیحات</label>
                                        <textarea
                                            value={body}
                                            onChange={e => setBody(e.target.value)}
                                            placeholder="جزئیات بیشتر..."
                                            rows={3}
                                            maxLength={300}
                                            dir="rtl"
                                            className="w-full px-3 py-2.5 rounded-xl text-sm text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] outline-none focus:border-indigo-300 dark:focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 transition-all resize-none leading-relaxed"
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                                            <Clock className="w-3 h-3" />
                                            ساعت
                                        </label>
                                        <input
                                            type="time"
                                            value={time}
                                            onChange={e => setTime(e.target.value)}
                                            className="h-10 px-3 rounded-xl text-sm text-gray-800 dark:text-white bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] outline-none focus:border-indigo-300 dark:focus:border-indigo-500/50 transition-all"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="px-5 py-3.5 border-t border-gray-100 dark:border-white/[0.05] flex items-center justify-between gap-3 bg-gray-50/50 dark:bg-white/[0.015]">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/8 transition-all"
                        >
                            بستن
                        </button>

                        {tab === "add" ? (
                            <button
                                onClick={handleSave}
                                disabled={!canSave}
                                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${saved
                                    ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                    : canSave
                                        ? "bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-500/10"
                                        : "bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-white/5"
                                    }`}
                            >
                                <AnimatePresence mode="wait">
                                    {saved ? (
                                        <motion.span key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} className="flex items-center gap-1.5">
                                            <Check className="w-4 h-4" />ذخیره شد
                                        </motion.span>
                                    ) : (
                                        <motion.span key="n" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} className="flex items-center gap-1.5">
                                            <StickyNote className="w-4 h-4" />ذخیره
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </button>
                        ) : (
                            <button
                                onClick={() => setTab("add")}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-500/10 transition-all"
                            >
                                <Plus className="w-4 h-4" />یادداشت جدید
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}