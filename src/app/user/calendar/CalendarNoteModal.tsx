"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { CalendarDays, Clock3, Loader2, Send, StickyNote, Tag, Trash2, UserRound, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { useAuthStore } from "@/store/authStore";



export interface CalendarPerson {
    id: number;
    full_name: string;
}

export interface CalendarPeople {
    assigned_employee?: CalendarPerson[];
    created_by?: CalendarPerson | null;
}

export interface CalendarEvent {
    id: number;
    title: string;
    start: string;
    end: string;
    type: string;
    people?: CalendarPeople | null;
}

export interface CalendarResponse {
    start: string;
    end: string;
    events: CalendarEvent[];
}

export interface CalendarNote {
    id: number;
    user?: number;
    description: string;
    created_at?: string;
    updated_at?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date | null;
    notes: CalendarNote[];
    events: CalendarEvent[];
    onCreated: (note: CalendarNote) => void;
    onDeleted: (id: number) => void;
}



const pad = (v: number) => String(v).padStart(2, "0");
const toDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const getNoteDate = (n: CalendarNote) => n.created_at?.slice(0, 10) ?? "";

const fa = (date: Date, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("fa-IR-u-ca-persian", options).format(date);

const formatEventDate = (value?: string) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

const isPastDay = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return target < today;
};

const getJalaliParts = (date: Date) => {
    const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
    }).formatToParts(date);
    return [
        Number(parts.find((p) => p.type === "year")?.value),
        Number(parts.find((p) => p.type === "month")?.value),
        Number(parts.find((p) => p.type === "day")?.value),
    ];
};

export const IRAN_HOLIDAYS_1405 = new Set([
    "1-1", "1-2", "1-3", "1-4", "1-12", "1-13", "1-25",
    "3-3", "3-6", "3-14", "3-15",
    "4-3", "4-4",
    "5-13", "5-21", "5-22", "5-30",
    "6-8",
    "8-22",
    "10-2", "10-16",
    "11-4", "11-22",
    "12-9", "12-19", "12-20", "12-29",
]);

export const isFriday = (date: Date) => date.getDay() === 5;
const isIranHoliday = (date: Date) => {
    const [year, month, day] = getJalaliParts(date);
    return year === 1405 && IRAN_HOLIDAYS_1405.has(`${month}-${day}`);
};
const isCalendarHoliday = (date: Date | null) => !!date && (isFriday(date) || isIranHoliday(date));

const EVENT_TYPE_LABEL: Record<string, string> = {
    meeting: "جلسه",
    task: "وظیفه",
    tasks: "وظیفه",
    internal_task: "وظیفه درون سازمانی",
    "internal-task": "وظیفه درون سازمانی",
    internal_task_routine: "وظیفه درون سازمانی",
    reminder: "یادآور",
    deadline: "مهلت",
    note: "یادداشت",
    notes: "یادداشت",
};

export interface TypeStyle {
    bg: string;     
    text: string;   
    dot: string;    
    bar: string;    
    border: string; 
}

