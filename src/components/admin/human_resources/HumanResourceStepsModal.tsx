"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GitBranch, Loader2, Plus, X } from "lucide-react";
import HumanResourceStepRoadmap from "./HumanResourceStepRoadmap";
import { HumanResource, HumanResourceStep, createStep, deleteStep, getDocumentSteps, updateStep } from "./humanResourceApi";

interface Props {
    open: boolean;
    document: HumanResource | null;
    canManage: boolean;
    onClose: () => void;
    onChange: () => void;
}

const byOrder = (a: HumanResourceStep, b: HumanResourceStep) => a.order - b.order;

export default function HumanResourceStepsModal({ open, document, canManage, onClose, onChange }: Props) {
    const [steps, setSteps] = useState<HumanResourceStep[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingInlineId, setEditingInlineId] = useState<number | null>(null);
    const [title, setTitle] = useState("");

    const loadSteps = async () => {
        if (!document) return;
        try {
            setLoading(true);
            setSteps((await getDocumentSteps(document.id)).data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && document) loadSteps();
    }, [open, document]);

    const refresh = async () => {
        await loadSteps();
        onChange();
    };

    const saveStep = async () => {
        if (!document || !title.trim()) return;
        try {
            setSaving(true);
            const order = steps.length ? Math.max(...steps.map((s) => s.order)) + 1 : 1;
            await createStep(document.id, { order, title: title.trim() });
            setTitle("");
            await refresh();
        } finally {
            setSaving(false);
        }
    };

    const handleInlineEdit = async (id: number, newTitle: string) => {
        try {
            setEditingInlineId(id);
            await updateStep(id, { order: steps.find((s) => s.id === id)?.order ?? 1, title: newTitle });
            await refresh();
        } finally {
            setEditingInlineId(null);
        }
    };

    const removeStep = async (id: number) => {
        if (!document || !confirm("آیا از حذف این مرحله مطمئن هستید؟")) return;
        await deleteStep(id);
        const remaining = (await getDocumentSteps(document.id)).data.slice().sort(byOrder);
        await Promise.all(
            remaining
                .map((s, i) => (s.order !== i + 1 ? updateStep(s.id, { order: i + 1, title: s.title }) : null))
                .filter(Boolean)
        );
        await refresh();
    };

    const orderedSteps = useMemo(() => steps.slice().sort(byOrder), [steps]);

    if (!open || !document) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
                onMouseDown={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, y: 18, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 18, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-2xl shadow-black/10 dark:border-white/[0.06] dark:bg-[#0f172a]"
                    dir="rtl"
                >
                    <div className="flex shrink-0 items-center justify-between px-7 pb-5 pt-7 sm:px-8">
                        <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
                                <GitBranch size={15} className="text-indigo-500" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h2 className="truncate text-[14px] font-extrabold text-gray-900 dark:text-white">مراحل {document.title}</h2>
                                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 px-1.5 text-[9.5px] font-extrabold text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                                        {steps.length}
                                    </span>
                                </div>
                                <p className="mt-0.5 text-[11px] text-gray-400">مسیر انجام فرآیند</p>
                            </div>
                        </div>
                        <button type="button" onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition hover:text-gray-600 dark:bg-white/[0.05] dark:hover:text-gray-300">
                            <X size={15} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-7 pb-7 sm:px-8">
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.4fr]">
                            <div className="order-1 lg:order-2">
                                <div className="mb-3 flex items-center gap-2">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 dark:bg-white/[0.04]">
                                        <GitBranch size={13} className="text-gray-400" />
                                    </span>
                                    <div>
                                        <p className="text-[11.5px] font-extrabold text-gray-800 dark:text-white">نقشه سفر</p>
                                        <p className="text-[9.5px] font-semibold text-gray-400">
                                            {steps.length ? `${steps.length} ایستگاه` : "بدون ایستگاه"}
                                        </p>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="flex h-44 items-center justify-center rounded-[1.5rem] border border-dashed border-gray-200 dark:border-white/[0.07]">
                                        <Loader2 size={19} className="animate-spin text-indigo-500" />
                                    </div>
                                ) : (
                                    <HumanResourceStepRoadmap steps={steps} canManage={canManage} onEdit={handleInlineEdit} onDelete={removeStep} savingId={editingInlineId} />
                                )}
                            </div>

                            <div className="order-2 lg:order-1">
                                {canManage && (
                                    <div className="rounded-[1.4rem] border border-indigo-100 bg-indigo-50/50 p-3 dark:border-indigo-500/10 dark:bg-indigo-500/[0.05]">
                                        <div className="mb-2.5 flex items-center gap-2.5 px-1">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-white/[0.06]">
                                                <Plus size={14} className="text-indigo-500" />
                                            </span>
                                            <div>
                                                <p className="text-[11.5px] font-extrabold text-gray-800 dark:text-white">افزودن مرحله</p>
                                                <p className="text-[9.5px] font-semibold text-gray-400">عنوان مرحله فرآیند را وارد کنید</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <input
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && saveStep()}
                                                placeholder="عنوان مرحله..."
                                                className="h-10 w-full rounded-xl border border-gray-100 bg-white px-3.5 text-[11.5px] font-bold text-gray-800 outline-none transition focus:border-indigo-400 dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={saveStep}
                                                disabled={saving || !title.trim()}
                                                className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-[11px] font-extrabold text-white transition hover:bg-indigo-500 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                                                افزودن مرحله
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {canManage && orderedSteps.length > 0 && (
                                    <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-gray-100 dark:border-white/[0.06]">
                                        <div className="border-b border-gray-100 bg-gray-50/70 px-3 py-2 dark:border-white/[0.06] dark:bg-white/[0.025]">
                                            <p className="text-[10.5px] font-extrabold text-gray-500 dark:text-gray-400">لیست مراحل</p>
                                        </div>
                                        <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                            {orderedSteps.map((step, i) => (
                                                <div key={step.id} data-aos="fade-left" data-aos-delay={i * 40} className="flex items-center gap-2.5 px-3 py-2.5">
                                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-[10px] font-extrabold text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                                                        {step.order}
                                                    </span>
                                                    <span className="min-w-0 flex-1 truncate text-[11.5px] font-bold text-gray-700 dark:text-gray-300">{step.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!canManage && !loading && orderedSteps.length === 0 && (
                                    <div className="flex h-full min-h-[200px] items-center justify-center rounded-[1.4rem] border border-dashed border-gray-200 text-center dark:border-white/[0.07]">
                                        <p className="text-[11px] font-semibold text-gray-400">هنوز مرحله‌ای ثبت نشده است</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}