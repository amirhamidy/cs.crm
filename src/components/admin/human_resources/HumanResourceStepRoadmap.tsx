"use client";

import {
    Check, Flag, MapPin, Sparkles, Compass, Milestone, Pencil, Trash2, X, Loader2,
} from "lucide-react";
import { useState } from "react";
import { HumanResourceStep } from "./humanResourceApi";

interface Props {
    steps: HumanResourceStep[];
    canManage?: boolean;
    onEdit?: (id: number, title: string) => Promise<void>;
    onDelete?: (id: number) => void;
    savingId?: number | null;
}

const gradients = [
    "from-indigo-500 to-violet-500",
    "from-cyan-500 to-blue-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-pink-500 to-fuchsia-500",
    "from-rose-500 to-red-500",
];

export default function HumanResourceStepRoadmap({
    steps,
    canManage = false,
    onEdit,
    onDelete,
    savingId = null,
}: Props) {
    const orderedSteps = [...steps].sort((a, b) => a.order - b.order);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draft, setDraft] = useState("");

    if (!orderedSteps.length) {
        return (
            <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-gray-200 py-12 text-center dark:border-white/[0.07]">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10">
                    <Compass size={19} className="text-indigo-400" />
                </div>
                <p className="text-[12px] font-extrabold text-gray-800 dark:text-white">
                    نقشه سفر خالی است
                </p>
                <p className="mt-1.5 max-w-xs text-[10.5px] font-semibold leading-5 text-gray-400">
                    با افزودن مرحله، مسیر سفر این منبع انسانی ترسیم می‌شود.
                </p>
            </div>
        );
    }

    const total = orderedSteps.length;

    const startEdit = (step: HumanResourceStep) => {
        setEditingId(step.id);
        setDraft(step.title);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setDraft("");
    };

    const commitEdit = async (step: HumanResourceStep) => {
        const trimmed = draft.trim();
        if (!trimmed || trimmed === step.title) {
            cancelEdit();
            return;
        }
        await onEdit?.(step.id, trimmed);
        cancelEdit();
    };

    return (
        <div
            className="relative overflow-hidden rounded-[1.6rem] border border-gray-100 bg-gradient-to-b from-slate-50 via-white to-indigo-50/40 px-4 py-8 dark:border-white/[0.06] dark:from-[#0b1220] dark:via-[#0f172a] dark:to-indigo-950/20"
            dir="rtl"
        >
            <div className="pointer-events-none absolute -right-20 top-10 h-56 w-56 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-500/10" />
            <div className="pointer-events-none absolute -left-20 bottom-10 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-500/10" />

            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <span className="comet-star comet-star-1" />
                <span className="comet-star comet-star-2" />
                <span className="comet-star comet-star-3" />
                <span className="comet-star comet-star-4" />
                <span className="comet-star comet-star-5" />
                <span className="comet-star comet-star-6" />
                <span className="comet-star comet-star-7" />
                <span className="comet-star comet-star-8" />
            </div>

            <div
                data-aos="fade-down"
                className="relative z-10 mb-6 flex items-center justify-center gap-2"
            >
                <span className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-[10px] font-extrabold text-indigo-500 shadow-sm backdrop-blur dark:border-indigo-500/20 dark:bg-white/[0.04] dark:text-indigo-400">
                    <MapPin size={11} />
                    شروع سفر
                </span>
                <span className="text-[10px] font-bold text-gray-400">
                    {total} ایستگاه تا مقصد
                </span>
            </div>

            <div className="relative z-10 mx-auto w-full max-w-md">
                <div className="absolute inset-0 flex justify-center">
                    <svg
                        viewBox="0 0 200 100"
                        preserveAspectRatio="none"
                        className="h-full w-full"
                        aria-hidden
                    >
                        <defs>
                            <linearGradient id="roadGrad" x1="0" y1="1" x2="0" y2="0">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="50%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M 100 100 C 40 88, 160 76, 100 62 C 40 48, 160 36, 100 22 C 60 12, 100 6, 100 2"
                            fill="none"
                            stroke="url(#roadGrad)"
                            strokeWidth="1"
                            strokeDasharray="3 3"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>
                </div>

                <div className="relative flex flex-col gap-10">
                    {orderedSteps.map((step, index) => {
                        const isLast = index === total - 1;
                        const isRight = index % 2 === 0;
                        const gradient = gradients[index % gradients.length];
                        const aos = isRight ? "fade-left" : "fade-right";
                        const isEditing = editingId === step.id;
                        const isSaving = savingId === step.id;

                        return (
                            <div
                                key={step.id}
                                className="relative flex min-h-[68px] items-center"
                            >
                                <div
                                    data-aos={aos}
                                    data-aos-delay={index * 80}
                                    data-aos-duration="600"
                                    className={`group absolute top-1/2 w-[62%] -translate-y-1/2 ${isRight ? "right-0" : "left-0"
                                        }`}
                                >
                                    <div className="relative rounded-[1.2rem] border border-gray-100 bg-white/95 px-3.5 py-2.5 shadow-[0_4px_18px_-6px_rgba(99,102,241,0.25)] backdrop-blur transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-indigo-200 group-hover:shadow-[0_8px_26px_-8px_rgba(99,102,241,0.45)] dark:border-white/[0.08] dark:bg-white/[0.04] dark:group-hover:border-indigo-500/30">
                                        <div
                                            className={`absolute top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border bg-white dark:bg-[#0f172a] ${isRight
                                                    ? "-left-1 border-b border-l border-gray-100 dark:border-white/[0.08]"
                                                    : "-right-1 border-r border-t border-gray-100 dark:border-white/[0.08]"
                                                }`}
                                        />

                                        <div className="mb-1 flex items-center justify-between gap-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <Milestone size={10} className="text-indigo-400" />
                                                <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-400">
                                                    ایستگاه {step.order}
                                                </span>
                                                {isLast && (
                                                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-extrabold text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                        <Sparkles size={7} />
                                                        مقصد
                                                    </span>
                                                )}
                                            </div>

                                            {canManage && !isEditing && (
                                                <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEdit(step)}
                                                        className="flex h-5 w-5 items-center justify-center rounded-md text-gray-400 transition hover:bg-indigo-50 hover:text-indigo-500 dark:hover:bg-indigo-500/10"
                                                    >
                                                        <Pencil size={10} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onDelete?.(step.id)}
                                                        className="flex h-5 w-5 items-center justify-center rounded-md text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {isEditing ? (
                                            <div className="flex items-center gap-1.5">
                                                <input
                                                    autoFocus
                                                    value={draft}
                                                    onChange={(e) => setDraft(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") commitEdit(step);
                                                        if (e.key === "Escape") cancelEdit();
                                                    }}
                                                    className="h-7 min-w-0 flex-1 rounded-lg border border-indigo-200 bg-white px-2 text-[11.5px] font-bold text-gray-800 outline-none transition focus:border-indigo-400 dark:border-indigo-500/30 dark:bg-white/[0.05] dark:text-white"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => commitEdit(step)}
                                                    disabled={isSaving}
                                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:opacity-50"
                                                >
                                                    {isSaving ? (
                                                        <Loader2 size={11} className="animate-spin" />
                                                    ) : (
                                                        <Check size={11} strokeWidth={3} />
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={cancelEdit}
                                                    disabled={isSaving}
                                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition hover:bg-gray-200 disabled:opacity-50 dark:bg-white/[0.06] dark:text-gray-400"
                                                >
                                                    <X size={11} />
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="truncate text-[12px] font-extrabold text-gray-800 dark:text-white">
                                                {step.title}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div
                                    data-aos="zoom-in"
                                    data-aos-delay={index * 80 + 120}
                                    className={`absolute top-1/2 z-20 -translate-y-1/2 ${isRight ? "left-0" : "right-0"
                                        }`}
                                >
                                    <div
                                        className={`relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-[11px] font-extrabold text-white shadow-lg ring-4 ring-white dark:ring-[#0f172a]`}
                                    >
                                        {isLast ? (
                                            <Flag size={14} strokeWidth={2.8} />
                                        ) : (
                                            step.order
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div
                data-aos="zoom-in"
                data-aos-delay={total * 80 + 200}
                className="relative z-10 mt-6 flex flex-col items-center gap-2"
            >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-white dark:ring-[#0f172a]">
                    <Check size={18} strokeWidth={3} />
                </div>
                <p className="text-[10.5px] font-extrabold text-emerald-500 dark:text-emerald-400">
                    به مقصد رسیدید 🎉
                </p>
            </div>
        </div>
    );
}