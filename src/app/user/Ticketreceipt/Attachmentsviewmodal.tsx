"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, Paperclip, UserRound, X } from "lucide-react";
import { useTheme } from "next-themes";
import { JALALI_MONTHS, pad2, toJalali, toPersianDigits } from "@/lib/jalali";
import type { InternalTask } from "./types";
import { getInternalTaskAttachmentUrl } from "./Api";

interface AttachmentsViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: InternalTask;
}

function formatJalali(value?: string | null) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const [jy, jm, jd] = toJalali(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    ) as [number, number, number];
    return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)} - ${toPersianDigits(
        pad2(date.getHours())
    )}:${toPersianDigits(pad2(date.getMinutes()))}`;
}

export default function AttachmentsViewModal({
    isOpen,
    onClose,
    task,
}: AttachmentsViewModalProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.94, y: 18 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.94, y: 18 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="flex w-full max-w-[440px] flex-col overflow-hidden rounded-3xl border"
                    style={{
                        background: isDark ? "#0f172a" : "#ffffff",
                        borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
                        maxHeight: "80vh",
                    }}
                    onClick={(e) => e.stopPropagation()}
                    dir="rtl"
                >
                    <div
                        className="flex items-center justify-between border-b px-5 py-4"
                        style={{
                            borderColor: isDark
                                ? "rgba(255,255,255,0.06)"
                                : "rgba(0,0,0,0.06)",
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-9 w-9 items-center justify-center rounded-xl"
                                style={{ background: "rgba(99,102,241,0.10)" }}
                            >
                                <Paperclip size={15} className="text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    یادداشت‌ها و فایل‌ها
                                </h3>
                                <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                                    {task.title}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                            style={{
                                background: isDark
                                    ? "rgba(255,255,255,0.05)"
                                    : "rgba(0,0,0,0.04)",
                            }}
                        >
                            <X size={15} />
                        </button>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto p-5">
                        {task.attachments.length === 0 ? (
                            <p className="py-10 text-center text-[12px] font-semibold text-gray-400">
                                یادداشت یا فایلی ثبت نشده
                            </p>
                        ) : (
                            task.attachments.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex flex-col gap-2 rounded-2xl p-3.5"
                                    style={{
                                        background: isDark
                                            ? "rgba(255,255,255,0.03)"
                                            : "rgba(0,0,0,0.025)",
                                        border: isDark
                                            ? "1px solid rgba(255,255,255,0.06)"
                                            : "1px solid rgba(0,0,0,0.05)",
                                    }}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="flex items-center gap-1.5 text-[10.5px] font-bold text-gray-500 dark:text-gray-400">
                                            <UserRound size={11} />
                                            کارمند {toPersianDigits(item.uploaded_by)}
                                        </span>
                                        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
                                            {formatJalali(item.created_at)}
                                        </span>
                                    </div>

                                    {item.note && (
                                        <p className="text-[12px] font-medium leading-6 text-gray-700 dark:text-gray-300">
                                            {item.note}
                                        </p>
                                    )}

                                    {item.file && (
                                        <a
                                            href={getInternalTaskAttachmentUrl(task.id, item.id)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-500 hover:text-indigo-400"
                                        >
                                            <Download size={12} />
                                            {item.original_file_name}
                                        </a>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}