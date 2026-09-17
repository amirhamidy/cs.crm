"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    AlarmClock, ArrowLeftCircle, ArrowRightCircle, Ban, Building2,
    CalendarDays, Clock3, History, Layers3, Loader2, MessageSquareText,
    RotateCcw, ShoppingBag, XCircle, ClipboardList, FileText, Users
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import TaskCaseDescriptionModal from "./TaskCaseDescriptionModal";
import TaskNotesModal from "./TaskNotesModal";
import TaskActionModal from "./TaskActionModal";
import SoldOrderTaskModal from "./SoldOrderTaskModal";
import TaskLogsModal from "./TaskLogsModal";
import ActionBtn from "./ActionBtn";
import { toJalali, toPersianDigits, JALALI_MONTHS, pad2 } from "@/lib/jalali";
import type { UserTask } from "./types";

const GRADIENTS = [["#6366f1", "#8b5cf6"], ["#3b82f6", "#6366f1"], ["#8b5cf6", "#ec4899"], ["#06b6d4", "#6366f1"], ["#f59e0b", "#ef4444"], ["#10b981", "#3b82f6"], ["#f472b6", "#ec4899"], ["#8b5cf6", "#f59e0b"]] as [string, string][];

function gradientForId(id: number) {
    return GRADIENTS[Math.abs(Math.trunc(id || 0)) % GRADIENTS.length];
}

function normalizeIds(value: UserTask["assigned_employee"]): number[] {
    if (value == null) return [];
    const list = Array.isArray(value) ? value : [value];
    return list.map((item) => Number(typeof item === "object" ? item.id : item)).filter(Number.isFinite);
}

interface Props {
    task: UserTask;
    accent?: string;
    isLastStage: boolean;
    onUpdated: (task: UserTask) => void;
    employeesMap?: Record<number, string>;
}

interface DeadlineResponse {
    started_at: string | null;
    deadline: string | null;
}

interface TaskWithSchedule extends UserTask {
    started_at?: string | null;
    deadline?: string | null;
    due_date?: string | null;
    customer_name?: string | null;
    customer_phone?: string | null;
}

interface LatestLog {
    id: number;
    step: number;
    step_name: string;
    employee: number[];
    action: string;
    note: string;
    created_at: string;
}

type ModalType = "next" | "prev" | "sold" | "cancel" | "unsold" | "uncancel";

const modalMeta: Record<ModalType, { title: string; desc: string }> = {
    next: { title: "انتقال به مرحله بعد", desc: "نظر و ارزیابی مشتری ثبت می‌شود و تسک جلو می‌رود" },
    prev: { title: "برگشت به مرحله قبل", desc: "تسک به مرحله قبل برمی‌گردد" },
    sold: { title: "ثبت فروش", desc: "فروش مشتری ثبت می‌شود" },
    cancel: { title: "لغو تسک", desc: "تسک لغو خواهد شد" },
    unsold: { title: "لغو فروش", desc: "وضعیت فروش بازگردانده می‌شود" },
    uncancel: { title: "بازگشت از لغو", desc: "تسک دوباره فعال می‌شود" },
};

function formatFaDate(value?: string) {
    return value ? new Date(value).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" }) : "نامشخص";
}

function formatJalali(value?: string | null) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const [jy, jm, jd] = toJalali(date.getFullYear(), date.getMonth() + 1, date.getDate()) as [number, number, number];
    return {
        full: `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)}`,
        short: `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]}`,
        time: `${toPersianDigits(pad2(date.getHours()))}:${toPersianDigits(pad2(date.getMinutes()))}`,
    };
}

function deadlineState(deadline?: string | null) {
    if (!deadline) return { label: "بدون مهلت", color: "text-gray-400", bg: "bg-gray-100", icon: Clock3 };
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff < 0) return { label: "منقضی شده", color: "text-red-500", bg: "bg-red-50", icon: AlarmClock };
    if (diff <= 86400000) return { label: "فوری", color: "text-amber-500", bg: "bg-amber-50", icon: AlarmClock };
    return { label: "در زمانبندی", color: "text-emerald-500", bg: "bg-emerald-50", icon: Clock3 };
}

function parseError(error: any) {
    const data = error?.response?.data;
    if (!data) return "خطا در ثبت تغییرات";
    if (typeof data === "string") return data;
    const first = Object.values(data)[0];
    return Array.isArray(first) ? String(first[0]) : String(first ?? "خطا در ثبت تغییرات");
}

