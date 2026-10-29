"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m, MotionConfig } from "framer-motion";
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
const dayFmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric" });
const weekdayFmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { weekday: "long" });
const monthYearFmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "long", year: "numeric" });
const eventDateFmt = new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
const jalaliPartsFmt = new Intl.DateTimeFormat("en-US-u-ca-persian", { year: "numeric", month: "numeric", day: "numeric" });
const formatEventDate = (value?: string) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : eventDateFmt.format(date);
};
const getJalaliParts = (date: Date) => {
    const parts = jalaliPartsFmt.formatToParts(date);
    return [Number(parts.find((p) => p.type === "year")?.value), Number(parts.find((p) => p.type === "month")?.value), Number(parts.find((p) => p.type === "day")?.value)];
};
export const IRAN_HOLIDAYS_1405 = new Set([
    "1-1", "1-2", "1-3", "1-4", "1-12", "1-13", "1-25", "3-3", "3-6", "3-14", "3-15", "4-3", "4-4", "5-13", "5-21", "5-22", "5-30", "6-8", "8-22", "10-2", "10-16", "11-4", "11-22", "12-9", "12-19", "12-20", "12-29",
]);
export const isFriday = (date: Date) => date.getDay() === 5;
const isIranHoliday = (date: Date) => {
    const [year, month, day] = getJalaliParts(date);
    return year === 1405 && IRAN_HOLIDAYS_1405.has(`${month}-${day}`);
};
const EVENT_TYPE_LABEL: Record<string, string> = {
    meeting: "جلسه", task: "وظیفه", tasks: "وظیفه", internal_task: "وظیفه درون سازمانی", "internal-task": "وظیفه درون سازمانی", internal_task_routine: "وظیفه درون سازمانی", reminder: "یادآور", deadline: "مهلت", note: "یادداشت", notes: "یادداشت",
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
function PersonAvatar({ name, id }: { name: string; id: number }) {
    const hue = (Math.abs(id) * 53) % 360;
    return <span title={name} className="flex h-7 w-7 select-none items-center justify-center rounded-full border-2 border-white text-[10px] font-extrabold text-white dark:border-slate-900" style={{ background: `linear-gradient(135deg, oklch(55% 0.18 ${hue}), oklch(45% 0.22 ${(hue + 30) % 360}))` }}>{name.trim().charAt(0) || "؟"}</span>;
}
const EMPTY_BOX = "rounded-2xl border border-dashed border-slate-300/70 bg-white/45 px-5 py-7 text-center text-[11px] font-semibold text-gray-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400";
function DayPanel({ onClose, selectedDate, notes, events, onCreated, onDeleted }: Omit<Props, "isOpen" | "selectedDate"> & { selectedDate: Date }) {
    const userId = useAuthStore((state) => state.userId);
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [error, setError] = useState("");
    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; });
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onCloseRef.current(); };
        document.addEventListener("keydown", onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previousOverflow; };
    }, []);
    const selectedKey = toDateKey(selectedDate);
    const todayKey = toDateKey(new Date());
    const isPast = selectedKey < todayKey;
    const canWrite = selectedKey === todayKey;
    const dayNotes = useMemo(() => notes.filter((n) => getNoteDate(n) === selectedKey), [notes, selectedKey]);
    const dayEvents = useMemo(() => events.filter((e) => isEventOnDate(e, selectedKey)).sort((a, b) => a.start.localeCompare(b.start)), [events, selectedKey]);
    const friday = isFriday(selectedDate);
    const officialHoliday = useMemo(() => !friday && isIranHoliday(selectedDate), [friday, selectedDate]);
    const holiday = friday || officialHoliday;
    const holidayText = friday ? "جمعه" : officialHoliday ? "تعطیل رسمی" : "";
    const nowMs = Date.now();
    const placeholder = isPast ? "برای روزهای گذشته امکان ثبت یادداشت وجود ندارد" : canWrite ? "یادداشت امروز را بنویسید..." : "یادداشت فقط برای امروز قابل ثبت است";
    const handleSubmit = async () => {
        if (!description.trim() || !userId || submitting || !canWrite) return;
        setSubmitting(true);
        setError("");
        try {
            const { data } = await axiosInstance.post<CalendarNote>("/note/api/v1/create/", { user: Number(userId), description: description.trim() });
            onCreated(data);
            setDescription("");
        } catch (err) {
            console.error(err);
            setError("ثبت یادداشت با خطا مواجه شد");
        } finally { setSubmitting(false); }
    };
    const handleDelete = async (id: number) => {
        setDeletingId(id);
        setError("");
        try {
            await axiosInstance.delete(`/note/api/v1/${id}/delete/`);
            onDeleted(id);
        } catch (err) {
            console.error(err);
            setError("حذف یادداشت با خطا مواجه شد");
        } finally { setDeletingId(null); }
    };
    return (
        <MotionConfig reducedMotion="user">
            <m.div role="dialog" aria-modal="true" aria-label="جزئیات روز" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} onClick={onClose} className="fixed inset-0 z-[120] flex items-stretch justify-start bg-slate-950/45 p-2 sm:p-4">
                <m.aside dir="rtl" initial={{ x: -56, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -56, opacity: 0 }} transition={{ type: "spring", damping: 30, stiffness: 340 }} onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-[30rem] flex-col overflow-hidden rounded-[2rem] border border-slate-300/60 bg-[#f7faff]/95 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/95">
                    <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 px-6 pb-6 pt-5 text-white">
                        <span aria-hidden className="pointer-events-none absolute -left-4 top-6 select-none text-[150px] font-black leading-none text-white/10">{dayFmt.format(selectedDate)}</span>
                        <div className="relative flex items-start justify-between">
                            <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10.5px] font-bold"><CalendarDays size={12} />جزئیات روز</div>
                            <button type="button" onClick={onClose} aria-label="بستن" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"><X size={16} /></button>
                        </div>
                        <div className="relative mt-5 flex items-end gap-4">
                            <span className="text-[56px] font-black leading-none tracking-tight">{dayFmt.format(selectedDate)}</span>
                            <div className="pb-1.5"><p className="text-[15px] font-extrabold">{weekdayFmt.format(selectedDate)}</p><p className="mt-0.5 text-[12px] font-semibold text-white/80">{monthYearFmt.format(selectedDate)}</p></div>
                        </div>
                        <div className="relative mt-4 flex flex-wrap gap-2">
                            {holiday && <span className="rounded-lg bg-rose-500/90 px-2.5 py-1 text-[10.5px] font-bold">{holidayText}</span>}
                            <span className="rounded-lg bg-white/15 px-2.5 py-1 text-[10.5px] font-bold">{dayEvents.length.toLocaleString("fa-IR")} رویداد</span>
                            <span className="rounded-lg bg-white/15 px-2.5 py-1 text-[10.5px] font-bold">{dayNotes.length.toLocaleString("fa-IR")} یادداشت</span>
                        </div>
                    </div>
                    <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
                        <section className="space-y-3">
                            <h4 className="text-[12.5px] font-extrabold text-gray-800 dark:text-gray-100">برنامه این روز</h4>
                            {dayEvents.length === 0 ? <div className={EMPTY_BOX}>برای این روز رویدادی ثبت نشده</div> : dayEvents.map((event, i) => {
                                const style = getTypeStyle(event.type);
                                const assigned = event.people?.assigned_employee ?? [];
                                const creator = event.people?.created_by;
                                const startMs = new Date(event.start).getTime();
                                const endMs = new Date(event.end || event.start).getTime();
                                const ongoing = !Number.isNaN(startMs) && !Number.isNaN(endMs) && startMs <= nowMs && nowMs <= endMs;
                                return <m.div key={`${event.type}-${event.id}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + Math.min(i, 8) * 0.05, duration: 0.25, ease: "easeOut" }} className="relative overflow-hidden rounded-2xl border border-slate-300/45 bg-white/60 p-4 pr-5 dark:border-white/[0.06] dark:bg-white/[0.04]">
                                    <span className={`absolute inset-y-3 right-0 w-1 rounded-full ${style.bar}`} />
                                    <p className="break-words text-[13px] font-extrabold text-gray-800 dark:text-gray-100">{event.title}</p>
                                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                        <span className={`flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold ${style.bg} ${style.text} ${style.border}`}><Tag size={10} />{getTypeLabel(event.type)}</span>
                                        {ongoing && <span className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />در جریان</span>}
                                        <span className="rounded-lg bg-black/5 px-2 py-0.5 text-[9.5px] font-bold text-gray-500 dark:bg-white/5 dark:text-gray-400">#{event.id}</span>
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        {[["شروع", event.start], ["پایان", event.end]].map(([label, value]) => <div key={label} className="flex items-center gap-2 rounded-xl bg-black/[0.04] px-2.5 py-2 dark:bg-white/[0.04]"><Clock3 size={12} className="shrink-0 text-indigo-500" /><div className="min-w-0"><p className="text-[9px] font-bold text-gray-500 dark:text-gray-400">{label}</p><p className="truncate text-[10.5px] font-bold text-gray-700 dark:text-gray-300">{formatEventDate(value)}</p></div></div>)}
                                    </div>
                                    {(assigned.length > 0 || creator) && <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                        {assigned.length > 0 && <div className="flex items-center gap-2"><div className="flex -space-x-2 space-x-reverse">{assigned.slice(0, 5).map((person) => <PersonAvatar key={person.id} name={person.full_name} id={person.id} />)}{assigned.length > 5 && <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-[9px] font-bold text-gray-600 dark:border-slate-900 dark:bg-slate-700 dark:text-gray-200">+{(assigned.length - 5).toLocaleString("fa-IR")}</span>}</div><span className="max-w-[10rem] truncate text-[10.5px] font-bold text-gray-600 dark:text-gray-400">{assigned.map((person) => person.full_name).join("، ")}</span></div>}
                                        {creator && <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400"><UserRound size={11} />ایجاد: <span className="text-gray-700 dark:text-gray-300">{creator.full_name}</span></span>}
                                    </div>}
                                </m.div>;
                            })}
                        </section>
                        <section className="space-y-3">
                            <h4 className="flex items-center gap-1.5 text-[12.5px] font-extrabold text-gray-800 dark:text-gray-100"><StickyNote size={13} className="text-emerald-500" />یادداشت‌ها</h4>
                            {dayNotes.length === 0 ? <div className={EMPTY_BOX}>هنوز یادداشتی برای این روز نوشته نشده</div> : <AnimatePresence initial={false} mode="popLayout">{dayNotes.map((note) => <m.div key={note.id} initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: -24, scale: 0.97 }} transition={{ duration: 0.2 }} className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.06] p-4">
                                <div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="whitespace-pre-wrap break-words text-[12px] font-semibold leading-7 text-gray-700 dark:text-gray-200">{note.description}</p>{note.created_at && <p className="mt-2 text-[9.5px] font-medium text-gray-500 dark:text-gray-400">{formatEventDate(note.created_at)}</p>}</div>
                                    <button type="button" aria-label="حذف یادداشت" onClick={() => handleDelete(note.id)} disabled={deletingId === note.id} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-rose-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 disabled:opacity-50">{deletingId === note.id ? <Loader2 size={15} className="animate-spin text-rose-500" /> : <Trash2 size={15} className="text-rose-500" />}</button>
                                </div>
                            </m.div>)}</AnimatePresence>}
                        </section>
                    </div>
                    <div className="shrink-0 border-t border-slate-300/50 bg-white/65 p-4 dark:border-white/5 dark:bg-white/[0.03]">
                        {error && <p className="mb-2 text-[11.5px] font-semibold text-red-500">{error}</p>}
                        <div className="relative">
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit(); }} placeholder={placeholder} rows={3} disabled={!canWrite} className="w-full resize-none rounded-2xl border border-slate-300/70 bg-white/80 py-3 pl-16 pr-4 text-[12.5px] leading-7 text-gray-800 outline-none transition placeholder:text-gray-500 focus:border-indigo-500/60 focus:ring-4 focus:ring-indigo-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-100 dark:placeholder:text-gray-500" />
                            <button type="button" aria-label="ثبت یادداشت" onClick={handleSubmit} disabled={submitting || !description.trim() || !canWrite} className="absolute bottom-3 left-3 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100">{submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} className="-scale-x-100" />}</button>
                        </div>
                    </div>
                </m.aside>
            </m.div>
        </MotionConfig>
    );
}
export default function CalendarNoteModal({ isOpen, selectedDate, ...rest }: Props) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    return createPortal(<AnimatePresence>{isOpen && selectedDate && <DayPanel key="day-panel" selectedDate={selectedDate} {...rest} />}</AnimatePresence>, document.body);
}
