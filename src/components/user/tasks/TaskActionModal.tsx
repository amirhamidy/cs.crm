"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, FileText, Loader2, Paperclip, Star, X } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    direction: string;
    title: string;
    description: string;
    onSubmit: (data: { note: string; files: File[]; score: number; score_reason: string }) => Promise<void>;
    submitting: boolean;
}

export default function TaskActionModal({
    isOpen,
    onClose,
    direction,
    title,
    description,
    onSubmit,
    submitting,
}: Props) {
    const [note, setNote] = useState("");
    const [reason, setReason] = useState("");
    const [score, setScore] = useState(0);
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) {
            setNote("");
            setReason("");
            setScore(0);
            setFiles([]);
            setError("");
        }
    }, [isOpen]);

    if (typeof document === "undefined") return null;

    const isFinal = (direction === "next" && title.includes("تکمیل")) || direction === "complete";
    const isCancel = direction === "cancel";
    const needsReview = isFinal || !["next", "prev"].includes(direction);

    async function submit() {
        if (needsReview && score < 1) {
            setError("لطفاً امتیاز مشتری را از ۱ تا ۵ انتخاب کنید");
            return;
        }

        if (needsReview && !reason.trim()) {
            setError("لطفاً نظر خود درباره مشتری را وارد کنید");
            return;
        }

        setError("");

        await onSubmit({
            note,
            files,
            score: needsReview ? score : 0,
            score_reason: needsReview ? reason.trim() : "",
        });
    }

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md"
                    dir="rtl"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget && !submitting) onClose();
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 18, scale: .97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: .98 }}
                        transition={{ duration: .2 }}
                        className="w-full max-w-lg overflow-hidden rounded-[1.7rem] border border-white/10 bg-white shadow-2xl dark:bg-[#101827]"
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/[.06]">
                            <div>
                                <h3 className="text-[15px] font-extrabold text-gray-900 dark:text-white">{title}</h3>
                                <p className="mt-1 text-[10.5px] text-gray-400">{description}</p>
                            </div>
                            <button type="button" disabled={submitting} onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-white/[.05]">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="max-h-[72vh] overflow-y-auto px-5 py-5">
                            {needsReview && (
                                <div className="mb-5 rounded-2xl border border-amber-500/15 bg-amber-500/[.05] p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-[12px] font-extrabold text-gray-800 dark:text-white">ارزیابی مشتری</p>
                                            <p className="mt-1 text-[10px] text-gray-400">
                                                {isFinal
                                                    ? "این امتیاز قبل از تکمیل تسک الزامی است"
                                                    : isCancel
                                                        ? "این امتیاز قبل از لغو تسک الزامی است"
                                                        : "نظر خودت درباره این مشتری را ثبت کن"}
                                            </p>
                                        </div>
                                        <span className="text-[12px] font-extrabold text-amber-500">{score || "—"} / ۵</span>
                                    </div>

                                    <div className="flex flex-row-reverse justify-end gap-1.5">
                                        {[5, 4, 3, 2, 1].map((value) => (
                                            <button
                                                key={value}
                                                type="button"
                                                disabled={submitting}
                                                onClick={() => setScore(value)}
                                                className="transition-transform hover:scale-110"
                                            >
                                                <Star
                                                    size={28}
                                                    fill={score >= value ? "#f59e0b" : "transparent"}
                                                    className={score >= value ? "text-amber-500" : "text-gray-300 dark:text-white/15"}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="مثلاً: مشتری پیگیر بود و احتمال خرید بالاست..."
                                        rows={3}
                                        className="mt-4 w-full resize-none rounded-2xl border border-gray-200 bg-white px-3.5 py-3 text-[11px] font-medium outline-none transition focus:border-amber-400 dark:border-white/[.08] dark:bg-white/[.03] dark:text-white"
                                    />
                                </div>
                            )}

                            <div>
                                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold text-gray-600 dark:text-gray-300">
                                    <FileText size={13} />
                                    یادداشت
                                </div>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={3}
                                    placeholder="یادداشت اختیاری..."
                                    className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-[11px] outline-none focus:border-indigo-400 dark:border-white/[.08] dark:bg-white/[.03] dark:text-white"
                                />
                            </div>

                            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-3 text-[10.5px] font-bold text-gray-500 dark:border-white/[.08] dark:bg-white/[.025] dark:text-gray-400">
                                <Paperclip size={13} />
                                {files.length ? `${files.length} فایل انتخاب شده` : "افزودن فایل"}
                                <input type="file" multiple hidden onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
                            </label>

                            {error && <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-center text-[10.5px] font-bold text-red-500">{error}</p>}
                        </div>

                        <div className="flex gap-2 border-t border-gray-100 px-5 py-4 dark:border-white/[.06]">
                            <button type="button" disabled={submitting} onClick={onClose} className="h-11 flex-1 rounded-xl bg-gray-100 text-[11px] font-extrabold text-gray-500 dark:bg-white/[.05] dark:text-gray-400">
                                انصراف
                            </button>
                            <button type="button" disabled={submitting} onClick={submit} className="flex h-11 flex-[1.5] items-center justify-center gap-2 rounded-xl bg-indigo-600 text-[11px] font-extrabold text-white shadow-lg shadow-indigo-500/20 disabled:opacity-60">
                                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                                {isFinal
                                    ? "ثبت نظر و تکمیل تسک"
                                    : isCancel
                                        ? "ثبت نظر و لغو تسک"
                                        : needsReview
                                            ? "ثبت نظر و ادامه"
                                            : "ثبت و ادامه"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}