export default function UserTaskCard({ task, accent = "#6366f1", isLastStage, onUpdated, employeesMap = {} }: Props) {
    const ext = task as TaskWithSchedule;
    const assigneeIds = useMemo(() => normalizeIds(task.assigned_employee), [task.assigned_employee]);

    const [openModal, setOpenModal] = useState<ModalType | null>(null);
    const [logsOpen, setLogsOpen] = useState(false);
    const [notesOpen, setNotesOpen] = useState(false);
    const [caseDescOpen, setCaseDescOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [blockMsg, setBlockMsg] = useState<string | null>(null);
    const [latestLog, setLatestLog] = useState<LatestLog | null>(null);
    const [customerName, setCustomerName] = useState(ext.customer_name ?? null);
    const [schedule, setSchedule] = useState<DeadlineResponse>({ started_at: ext.started_at ?? null, deadline: ext.deadline ?? ext.due_date ?? null });

    const status = task.status;
    const isActive = status === "in_progress";
    const isSold = status === "sold";
    const isCancelled = status === "cancelled";
    const deadline = formatJalali(schedule.deadline);
    const started = formatJalali(schedule.started_at);
    const dState = deadlineState(schedule.deadline);
    const DeadlineIcon = dState.icon;

    const fetchLog = useCallback(() => {
        axiosInstance.get<LatestLog[]>(`/tasks/api/v1/tasks/${task.id}/logs/`)
            .then((r) => setLatestLog(r.data?.[0] ?? null))
            .catch(() => setLatestLog(null));
    }, [task.id]);

    useEffect(() => fetchLog(), [fetchLog]);

    useEffect(() => {
        axiosInstance.get<DeadlineResponse>(`/tasks/api/v1/tasks/${task.id}/steps/${task.current_step}/deadline/`)
            .then((r) => setSchedule(r.data))
            .catch(() => undefined);
    }, [task.id, task.current_step]);

    useEffect(() => {
        if (!ext.case || customerName) return;
        axiosInstance.get(`/tasks/api/v1/cases/${ext.case}/`)
            .then(async ({ data }) => {
                if (data.customer_name) return setCustomerName(data.customer_name);
                if (data.customer) {
                    const r = await axiosInstance.get(`/customers/api/v1/customers/${data.customer}/`);
                    setCustomerName(r.data.full_name ?? r.data.name ?? null);
                }
            })
            .catch(() => undefined);
    }, [ext.case, customerName]);

    async function syncCustomer() {
        try {
            if (!ext.case) return;
            const { data } = await axiosInstance.get(`/tasks/api/v1/cases/${ext.case}/`);
            if (data.customer) await axiosInstance.patch(`/customers/api/v1/customers/${data.customer}/update/`, { status: 2 });
        } catch {
            setBlockMsg("مشتری آپدیت نشد، بعداً دستی چک کن");
        }
    }

    async function action(direction: ModalType, data: { note: string; files: File[]; score: number; score_reason: string }) {
        setSubmitting(true);
        setBlockMsg(null);

        try {
            const form = new FormData();
            if (data.note.trim()) form.append("note", data.note.trim());
            data.files.forEach((file) => form.append("files", file));

            if (["next", "prev", "cancel", "sold"].includes(direction)) {
                form.append("score", String(data.score));
                form.append("score_reason", data.score_reason);
            }

            let response;

            if (direction === "next") {
                response = await axiosInstance.post(`/tasks/api/v1/tasks/${task.id}/advance/`, form, { headers: { "Content-Type": "multipart/form-data" } });
            } else if (direction === "prev") {
                response = await axiosInstance.post(`/tasks/api/v1/tasks/${task.id}/revert/`, form, { headers: { "Content-Type": "multipart/form-data" } });
            } else if (direction === "cancel") {
                response = await axiosInstance.post(`/tasks/api/v1/tasks/${task.id}/cancel/`, form, { headers: { "Content-Type": "multipart/form-data" } });
            } else if (direction === "sold") {
                response = await axiosInstance.post(`/tasks/api/v1/tasks/${task.id}/mark-as-sold/`, form, { headers: { "Content-Type": "multipart/form-data" } });
                await syncCustomer();
            } else {
                const { data: result } = await axiosInstance.put(`/tasks/api/v1/tasks/${task.id}/update/`, {
                    title: task.title,
                    description: task.description,
                    status: "in_progress",
                    assigned_employee: task.assigned_employee,
                });
                response = { data: result };
            }

            onUpdated({ ...task, ...(response.data ?? {}) });
            fetchLog();
            setOpenModal(null);
        } catch (error) {
            setBlockMsg(parseError(error));
        } finally {
            setSubmitting(false);
        }
    }

    async function submitSale(data: {
        product_id: number;
        quantity: number;
        note: string;
        file?: File;
        started_at?: string;
        deadline?: string;
        score: number;
        score_reason: string;
    }) {
        setSubmitting(true);
        setBlockMsg(null);

        try {
            const form = new FormData();
            form.append("task_id", String(task.id));
            form.append("product_id", String(data.product_id));
            form.append("quantity", String(data.quantity));
            if (data.note) form.append("note", data.note);
            if (data.file) form.append("file", data.file);
            if (data.started_at) form.append("started_at", data.started_at);
            if (data.deadline) form.append("deadline", data.deadline);

            await axiosInstance.post("/warehouse/api/v1/order_task/create/", form, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const soldForm = new FormData();
            soldForm.append("score", String(data.score));
            soldForm.append("score_reason", data.score_reason);

            const response = await axiosInstance.post(
                `/tasks/api/v1/tasks/${task.id}/mark-as-sold/`,
                soldForm,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            await syncCustomer();
            onUpdated({ ...task, ...(response.data ?? {}), status: "sold" });
            fetchLog();
            setOpenModal(null);
        } catch (error) {
            setBlockMsg(parseError(error));
            throw error;
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <motion.div layout className="group relative flex flex-col overflow-hidden rounded-[1.6rem] border bg-white p-3.5 shadow-[0_6px_22px_rgba(15,23,42,.03)] dark:bg-[#111a2d]" style={{ borderColor: `${accent}28` }}>
                <div className="absolute inset-y-0 right-0 w-1" style={{ background: `linear-gradient(180deg,${accent},${accent}45)` }} />

                <div className="mb-2.5 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                        <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-[9.5px] font-extrabold ${dState.bg} ${dState.color}`}><DeadlineIcon size={9} />{dState.label}</span>
                        <span className={`rounded-full px-2 py-1 text-[9.5px] font-extrabold ${isSold ? "bg-amber-500/10 text-amber-500" : isCancelled ? "bg-red-500/10 text-red-500" : "bg-indigo-500/10 text-indigo-500"}`}>
                            {isSold ? "فروش رفته" : isCancelled ? "لغو شده" : "در حال انجام"}
                        </span>
                    </div>
                    <button type="button" onClick={() => setLogsOpen(true)} className="flex h-7 items-center gap-1 rounded-xl bg-gray-100 px-2 text-[9.5px] font-extrabold text-gray-400 dark:bg-white/[.05]"><History size={11} />تاریخچه</button>
                </div>

                <h3 className="line-clamp-2 text-[13.5px] font-extrabold leading-snug text-gray-900 dark:text-white">{task.title}</h3>
                {task.description && <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-gray-400">{task.description}</p>}

                <div className="mt-2.5 flex flex-col gap-1.5 rounded-2xl bg-gray-50 px-3 py-2 dark:bg-white/[.035]">
                    {customerName && <InfoRow label="مشتری" value={customerName} icon={Layers3} />}
                    {task.department_name && <InfoRow label="دپارتمان" value={task.department_name} icon={Building2} />}
                    <InfoRow label="تاریخ ثبت" value={formatFaDate(task.created_at)} icon={CalendarDays} />
                </div>

                {assigneeIds.length > 0 && (
                    <div className="mt-2.5 rounded-2xl bg-indigo-500/[.035] p-2.5">
                        <div className="mb-1.5 flex items-center gap-1.5 text-[9.5px] font-extrabold text-gray-400">
                            <Users size={11} className="text-indigo-400" />
                            همکاران این تسک
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {assigneeIds.map((id) => {
                                const name = employeesMap[id] ?? `کارمند ${toPersianDigits(id)}`;
                                const gradient = gradientForId(id);
                                return (
                                    <div key={id} className="flex items-center gap-1.5 rounded-full border border-black/[.04] bg-white px-2 py-1 dark:border-white/[.06] dark:bg-white/[.05]">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-extrabold text-white" style={{ background: `linear-gradient(135deg,${gradient[0]},${gradient[1]})` }}>{name.trim().charAt(0)}</span>
                                        <span className="text-[9.5px] font-bold text-gray-600 dark:text-gray-300">{name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="mt-2.5">
                    {deadline ? (
                        <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-2 dark:bg-white/[.035]">
                            <div className="flex items-center gap-2 text-gray-500">
                                <CalendarDays size={12} />
                                <div><p className="text-[9px]">مهلت انجام</p><p className={`text-[10.5px] font-extrabold ${dState.color}`}>{deadline.full} · {deadline.time}</p></div>
                            </div>
                            {started && <div className="border-r border-gray-200 pr-2 text-left dark:border-white/[.08]"><p className="text-[8.5px] text-gray-400">شروع</p><p className="text-[9.5px] font-bold text-gray-500">{started.short}</p></div>}
                        </div>
                    ) : <div className="flex items-center gap-1.5 text-[10px] text-gray-400"><CalendarDays size={11} />ایجاد: {formatFaDate(task.created_at)}</div>}
                </div>

                {blockMsg && <div className="mt-2 rounded-xl bg-red-500/10 px-3 py-2 text-center text-[10px] font-bold text-red-500">{blockMsg}</div>}

                <div className="mt-2.5 flex gap-1.5">
                    <button type="button" onClick={() => setCaseDescOpen(true)} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-xl bg-gray-100 text-[9.5px] font-extrabold text-gray-500 dark:bg-white/[.05]"><FileText size={11} />پرونده</button>
                    <button type="button" onClick={() => setNotesOpen(true)} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-xl bg-indigo-500/10 text-[9.5px] font-extrabold text-indigo-500"><MessageSquareText size={11} />یادداشت‌ها</button>
                </div>

                <div className="mt-2.5 border-t border-gray-100 pt-2.5 dark:border-white/[.06]">
                    {isCancelled ? (
                        <ActionBtn rippleKey={`uncancel-${task.id}`} active={false} onClick={() => setOpenModal("uncancel")} color="red" icon={<RotateCcw size={13} />} label="بازگشت از لغو" full />
                    ) : isSold ? (
                        <ActionBtn rippleKey={`unsold-${task.id}`} active={false} onClick={() => setOpenModal("unsold")} color="amber" icon={<RotateCcw size={13} />} label="لغو فروش" full />
                    ) : isActive ? (
                        <>
                            <ActionBtn rippleKey={`next-${task.id}`} active={false} onClick={() => setOpenModal("next")} color="accent" accentColor={accent} icon={<ArrowLeftCircle size={13} />} label={isLastStage ? "ثبت نظر و تکمیل" : "انتقال به مرحله بعد"} full />
                            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                                <ActionBtn rippleKey={`prev-${task.id}`} active={false} onClick={() => setOpenModal("prev")} color="pink" icon={<ArrowRightCircle size={13} />} label="مرحله قبل" full />
                                <ActionBtn rippleKey={`sold-${task.id}`} active={false} onClick={() => setOpenModal("sold")} color="amber" icon={<ShoppingBag size={13} />} label="فروش" full />
                            </div>
                            <ActionBtn rippleKey={`cancel-${task.id}`} active={false} onClick={() => setOpenModal("cancel")} color="red" icon={<XCircle size={13} />} label="لغو تسک" full />
                        </>
                    ) : null}
                </div>
            </motion.div>

            {(Object.keys(modalMeta) as ModalType[]).filter((direction) => direction !== "sold").map((direction) => {
                const meta = modalMeta[direction];
                const finalTitle = direction === "next" && isLastStage ? "تکمیل تسک" : meta.title;
                return (
                    <TaskActionModal
                        key={direction}
                        isOpen={openModal === direction}
                        onClose={() => setOpenModal(null)}
                        direction={direction}
                        title={finalTitle}
                        description={direction === "next" && isLastStage ? "قبل از تکمیل، امتیاز و نظر شما درباره مشتری ثبت می‌شود" : meta.desc}
                        onSubmit={(data) => action(direction, data)}
                        submitting={submitting}
                    />
                );
            })}

            <SoldOrderTaskModal
                isOpen={openModal === "sold"}
                onClose={() => setOpenModal(null)}
                taskId={task.id}
                onSubmit={submitSale}
                submitting={submitting}
            />

            <TaskLogsModal isOpen={logsOpen} onClose={() => setLogsOpen(false)} taskId={task.id} taskTitle={task.title} />
            <TaskNotesModal isOpen={notesOpen} onClose={() => setNotesOpen(false)} taskId={task.id} taskTitle={task.title} />
            <TaskCaseDescriptionModal isOpen={caseDescOpen} onClose={() => setCaseDescOpen(false)} caseId={ext.case} taskTitle={task.title} />
        </>
    );
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ComponentType<{ size?: number; className?: string }> }) {
    return (
        <div className="flex items-center gap-1.5 text-[10px]">
            {Icon && <Icon size={11} className="text-gray-400" />}
            <span className="font-semibold text-gray-400">{label}:</span>
            <span className="truncate font-bold text-gray-700 dark:text-white/80">{value}</span>
        </div>
    );
}