"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeftCircle,
    ArrowRightCircle,
    Layers3,
    ShoppingBag,
    XCircle,
    CalendarDays,
    Building2,
    CheckCircle2,
    Ban,
    RotateCcw,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import TaskActionModal from "./TaskActionModal";
import type { UserTask } from "./types";

interface TaskCardProps {
    task: UserTask;
    accent?: string;
    onUpdated: (task: UserTask) => void;
    isDragging?: boolean;
}

function formatFaDate(date?: string) {
    if (!date) return "نامشخص";
    return new Date(date).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function getStatusMeta(status: string) {
    switch (status) {
        case "completed":
            return { label: "تکمیل شده", color: "text-emerald-500", bg: "bg-emerald-500/10", dot: "bg-emerald-500", icon: CheckCircle2 };
        case "sold":
            return { label: "فروش رفته", color: "text-amber-500", bg: "bg-amber-500/10", dot: "bg-amber-500", icon: ShoppingBag };
        case "cancelled":
            return { label: "لغو شده", color: "text-red-500", bg: "bg-red-500/10", dot: "bg-red-500", icon: Ban };
        default:
            return { label: "در حال انجام", color: "text-indigo-500", bg: "bg-indigo-500/10", dot: "bg-indigo-500", icon: Layers3 };
    }
}

type ModalType = "next" | "prev" | "sold" | "cancel" | "unsold" | "uncancel" | "uncomplete";

const modalMetaMap: Record<ModalType, { title: string; desc: string }> = {
    next: { title: "ارسال به مرحله بعد", desc: "تسک به مرحله بعدی منتقل می‌شود" },
    prev: { title: "برگشت به مرحله قبل", desc: "تسک به مرحله قبلی برمی‌گردد" },
    sold: { title: "ثبت فروش", desc: "این تسک به عنوان فروش رفته ثبت می‌شود" },
    cancel: { title: "لغو تسک", desc: "این تسک لغو خواهد شد" },
    unsold: { title: "لغو فروش", desc: "وضعیت تسک به در حال انجام برمی‌گردد" },
    uncancel: { title: "بازگشت از لغو", desc: "وضعیت تسک به در حال انجام برمی‌گردد" },
    uncomplete: { title: "بازگشت از تکمیل", desc: "وضعیت تسک به در حال انجام برمی‌گردد" },
};

const blockedMessage: Record<string, string> = {
    sold: "تسک فروش رفته — برای جابجایی ابتدا فروش را لغو کنید",
};

export default function UserTaskCard({ task, accent = "#6366f1", onUpdated, isDragging }: TaskCardProps) {
    const [openModal, setOpenModal] = useState<ModalType | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [blockMsg, setBlockMsg] = useState<string | null>(null);

    const meta = useMemo(() => getStatusMeta(task.status), [task.status]);
    const isSold = task.status === "sold";
    const isCancelled = task.status === "cancelled";
    const isCompleted = task.status === "completed";
    const isActive = task.status === "in_progress";
    const StatusIcon = meta.icon;

    async function submitAction(direction: ModalType, data: { note: string; files: File[] }) {
        setSubmitting(true);
        try {
            let updated: UserTask;

            if (direction === "sold" || direction === "unsold") {
                const res = await axiosInstance.patch<{ status: string }>(
                    `/tasks/api/v1/tasks/${task.id}/mark-as-sold/`
                );
                updated = { ...task, status: res.data.status as UserTask["status"] };
            } else if (direction === "uncancel" || direction === "uncomplete") {
                const res = await axiosInstance.put<UserTask>(
                    `/tasks/api/v1/tasks/${task.id}/update/`,
                    {
                        title: task.title,
                        description: task.description,
                        status: "in_progress",
                        assigned_employee: task.assigned_employee,
                    }
                );
                updated = { ...task, ...res.data };
            } else {
                const endpointMap = { next: "advance", prev: "revert", cancel: "cancel" } as const;
                const formData = new FormData();
                if (data.note.trim()) formData.append("note", data.note.trim());
                data.files.forEach((f) => formData.append("files", f));
                const res = await axiosInstance.post<UserTask>(
                    `/tasks/api/v1/tasks/${task.id}/${endpointMap[direction]}/`,
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );
                updated = { ...task, ...res.data };
            }

            onUpdated(updated);
            setOpenModal(null);
        } finally {
            setSubmitting(false);
        }
    }
    function handleBlockedClick() {
        const msg = blockedMessage[task.status];
        if (msg) {
            setBlockMsg(msg);
            setTimeout(() => setBlockMsg(null), 3000);
        }
    }

    return (
        <>
            <motion.div
                layout
                className="group relative flex flex-col gap-0 overflow-hidden rounded-3xl select-none"
                style={{
                    opacity: isDragging ? 0.35 : 1,
                    background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    boxShadow: isDragging
                        ? `0 20px 60px rgba(0,0,0,0.4), 0 0 0 2px ${accent}60`
                        : "0 1px 3px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)",
                }}
            >
                <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}80)` }} />

                <div className="flex flex-col gap-3.5 p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-1 rounded-lg ${meta.bg} ${meta.color}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                                    {meta.label}
                                </span>
                                <span className="text-[10.5px] font-bold px-2 py-1 rounded-lg bg-white/5 text-gray-500">
                                    #{task.id}
                                </span>
                            </div>
                            <h3 className="text-[13.5px] font-extrabold text-gray-900 dark:text-white leading-snug line-clamp-2">
                                {task.title}
                            </h3>
                        </div>
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accent}18` }}>
                            <StatusIcon size={17} style={{ color: accent }} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <InfoCell icon={<Building2 size={11} />} label="دپارتمان" value={task.department_name || "نامشخص"} accent={accent} />
                        <InfoCell icon={<Layers3 size={11} />} label="مرحله" value={task.current_step_name || "نامشخص"} accent={accent} />
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-600">
                        <CalendarDays size={11} />
                        <span>{formatFaDate(task.created_at)}</span>
                    </div>

                    {blockMsg && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-[11px] font-bold text-center py-2 px-3 rounded-xl bg-orange-500/10 text-orange-400"
                        >
                            {blockMsg}
                        </motion.div>
                    )}

                    <div
                        className="flex items-center gap-1.5 pt-1 border-t border-white/5"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        {isCancelled ? (
                            <button
                                type="button"
                                onClick={() => setOpenModal("uncancel")}
                                className="h-8 flex-1 rounded-xl flex items-center justify-center gap-1.5 text-[11.5px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                            >
                                <RotateCcw size={13} />
                                بازگشت از لغو
                            </button>
                        ) : isCompleted ? (
                            <button
                                type="button"
                                onClick={() => setOpenModal("uncomplete")}
                                className="h-8 flex-1 rounded-xl flex items-center justify-center gap-1.5 text-[11.5px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                            >
                                <RotateCcw size={13} />
                                بازگشت از تکمیل
                            </button>
                        ) : isSold ? (
                            <div className="flex items-center gap-1.5 w-full">
                                <button
                                    type="button"
                                    onClick={handleBlockedClick}
                                    className="h-8 w-8 rounded-xl flex items-center justify-center text-pink-500/40 bg-pink-500/5 cursor-not-allowed flex-shrink-0"
                                >
                                    <ArrowRightCircle size={13} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOpenModal("unsold")}
                                    className="h-8 flex-1 rounded-xl flex items-center justify-center gap-1.5 text-[11.5px] font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                                >
                                    <XCircle size={13} />
                                    لغو فروش
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBlockedClick}
                                    className="h-8 w-8 rounded-xl flex items-center justify-center text-indigo-500/40 bg-indigo-500/5 cursor-not-allowed flex-shrink-0"
                                >
                                    <ArrowLeftCircle size={13} />
                                </button>
                            </div>
                        ) : isActive ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setOpenModal("prev")}
                                    className="h-8 flex-1 rounded-xl flex items-center justify-center gap-1.5 text-[11.5px] font-bold text-pink-500 bg-pink-500/10 hover:bg-pink-500/20 transition-colors"
                                >
                                    <ArrowRightCircle size={13} />
                                    قبل
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOpenModal("cancel")}
                                    className="h-8 w-8 rounded-xl flex items-center justify-center text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors flex-shrink-0"
                                    title="لغو تسک"
                                >
                                    <XCircle size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOpenModal("sold")}
                                    className="h-8 w-8 rounded-xl flex items-center justify-center text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 transition-colors flex-shrink-0"
                                    title="ثبت فروش"
                                >
                                    <ShoppingBag size={13} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOpenModal("next")}
                                    className="h-8 flex-1 rounded-xl flex items-center justify-center gap-1.5 text-[11.5px] font-bold text-white transition-opacity hover:opacity-90"
                                    style={{
                                        background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                                        boxShadow: `0 4px 12px ${accent}35`,
                                    }}
                                >
                                    <ArrowLeftCircle size={13} />
                                    بعد
                                </button>
                            </>
                        ) : null}
                    </div>
                </div>
            </motion.div>

            {(["next", "prev", "sold", "cancel", "unsold", "uncancel", "uncomplete"] as const).map((dir) => (
                <TaskActionModal
                    key={dir}
                    isOpen={openModal === dir}
                    onClose={() => setOpenModal(null)}
                    direction={dir}
                    title={modalMetaMap[dir].title}
                    description={modalMetaMap[dir].desc}
                    onSubmit={(data) => submitAction(dir, data)}
                    submitting={submitting}
                />
            ))}
        </>
    );
}

function InfoCell({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
    return (
        <div className="rounded-2xl p-2.5 bg-white/[0.03] border border-white/[0.05]">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1">{icon}{label}</div>
            <p className="text-[12px] font-bold text-gray-800 dark:text-gray-100 truncate">{value}</p>
        </div>
    );
}
