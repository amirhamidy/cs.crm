"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Plus, Trash2, Clock, Check, StickyNote,
    CalendarDays, FileText, AlarmClock,
} from "lucide-react";

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

function p(n: number | string) {
    return String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]);
}

function toGregorian(jy: number, jm: number, jd: number): [number, number, number] {
    const gDIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const jDIM = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
    const gLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const jLeap = (y: number) => {
        const c = y % 33;
        return c === 1 || c === 5 || c === 9 || c === 13 || c === 17 || c === 22 || c === 26 || c === 30;
    };

    let totalJD = jd;
    for (let i = 0; i < jm - 1; i++) totalJD += jDIM[i];
    if (jm > 12 && jLeap(jy)) totalJD++;

    let gYear = jy + 621;
    let nDays = 0;
    for (let y = 622; y < gYear; y++) nDays += gLeap(y) ? 366 : 365;
    nDays += (gLeap(gYear - 1) ? 366 : 365) + 79;

    let rem = nDays + totalJD - 1;
    let gY = 1;
    while (true) {
        const diy = gLeap(gY) ? 366 : 365;
        if (rem < diy) break;
        rem -= diy; gY++;
    }

    let gM = 1;
    for (let i = 0; i < 12; i++) {
        let dim = gDIM[i];
        if (i === 1 && gLeap(gY)) dim = 29;
        if (rem < dim) { gM = i + 1; break; }
        rem -= dim;
    }
    return [gY, gM, rem + 1];
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

const ease = [0.25, 0, 0, 1] as const;

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
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                    key="modal"
                    initial={{ opacity: 0, scale: 0.96, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 16 }}
                    transition={{ duration: 0.22, ease }}
                    className="pointer-events-auto w-full max-w-[420px] rounded-2xl bg-white dark:bg-[#0f0f17] border border-gray-100 dark:border-white/[0.07] shadow-2xl shadow-black/15 dark:shadow-black/60 overflow-hidden"
                >
                    <div className="relative px-5 pt-5 pb-4 border-b border-gray-100 dark:border-white/[0.06]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                <CalendarDays className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-1.5">
                                    <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                                        {p(day)} {MONTHS[month - 1]}
                                    </h2>
                                    <span className="text-sm text-gray-400 dark:text-gray-500 font-normal">{p(year)}</span>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{weekday}</p>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8 transition-colors flex-shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-0.5 mt-4">
                            {(["view", "add"] as Tab[]).map(t => (
                                <button
                                    key={t}
                                    onClick={() => { setTab(t); if (t === "view") reset(); }}
                                    className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${tab === t
                                            ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10"
                                            : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/4"
                                        }`}
                                >
                                    {t === "view" ? (
                                        <>
                                            <StickyNote className="w-3.5 h-3.5" />
                                            یادداشت‌ها
                                            {notes.length > 0 && (
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${tab === "view"
                                                        ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                                                        : "bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-gray-400"
                                                    }`}>
                                                    {p(notes.length)}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-3.5 h-3.5" />
                                            افزودن
                                        </>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="px-5 py-4 min-h-[220px] max-h-[50vh] overflow-y-auto">
                        <AnimatePresence mode="wait">
                            {tab === "view" ? (
                                <motion.div
                                    key="view"
                                    initial={{ opacity: 0, x: 6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 6 }}
                                    transition={{ duration: 0.15, ease }}
                                >
                                    {notes.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] flex items-center justify-center mb-3">
                                                <FileText className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-400 dark:text-gray-500">یادداشتی نداری</p>
                                            <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5 mb-3">برای این روز یادداشت اضافه کن</p>
                                            <button
                                                onClick={() => setTab("add")}
                                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                اضافه کن
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {notes.map((note, i) => (
                                                <motion.div
                                                    key={note.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.97 }}
                                                    transition={{ duration: 0.15, delay: i * 0.04 }}
                                                    className="group relative rounded-xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-4 hover:border-indigo-100 dark:hover:border-indigo-500/20 hover:bg-indigo-50/20 dark:hover:bg-indigo-500/[0.03] transition-all"
                                                >
                                                    <div className="absolute right-0 top-0 bottom-0 w-[3px] rounded-r-xl bg-indigo-400 dark:bg-indigo-500 opacity-60" />

                                                    <div className="flex items-start justify-between gap-2 pr-2">
                                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug flex-1 min-w-0">
                                                            {note.title}
                                                        </p>

                                                        <AnimatePresence mode="wait">
                                                            {delId === note.id ? (
                                                                <motion.div
                                                                    key="confirm"
                                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                                    transition={{ duration: 0.12 }}
                                                                    className="flex items-center gap-1 flex-shrink-0"
                                                                >
                                                                    <button
                                                                        onClick={() => handleDelete(note.id)}
                                                                        className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 text-rose-500 dark:text-rose-400 text-[11px] font-semibold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                                                                    >
                                                                        حذف
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setDelId(null)}
                                                                        className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
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
                                                                    className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 hover:text-rose-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all flex-shrink-0"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </motion.button>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>

                                                    {note.body && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed pr-2">
                                                            {note.body}
                                                        </p>
                                                    )}

                                                    {note.time && (
                                                        <div className="flex items-center gap-1.5 mt-2.5 pr-2">
                                                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 dark:bg-white/4 border border-gray-100 dark:border-white/[0.06]">
                                                                <AlarmClock className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                                                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                                                    {note.time}
                                                                </span>
                                                            </div>
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
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -6 }}
                                    transition={{ duration: 0.15, ease }}
                                    className="space-y-3.5"
                                >
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                                            عنوان
                                            <span className="text-rose-400 mr-0.5">*</span>
                                        </label>
                                        <input
                                            ref={titleRef}
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && canSave) handleSave(); }}
                                            placeholder="مثلاً: جلسه با مستفا"
                                            maxLength={60}
                                            dir="rtl"
                                            className="w-full h-10 px-3.5 rounded-xl text-sm text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] outline-none focus:border-indigo-400 dark:focus:border-indigo-500/60 focus:bg-white dark:focus:bg-white/[0.05] focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/10 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                                            توضیحات
                                        </label>
                                        <textarea
                                            value={body}
                                            onChange={e => setBody(e.target.value)}
                                            placeholder="جزئیات بیشتر..."
                                            rows={3}
                                            maxLength={300}
                                            dir="rtl"
                                            className="w-full px-3.5 py-2.5 rounded-xl text-sm text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] outline-none focus:border-indigo-400 dark:focus:border-indigo-500/60 focus:bg-white dark:focus:bg-white/[0.05] focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/10 transition-all resize-none leading-relaxed"
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                                            <Clock className="w-3 h-3" />
                                            ساعت
                                        </label>
                                        <input
                                            type="time"
                                            value={time}
                                            onChange={e => setTime(e.target.value)}
                                            className="h-10 px-3.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] outline-none focus:border-indigo-400 dark:focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/10 transition-all"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="px-5 py-3.5 border-t border-gray-100 dark:border-white/[0.05] flex items-center justify-between gap-3 bg-gray-50/70 dark:bg-white/[0.01]">
                        <button
                            onClick={onClose}
                            className="h-9 px-4 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/6 border border-gray-200 dark:border-white/8 transition-all"
                        >
                            بستن
                        </button>

                        <AnimatePresence mode="wait">
                            {tab === "add" ? (
                                <motion.button
                                    key="save"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.12 }}
                                    onClick={handleSave}
                                    disabled={!canSave}
                                    className={`h-9 flex items-center gap-2 px-5 rounded-xl text-sm font-semibold transition-all duration-200 ${saved
                                            ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
                                            : canSave
                                                ? "bg-indigo-500 hover:bg-indigo-600 active:scale-[0.97] text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-500/15"
                                                : "bg-gray-100 dark:bg-white/4 text-gray-300 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-white/5"
                                        }`}
                                >
                                    <AnimatePresence mode="wait">
                                        {saved ? (
                                            <motion.span
                                                key="saved"
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -4 }}
                                                transition={{ duration: 0.12 }}
                                                className="flex items-center gap-1.5"
                                            >
                                                <Check className="w-4 h-4" />
                                                ذخیره شد
                                            </motion.span>
                                        ) : (
                                            <motion.span
                                                key="normal"
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -4 }}
                                                transition={{ duration: 0.12 }}
                                                className="flex items-center gap-1.5"
                                            >
                                                <StickyNote className="w-4 h-4" />
                                                ذخیره
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            ) : (
                                <motion.button
                                    key="new"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.12 }}
                                    onClick={() => setTab("add")}
                                    className="h-9 flex items-center gap-2 px-4 rounded-xl text-sm font-semibold bg-indigo-500 hover:bg-indigo-600 active:scale-[0.97] text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-500/15 transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    یادداشت جدید
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