const EVENT_TYPE_COLOR: Record<string, TypeStyle> = {
    meeting: { bg: "bg-violet-500/10", text: "text-violet-700 dark:text-violet-200", dot: "bg-violet-500", bar: "bg-violet-500", border: "border-violet-500/20" },
    task: { bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-200", dot: "bg-blue-500", bar: "bg-blue-500", border: "border-blue-500/20" },
    internal_task: { bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-200", dot: "bg-amber-500", bar: "bg-amber-500", border: "border-amber-500/20" },
    reminder: { bg: "bg-cyan-500/10", text: "text-cyan-700 dark:text-cyan-200", dot: "bg-cyan-500", bar: "bg-cyan-500", border: "border-cyan-500/20" },
    deadline: { bg: "bg-rose-500/10", text: "text-rose-700 dark:text-rose-200", dot: "bg-rose-500", bar: "bg-rose-500", border: "border-rose-500/20" },
    note: { bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-200", dot: "bg-emerald-500", bar: "bg-emerald-500", border: "border-emerald-500/20" },
    default: { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-300", dot: "bg-slate-400", bar: "bg-slate-400", border: "border-slate-500/20" },
};

export const getEventType = (type: string) => {
    const value = String(type || "").toLowerCase();
    if (["internal_task", "internal-task", "internal_task_routine"].includes(value)) return "internal_task";
    if (["task", "tasks"].includes(value)) return "task";
    if (["note", "notes"].includes(value)) return "note";
    return value;
};

export const getTypeStyle = (type: string): TypeStyle => EVENT_TYPE_COLOR[getEventType(type)] ?? EVENT_TYPE_COLOR.default;
export const getTypeLabel = (type: string) => EVENT_TYPE_LABEL[getEventType(type)] ?? (type || "رویداد");

export const isEventOnDate = (event: CalendarEvent, dateISO: string) => {
    if (!event.start) return false;
    const start = event.start.slice(0, 10);
    const end = event.end?.slice(0, 10) ?? start;
    return start <= dateISO && end >= dateISO;
};

const initial = (name: string) => name.trim().charAt(0);



export default function CalendarNoteModal({ isOpen, onClose, selectedDate, notes, events, onCreated, onDeleted }: Props) {
    const { userId } = useAuthStore();
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const selectedKey = selectedDate ? toDateKey(selectedDate) : "";
    const dayNotes = useMemo(() => notes.filter((n) => getNoteDate(n) === selectedKey), [notes, selectedKey]);
    const dayEvents = useMemo(() => events.filter((e) => isEventOnDate(e, selectedKey)), [events, selectedKey]);
    const past = isPastDay(selectedDate);
    const holiday = isCalendarHoliday(selectedDate);
    const disabled = past;
    const holidayText = selectedDate ? (isFriday(selectedDate) ? "جمعه" : isIranHoliday(selectedDate) ? "تعطیل رسمی" : "") : "";

    const handleSubmit = async () => {
        if (!selectedDate || !description.trim() || !userId || submitting || disabled) return;
        setSubmitting(true);
        try {
            const { data } = await axiosInstance.post<CalendarNote>("/note/api/v1/create/", {
                user: Number(userId),
                description: description.trim(),
            });
            onCreated(data);
            setDescription("");
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        setDeletingId(id);
        try {
            await axiosInstance.delete(`/note/api/v1/${id}/delete/`);
            onDeleted(id);
        } catch (error) {
            console.error(error);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && selectedDate && (
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[120] flex items-stretch justify-start bg-slate-950/40 p-2 backdrop-blur-sm sm:p-4"
                    onClick={onClose}
                >
                    <m.aside
                        initial={{ opacity: 0, x: -48 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -48 }}
                        transition={{ type: "spring", damping: 28, stiffness: 320 }}
                        dir="rtl"
                        onClick={(e) => e.stopPropagation()}
                        className="relative flex h-full w-full max-w-[30rem] flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-gradient-to-b from-sky-50/95 via-white/95 to-blue-50/95 shadow-[0_40px_100px_-30px_rgba(30,64,175,0.55)] backdrop-blur-2xl dark:border-white/[0.08] dark:from-[#0a1738]/95 dark:via-[#0b1633]/95 dark:to-[#08112b]/95"
                    >
                        
                        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 px-6 pb-6 pt-5 text-white">
                            <div className="pointer-events-none absolute -left-10 -top-12 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
                            <div className="pointer-events-none absolute -bottom-16 right-10 h-40 w-40 rounded-full bg-indigo-400/40 blur-3xl" />
                            <div className="relative flex items-start justify-between">
                                <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10.5px] font-bold backdrop-blur-md">
                                    <CalendarDays size={12} />
                                    جزئیات روز
                                </div>
                                <button type="button" onClick={onClose} aria-label="بستن" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><X size={16} /></button>
                            </div>
                            <div className="relative mt-5 flex items-end gap-4">
                                <span className="text-[56px] font-black leading-none tracking-tight">{fa(selectedDate, { day: "numeric" })}</span>
                                <div className="pb-1.5">
                                    <p className="text-[15px] font-extrabold">{fa(selectedDate, { weekday: "long" })}</p>
                                    <p className="mt-0.5 text-[12px] font-semibold text-white/80">{fa(selectedDate, { month: "long", year: "numeric" })}</p>
                                </div>
                            </div>
                            <div className="relative mt-4 flex flex-wrap gap-2">
                                {holiday && <span className="rounded-full bg-rose-500/90 px-2.5 py-1 text-[10px] font-bold shadow-sm">{holidayText}</span>}
                                <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold backdrop-blur-md">{dayEvents.length.toLocaleString("fa-IR")} رویداد</span>
                                <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold backdrop-blur-md">{dayNotes.length.toLocaleString("fa-IR")} یادداشت</span>
                            </div>
                        </div>

                        
                        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
                            <section className="space-y-3">
                                <h4 className="text-[12.5px] font-extrabold text-slate-700 dark:text-slate-200">برنامه این روز</h4>
                                {dayEvents.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-blue-200/80 bg-white/50 px-5 py-7 text-center text-[11px] font-semibold text-slate-400 dark:border-white/[0.08] dark:bg-white/[0.02]">برای این روز رویدادی ثبت نشده</div>
                                ) : dayEvents.map((event) => {
                                    const style = getTypeStyle(event.type);
                                    const assigned = event.people?.assigned_employee ?? [];
                                    const creator = event.people?.created_by;
                                    return (
                                        <m.div
                                            key={`${event.type}-${event.id}`}
                                            layout
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-4 pr-5 shadow-[0_6px_24px_-14px_rgba(37,99,235,0.35)] backdrop-blur-md dark:border-white/[0.07] dark:bg-white/[0.04] dark:shadow-none"
                                        >
                                            <span className={`absolute inset-y-3 right-0 w-1 rounded-full ${style.bar}`} />
                                            <p className="break-words text-[13px] font-extrabold text-slate-800 dark:text-white">{event.title}</p>
                                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                                <span className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[9.5px] font-bold ${style.bg} ${style.text} ${style.border}`}><Tag size={10} />{getTypeLabel(event.type)}</span>
                                                <span className="rounded-lg bg-slate-500/10 px-2 py-1 text-[9px] font-bold text-slate-400">#{event.id}</span>
                                            </div>
                                            <div className="mt-3 grid grid-cols-2 gap-2">
                                                {[["شروع", event.start], ["پایان", event.end]].map(([label, value]) => (
                                                    <div key={label} className="flex items-center gap-2 rounded-xl bg-blue-500/[0.06] px-2.5 py-2 dark:bg-white/[0.04]">
                                                        <Clock3 size={12} className="shrink-0 text-blue-500" />
                                                        <div className="min-w-0">
                                                            <p className="text-[8.5px] font-bold text-slate-400">{label}</p>
                                                            <p className="truncate text-[10px] font-bold text-slate-600 dark:text-slate-300">{formatEventDate(value)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {(assigned.length > 0 || creator) && (
                                                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                                    {assigned.length > 0 && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex -space-x-2 space-x-reverse">
                                                                {assigned.slice(0, 5).map((p) => (
                                                                    <span key={p.id} title={p.full_name} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-blue-500 to-cyan-400 text-[10px] font-extrabold text-white dark:border-[#0b1633]">{initial(p.full_name)}</span>
                                                                ))}
                                                                {assigned.length > 5 && <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[9px] font-bold text-slate-600 dark:border-[#0b1633] dark:bg-slate-700 dark:text-slate-200">+{(assigned.length - 5).toLocaleString("fa-IR")}</span>}
                                                            </div>
                                                            <span className="max-w-[10rem] truncate text-[10px] font-bold text-slate-500 dark:text-slate-400">{assigned.map((p) => p.full_name).join("، ")}</span>
                                                        </div>
                                                    )}
                                                    {creator && (
                                                        <span className="flex items-center gap-1.5 text-[9.5px] font-bold text-slate-400"><UserRound size={11} />ایجاد: <span className="text-slate-600 dark:text-slate-300">{creator.full_name}</span></span>
                                                    )}
                                                </div>
                                            )}
                                        </m.div>
                                    );
                                })}
                            </section>

                            <section className="space-y-3">
                                <h4 className="flex items-center gap-1.5 text-[12.5px] font-extrabold text-slate-700 dark:text-slate-200"><StickyNote size={13} className="text-emerald-500" />یادداشت‌ها</h4>
                                {dayNotes.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-blue-200/80 bg-white/50 px-5 py-7 text-center text-[11px] font-semibold text-slate-400 dark:border-white/[0.08] dark:bg-white/[0.02]">هنوز یادداشتی برای این روز نوشته نشده</div>
                                ) : (
                                    <AnimatePresence>
                                        {dayNotes.map((note) => (
                                            <m.div
                                                key={note.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.2 }}
                                                className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.06] p-4"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="whitespace-pre-wrap break-words text-[11.5px] font-semibold leading-7 text-slate-700 dark:text-slate-200">{note.description}</p>
                                                        {note.created_at && <p className="mt-2 text-[9px] font-medium text-slate-400">{formatEventDate(note.created_at)}</p>}
                                                    </div>
                                                    <button type="button" aria-label="حذف یادداشت" onClick={() => handleDelete(note.id)} disabled={deletingId === note.id} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-rose-500/10 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-400">
                                                        {deletingId === note.id ? <Loader2 size={15} className="animate-spin text-rose-500" /> : <Trash2 size={15} className="text-rose-500" />}
                                                    </button>
                                                </div>
                                            </m.div>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </section>
                        </div>

                        
                        <div className="shrink-0 border-t border-blue-100/80 bg-white/70 p-4 backdrop-blur-xl dark:border-white/[0.06] dark:bg-white/[0.02]">
                            <div className="relative">
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit(); }}
                                    placeholder={disabled ? "برای روزهای گذشته امکان ثبت یادداشت وجود ندارد" : "یادداشت این روز را بنویسید..."}
                                    rows={3}
                                    disabled={disabled}
                                    className="w-full resize-none rounded-2xl border border-blue-200/70 bg-white/80 py-3 pl-16 pr-4 text-[12.5px] leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-100"
                                />
                                <button
                                    type="button"
                                    aria-label="ثبت یادداشت"
                                    onClick={handleSubmit}
                                    disabled={submitting || !description.trim() || disabled}
                                    className="absolute bottom-3 left-3 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.9)] transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                                >
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} className="-scale-x-100" />}
                                </button>
                            </div>
                        </div>
                    </m.aside>
                </m.div>
            )}
        </AnimatePresence>
    );
} 