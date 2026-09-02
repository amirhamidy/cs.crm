"use client";

import { ChangeEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Check,
    Download,
    File,
    Image as ImageIcon,
    Loader2,
    Paperclip,
    Send,
    X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axiosInstance";
import type { InternalTask, InternalTaskAttachment } from "./types";
import { uploadInternalTaskAttachments } from "./Api";

interface InternalTaskChatModalProps {
    open: boolean;
    task: InternalTask;
    onClose: () => void;
    onUpdated: (task: InternalTask) => void;
}

function formatTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("fa-IR", {
        day: "numeric",
        month: "long",
    }).format(date);
}

function isImage(fileName: string) {
    return /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)$/i.test(fileName);
}

function isPdf(fileName: string) {
    return /\.pdf$/i.test(fileName);
}

function getFileName(attachment: InternalTaskAttachment) {
    return (
        attachment.original_file_name ||
        attachment.file?.split("/").pop() ||
        "فایل"
    );
}

function getAttachmentUrl(file: string) {
    if (!file) return "";
    if (file.startsWith("http://") || file.startsWith("https://")) {
        return file;
    }
    if (typeof window !== "undefined") {
        return new URL(file, window.location.origin).toString();
    }
    return file;
}

export default function InternalTaskChatModal({
    open,
    task,
    onClose,
    onUpdated,
}: InternalTaskChatModalProps) {
    const { resolvedTheme } = useTheme();
    const { userId } = useAuthStore();
    const isDark = resolvedTheme === "dark";

    const [message, setMessage] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [sending, setSending] = useState(false);

    const scrollRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const attachments = useMemo(
        () =>
            [...(task.attachments ?? [])].sort(
                (a, b) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime(),
            ),
        [task.attachments],
    );

    const groupedAttachments = useMemo(() => {
        const groups: Record<string, InternalTaskAttachment[]> = {};
        for (const attachment of attachments) {
            const key = formatDate(attachment.created_at);
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(attachment);
        }
        return Object.entries(groups);
    }, [attachments]);

    useEffect(() => {
        if (!open) return;
        const timer = window.setTimeout(() => {
            scrollRef.current?.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
            });
        }, 80);
        return () => window.clearTimeout(timer);
    }, [open, attachments.length]);

    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        if (!files.length) return;
        setSelectedFiles((previous) => [...previous, ...files]);
        event.target.value = "";
    };

    const removeFile = (index: number) => {
        setSelectedFiles((previous) =>
            previous.filter((_, fileIndex) => fileIndex !== index),
        );
    };

    const sendMessage = async () => {
        const trimmedMessage = message.trim();
        if ((!trimmedMessage && selectedFiles.length === 0) || sending) {
            return;
        }

        setSending(true);

        try {
            const response = await uploadInternalTaskAttachments(
                task.id,
                selectedFiles,
                trimmedMessage,
            );

            const newAttachments = Array.isArray(response.data)
                ? response.data
                : [];

            const updatedTask: InternalTask = {
                ...task,
                attachments: [...(task.attachments ?? []), ...newAttachments],
                updated_at: new Date().toISOString(),
            };

            onUpdated(updatedTask);

            setMessage("");
            setSelectedFiles([]);

            requestAnimationFrame(() => {
                textareaRef.current?.focus();
                requestAnimationFrame(() => {
                    scrollRef.current?.scrollTo({
                        top: scrollRef.current.scrollHeight,
                        behavior: "smooth",
                    });
                });
            });
        } catch {
            return;
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void sendMessage();
        }
    };

    const openAttachment = async (attachment: InternalTaskAttachment) => {
        if (!attachment.file) return;
        const url = getAttachmentUrl(attachment.file);
        if (!url) return;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const downloadAttachment = async (attachment: InternalTaskAttachment) => {
        try {
            const response = await api.get(attachment.file, {
                responseType: "blob",
            });
            const blobUrl = URL.createObjectURL(response.data);
            const anchor = document.createElement("a");
            anchor.href = blobUrl;
            anchor.download = getFileName(attachment);
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(blobUrl);
        } catch {
            const url = getAttachmentUrl(attachment.file);
            if (url) {
                window.open(url, "_blank", "noopener,noreferrer");
            }
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-3 backdrop-blur-xl sm:p-5"
                    onMouseDown={onClose}
                    dir="rtl"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.97 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        onMouseDown={(event) => event.stopPropagation()}
                        className="relative flex h-[min(780px,94vh)] w-full max-w-2xl flex-col overflow-hidden rounded-[32px] border border-black/[0.07] bg-[#f7f7f8] shadow-[0_40px_120px_rgba(0,0,0,0.25)] dark:border-white/[0.08] dark:bg-[#101113]"
                    >
                        <div className="relative z-10 flex shrink-0 items-center gap-3 border-b border-black/[0.06] bg-white/85 px-4 py-4 backdrop-blur-2xl dark:border-white/[0.06] dark:bg-[#151619]/90 sm:px-5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/15">
                                <ImageIcon size={19} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <h2 className="truncate text-[14px] font-bold text-black/85 dark:text-white/90">
                                    {task.title}
                                </h2>

                                <div className="mt-1 flex items-center gap-2 text-[10px] text-black/40 dark:text-white/35">
                                    <span>
                                        {task.assigned_to
                                            .map((employee) => employee.full_name)
                                            .join("، ")}
                                    </span>

                                    <span className="h-1 w-1 rounded-full bg-current opacity-40" />

                                    <span>{attachments.length} پیام</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/[0.045] text-black/45 transition-colors hover:bg-black/[0.08] hover:text-black/70 dark:bg-white/[0.055] dark:text-white/45 dark:hover:bg-white/[0.09] dark:hover:text-white/75"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <div
                            ref={scrollRef}
                            className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-5"
                            style={{
                                scrollbarWidth: "thin",
                            }}
                        >
                            {attachments.length === 0 ? (
                                <div className="flex h-full min-h-[300px] items-center justify-center">
                                    <div className="text-center">
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-blue-500/[0.08] text-blue-500 dark:bg-blue-400/[0.08]">
                                            <Send size={23} />
                                        </div>

                                        <h3 className="mt-4 text-[14px] font-bold text-black/75 dark:text-white/80">
                                            شروع گفتگو
                                        </h3>

                                        <p className="mt-2 max-w-xs text-[11px] leading-6 text-black/40 dark:text-white/35">
                                            اولین پیام یا فایل را برای اعضای این تیکت ارسال کنید.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {groupedAttachments.map(([date, items]) => (
                                        <div key={date}>
                                            <div className="mb-5 flex items-center justify-center">
                                                <span className="rounded-full bg-black/[0.045] px-3 py-1 text-[9px] font-medium text-black/35 dark:bg-white/[0.055] dark:text-white/30">
                                                    {date}
                                                </span>
                                            </div>

                                            <div className="space-y-3">
                                                {items.map((attachment) => {
                                                    const isMine =
                                                        userId !== null &&
                                                        Number(attachment.uploaded_by) ===
                                                        Number(userId);

                                                    const fileName = getFileName(attachment);
                                                    const image = isImage(fileName);
                                                    const pdf = isPdf(fileName);
                                                    const senderName = attachment.uploaded_by === userId
                                                        ? "شما"
                                                        : task.assigned_to.find(
                                                            (emp) => Number(emp.id) === Number(attachment.uploaded_by)
                                                        )?.full_name ||
                                                        task.created_by ||
                                                        "کاربر";

                                                    return (
                                                        <motion.div
                                                            key={attachment.id}
                                                            initial={{
                                                                opacity: 0,
                                                                y: 8,
                                                                scale: 0.98,
                                                            }}
                                                            animate={{
                                                                opacity: 1,
                                                                y: 0,
                                                                scale: 1,
                                                            }}
                                                            className={`flex ${isMine
                                                                ? "justify-start"
                                                                : "justify-end"
                                                                }`}
                                                        >
                                                            <div
                                                                className={`flex max-w-[88%] items-end gap-2 ${isMine ? "flex-row" : "flex-row-reverse"
                                                                    }`}
                                                            >
                                                                <div
                                                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${isMine
                                                                        ? "bg-blue-500 text-white"
                                                                        : "bg-black/[0.07] text-black/55 dark:bg-white/[0.08] dark:text-white/55"
                                                                        }`}
                                                                >
                                                                    {senderName.slice(0, 1)}
                                                                </div>

                                                                <div
                                                                    className={`rounded-[22px] px-3.5 py-3 ${isMine
                                                                        ? "rounded-br-[7px] bg-blue-500 text-white shadow-[0_8px_25px_rgba(59,130,246,0.16)]"
                                                                        : "rounded-bl-[7px] border border-black/[0.05] bg-white text-black/75 shadow-[0_5px_20px_rgba(0,0,0,0.035)] dark:border-white/[0.06] dark:bg-[#18191c] dark:text-white/75"
                                                                        }`}
                                                                >
                                                                    <div className="mb-1.5 flex items-center gap-2">
                                                                        <span
                                                                            className={`text-[9px] font-semibold ${isMine
                                                                                ? "text-white/75"
                                                                                : "text-black/40 dark:text-white/35"
                                                                                }`}
                                                                        >
                                                                            {isMine ? "شما" : senderName}
                                                                        </span>

                                                                        <span
                                                                            className={`text-[8px] ${isMine
                                                                                ? "text-white/50"
                                                                                : "text-black/25 dark:text-white/25"
                                                                                }`}
                                                                        >
                                                                            {formatTime(attachment.created_at)}
                                                                        </span>
                                                                    </div>

                                                                    {attachment.note && (
                                                                        <p className="whitespace-pre-wrap break-words text-[11px] leading-6">
                                                                            {attachment.note}
                                                                        </p>
                                                                    )}

                                                                    {attachment.file && (
                                                                        <div
                                                                            className={`mt-2.5 overflow-hidden rounded-2xl ${isMine
                                                                                ? "bg-white/10"
                                                                                : "bg-black/[0.035] dark:bg-white/[0.045]"
                                                                                }`}
                                                                        >
                                                                            {image ? (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        openAttachment(attachment)
                                                                                    }
                                                                                    className="block w-full overflow-hidden"
                                                                                >
                                                                                    <img
                                                                                        src={attachment.file}
                                                                                        alt={fileName}
                                                                                        className="max-h-64 w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                                                                                    />
                                                                                </button>
                                                                            ) : (
                                                                                <div className="flex min-w-[220px] items-center gap-3 p-3">
                                                                                    <div
                                                                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isMine
                                                                                            ? "bg-white/15"
                                                                                            : "bg-blue-500/[0.08] text-blue-500"
                                                                                            }`}
                                                                                    >
                                                                                        {pdf ? (
                                                                                            <File size={19} />
                                                                                        ) : (
                                                                                            <Paperclip size={19} />
                                                                                        )}
                                                                                    </div>

                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() =>
                                                                                            openAttachment(attachment)
                                                                                        }
                                                                                        className="min-w-0 flex-1 text-right"
                                                                                    >
                                                                                        <span className="block truncate text-[10px] font-semibold">
                                                                                            {fileName}
                                                                                        </span>

                                                                                        <span
                                                                                            className={`mt-1 block text-[8px] ${isMine
                                                                                                ? "text-white/55"
                                                                                                : "text-black/30 dark:text-white/30"
                                                                                                }`}
                                                                                        >
                                                                                            مشاهده فایل
                                                                                        </span>
                                                                                    </button>

                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() =>
                                                                                            downloadAttachment(attachment)
                                                                                        }
                                                                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isMine
                                                                                            ? "bg-white/10 text-white"
                                                                                            : "bg-black/[0.05] text-black/45 dark:bg-white/[0.06] dark:text-white/45"
                                                                                            }`}
                                                                                    >
                                                                                        <Download size={14} />
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    <div
                                                                        className={`mt-1.5 flex items-center justify-end gap-1 ${isMine
                                                                            ? "text-white/45"
                                                                            : "text-black/25 dark:text-white/25"
                                                                            }`}
                                                                    >
                                                                        {isMine && <Check size={10} />}
                                                                        <span className="text-[8px]">
                                                                            {formatTime(attachment.created_at)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="shrink-0 border-t border-black/[0.06] bg-white/90 px-3 pb-3 pt-3 backdrop-blur-2xl dark:border-white/[0.06] dark:bg-[#151619]/95 sm:px-4">
                            <AnimatePresence>
                                {selectedFiles.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{
                                            opacity: 1,
                                            height: "auto",
                                        }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-2 overflow-hidden"
                                    >
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            {selectedFiles.map((file, index) => (
                                                <div
                                                    key={`${file.name}-${index}`}
                                                    className="flex min-w-[150px] max-w-[190px] items-center gap-2 rounded-2xl border border-black/[0.06] bg-black/[0.025] px-2.5 py-2 dark:border-white/[0.06] dark:bg-white/[0.035]"
                                                >
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/[0.08] text-blue-500">
                                                        <Paperclip size={14} />
                                                    </div>

                                                    <span className="min-w-0 flex-1 truncate text-[9px] text-black/55 dark:text-white/55">
                                                        {file.name}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(index)}
                                                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-black/35 hover:bg-red-500/10 hover:text-red-500 dark:text-white/35"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex items-end gap-2 rounded-[24px] border border-black/[0.07] bg-black/[0.025] p-1.5 transition-colors focus-within:border-blue-500/30 focus-within:bg-white dark:border-white/[0.07] dark:bg-white/[0.035] dark:focus-within:bg-white/[0.045]">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={handleFiles}
                                />

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={sending}
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] text-black/40 transition-colors hover:bg-black/[0.06] hover:text-blue-500 disabled:opacity-40 dark:text-white/40 dark:hover:bg-white/[0.07]"
                                >
                                    <Paperclip size={18} />
                                </button>

                                <textarea
                                    ref={textareaRef}
                                    value={message}
                                    onChange={(event) => setMessage(event.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={sending}
                                    rows={1}
                                    placeholder="پیامتان را بنویسید..."
                                    className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2.5 text-[11px] leading-5 text-black outline-none placeholder:text-black/25 disabled:opacity-50 dark:text-white dark:placeholder:text-white/25"
                                />

                                <button
                                    type="button"
                                    onClick={() => void sendMessage()}
                                    disabled={
                                        sending ||
                                        (!message.trim() && selectedFiles.length === 0)
                                    }
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] bg-blue-500 text-white shadow-[0_8px_20px_rgba(59,130,246,0.2)] transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-35"
                                >
                                    {sending ? (
                                        <Loader2 size={17} className="animate-spin" />
                                    ) : (
                                        <Send size={17} className="translate-x-[-1px]" />
                                    )}
                                </button>
                            </div>

                            <div className="mt-2 text-center text-[8px] text-black/25 dark:text-white/20">
                                Enter برای ارسال · Shift + Enter برای خط جدید
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}