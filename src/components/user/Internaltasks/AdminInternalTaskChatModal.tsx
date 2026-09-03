"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Download,
    File,
    Loader2,
    MessageSquareText,
    Paperclip,
    X,
} from "lucide-react";
import { useTheme } from "next-themes";
import api from "@/lib/axiosInstance";
import type {
    EmployeeListItem,
    InternalTask,
    InternalTaskAttachment,
} from "./types";
import { fetchInternalTasks } from "./Api";

interface UserListItem {
    id: number;
    username: string;
}

interface AdminInternalTaskChatModalProps {
    open: boolean;
    task: InternalTask;
    employees: EmployeeListItem[];
    onClose: () => void;
    onUpdated: (task: InternalTask) => void;
}

type EmployeeRecord = EmployeeListItem & {
    username?: string;
    full_name?: string;
};

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

function getCreatorName(
    task: InternalTask,
    employees: EmployeeListItem[]
) {
    if (!task.created_by) return "کاربر";

    const createdBy = task.created_by.trim();

    const employee = employees.find(
        (employee) =>
            (employee as EmployeeRecord).username?.trim() === createdBy
    ) as EmployeeRecord | undefined;

    return (
        employee?.full_name ||
        employee?.username ||
        task.created_by
    );
}

function getSenderName(
    uploadedById: number,
    users: UserListItem[],
    employees: EmployeeListItem[]
) {
    const user = users.find((item) => Number(item.id) === uploadedById);

    if (!user) return "کاربر";

    const username = user.username.trim();

    const employee = employees.find(
        (item) =>
            (item as EmployeeRecord).username?.trim() === username
    ) as EmployeeRecord | undefined;

    return (
        employee?.full_name ||
        employee?.username ||
        username
    );
}

export default function AdminInternalTaskChatModal({
    open,
    task,
    employees,
    onClose,
    onUpdated,
}: AdminInternalTaskChatModalProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [isPolling, setIsPolling] = useState(false);
    const [users, setUsers] = useState<UserListItem[]>([]);

    const scrollRef = useRef<HTMLDivElement | null>(null);
    const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
    const taskRef = useRef(task);
    const shouldAutoScrollRef = useRef(true);

    useEffect(() => {
        api
            .get<UserListItem[]>("/accounts/api/v1/user/list/")
            .then((res) => {
                setUsers(Array.isArray(res.data) ? res.data : []);
            })
            .catch(() => {
                setUsers([]);
            });
    }, []);

    useEffect(() => {
        taskRef.current = task;
    }, [task]);

    const attachments = useMemo(
        () =>
            [...(task.attachments ?? [])].sort(
                (a, b) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime()
            ),
        [task.attachments]
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

    const scrollToBottom = (
        behavior: ScrollBehavior = "smooth"
    ) => {
        bottomAnchorRef.current?.scrollIntoView({
            behavior,
            block: "end",
        });
    };

    useEffect(() => {
        if (!open) return;

        const timer = window.setTimeout(() => {
            scrollToBottom("auto");
        }, 80);

        return () => window.clearTimeout(timer);
    }, [open]);

    useEffect(() => {
        if (!open || !shouldAutoScrollRef.current) return;

        const timer = window.setTimeout(() => {
            scrollToBottom("smooth");
        }, 50);

        return () => window.clearTimeout(timer);
    }, [open, attachments.length]);

    useEffect(() => {
        const container = scrollRef.current;

        if (!container) return;

        const handleScroll = () => {
            const distanceFromBottom =
                container.scrollHeight -
                container.scrollTop -
                container.clientHeight;

            shouldAutoScrollRef.current =
                distanceFromBottom < 120;
        };

        container.addEventListener("scroll", handleScroll);

        return () => {
            container.removeEventListener(
                "scroll",
                handleScroll
            );
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow =
                previousOverflow;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;

        let cancelled = false;

        const poll = async () => {
            if (cancelled) return;

            try {
                setIsPolling(true);

                const response = await fetchInternalTasks();

                if (cancelled) return;

                const rawList = Array.isArray(response.data)
                    ? response.data
                    : [];

                const currentTask = taskRef.current;

                const rawTask = rawList.find(
                    (item: any) =>
                        Number(item?.id) ===
                        Number(currentTask.id)
                );

                if (!rawTask) return;

                const rawAttachments: InternalTaskAttachment[] =
                    Array.isArray(rawTask.attachments)
                        ? rawTask.attachments
                        : [];

                const currentAttachments =
                    currentTask.attachments ?? [];

                const existingIds = new Set(
                    currentAttachments.map((item) =>
                        Number(item.id)
                    )
                );

                const incomingIds = new Set(
                    rawAttachments.map((item) =>
                        Number(item.id)
                    )
                );

                const newOnes = rawAttachments.filter(
                    (item) =>
                        !existingIds.has(Number(item.id))
                );

                const stillExists =
                    currentAttachments.filter((item) =>
                        incomingIds.has(Number(item.id))
                    );

                if (
                    newOnes.length === 0 &&
                    stillExists.length ===
                    currentAttachments.length
                ) {
                    return;
                }

                onUpdated({
                    ...currentTask,
                    attachments: [
                        ...stillExists,
                        ...newOnes,
                    ],
                    status:
                        typeof rawTask.status === "string"
                            ? rawTask.status
                            : currentTask.status,
                    updated_at:
                        typeof rawTask.updated_at ===
                            "string"
                            ? rawTask.updated_at
                            : currentTask.updated_at,
                });
            } catch {
                return;
            } finally {
                if (!cancelled) {
                    setIsPolling(false);
                }
            }
        };

        const intervalId = window.setInterval(
            poll,
            2000
        );

        void poll();

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [open, task.id, onUpdated]);

    useEffect(() => {
        if (!open) return;

        const handleVisibility = () => {
            if (
                document.visibilityState === "visible"
            ) {
                shouldAutoScrollRef.current = true;
            }
        };

        document.addEventListener(
            "visibilitychange",
            handleVisibility
        );

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibility
            );
        };
    }, [open]);

    const openAttachment = (
        attachment: InternalTaskAttachment
    ) => {
        if (!attachment.file) return;

        const url = getAttachmentUrl(
            attachment.file
        );

        if (url) {
            window.open(
                url,
                "_blank",
                "noopener,noreferrer"
            );
        }
    };

    const downloadAttachment = async (
        attachment: InternalTaskAttachment
    ) => {
        if (!attachment.file) return;

        try {
            const response = await api.get(
                attachment.file,
                {
                    responseType: "blob",
                }
            );

            const blobUrl = URL.createObjectURL(
                response.data
            );

            const anchor =
                document.createElement("a");

            anchor.href = blobUrl;
            anchor.download =
                getFileName(attachment);

            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();

            URL.revokeObjectURL(blobUrl);
        } catch {
            const url = getAttachmentUrl(
                attachment.file
            );

            if (url) {
                window.open(
                    url,
                    "_blank",
                    "noopener,noreferrer"
                );
            }
        }
    };

    const assignedNames = Array.isArray(
        task.assigned_to
    )
        ? task.assigned_to
            .map((employee) => employee.full_name)
            .filter(Boolean)
            .join("، ")
        : "";

    const creatorName = getCreatorName(
        task,
        employees
    );

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
                        initial={{
                            opacity: 0,
                            y: 24,
                            scale: 0.97,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                        }}
                        exit={{
                            opacity: 0,
                            y: 24,
                            scale: 0.97,
                        }}
                        transition={{
                            duration: 0.28,
                            ease: [
                                0.22,
                                1,
                                0.36,
                                1,
                            ],
                        }}
                        onMouseDown={(e) =>
                            e.stopPropagation()
                        }
                        className="relative flex h-[min(780px,94vh)] w-full max-w-2xl flex-col overflow-hidden rounded-[32px] border border-black/[0.07] bg-[#f7f7f8] shadow-[0_40px_120px_rgba(0,0,0,0.25)] dark:border-white/[0.08] dark:bg-[#101113]"
                    >
                        <div className="relative z-10 flex shrink-0 items-center gap-3 border-b border-black/[0.06] bg-white/85 px-4 py-4 backdrop-blur-2xl dark:border-white/[0.06] dark:bg-[#151619]/90 sm:px-5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/15">
                                <MessageSquareText size={19} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <h2 className="truncate text-[14px] font-bold text-black/85 dark:text-white/90">
                                    {task.title}
                                </h2>

                                <div className="mt-1 flex min-w-0 items-center gap-2 text-[10px] text-black/40 dark:text-white/35">
                                    <span className="truncate">
                                        {assignedNames ||
                                            "بدون مسئول"}
                                    </span>

                                    <span className="h-1 w-1 shrink-0 rounded-full bg-current opacity-40" />

                                    <span className="shrink-0">
                                        {attachments.length} پیام
                                    </span>

                                    {isPolling && (
                                        <>
                                            <span className="h-1 w-1 shrink-0 rounded-full bg-current opacity-40" />

                                            <span className="flex shrink-0 items-center gap-1 text-emerald-500">
                                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                                زنده
                                            </span>
                                        </>
                                    )}
                                </div>

                                <div className="mt-1 truncate text-[9px] text-black/25 dark:text-white/20">
                                    ایجادکننده: {creatorName}
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
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-indigo-500/[0.08] text-indigo-500 dark:bg-indigo-400/[0.08]">
                                            <MessageSquareText size={23} />
                                        </div>

                                        <h3 className="mt-4 text-[14px] font-bold text-black/75 dark:text-white/80">
                                            گفتگویی وجود ندارد
                                        </h3>

                                        <p className="mt-2 max-w-xs text-[11px] leading-6 text-black/40 dark:text-white/35">
                                            هنوز پیامی برای این
                                            تیکت ثبت نشده است.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {groupedAttachments.map(
                                        ([date, items]) => (
                                            <div key={date}>
                                                <div className="mb-5 flex items-center justify-center">
                                                    <span className="rounded-full bg-black/[0.045] px-3 py-1 text-[9px] font-medium text-black/35 dark:bg-white/[0.055] dark:text-white/30">
                                                        {date}
                                                    </span>
                                                </div>

                                                <div className="space-y-3">
                                                    {items.map(
                                                        (
                                                            attachment
                                                        ) => {
                                                            const fileName =
                                                                getFileName(
                                                                    attachment
                                                                );

                                                            const image =
                                                                isImage(
                                                                    fileName
                                                                );

                                                            const pdf =
                                                                isPdf(
                                                                    fileName
                                                                );

                                                            const senderName =
                                                                getSenderName(
                                                                    Number(
                                                                        attachment.uploaded_by
                                                                    ),
                                                                    users,
                                                                    employees
                                                                );

                                                            return (
                                                                <motion.div
                                                                    key={
                                                                        attachment.id
                                                                    }
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
                                                                    className="flex justify-end"
                                                                >
                                                                    <div className="flex max-w-[88%] flex-row-reverse items-end gap-2">
                                                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white shadow-sm">
                                                                            {senderName
                                                                                .trim()
                                                                                .slice(
                                                                                    0,
                                                                                    1
                                                                                ) ||
                                                                                "ک"}
                                                                        </div>

                                                                        <div className="rounded-[22px] rounded-bl-[7px] border border-black/[0.05] bg-white px-3.5 py-3 text-black/75 shadow-[0_5px_20px_rgba(0,0,0,0.035)] dark:border-white/[0.06] dark:bg-[#18191c] dark:text-white/75">
                                                                            <div className="mb-1.5 flex items-center gap-2">
                                                                                <span className="text-[9px] font-semibold text-black/40 dark:text-white/35">
                                                                                    {
                                                                                        senderName
                                                                                    }
                                                                                </span>

                                                                                <span className="text-[8px] text-black/25 dark:text-white/25">
                                                                                    {formatTime(
                                                                                        attachment.created_at
                                                                                    )}
                                                                                </span>
                                                                            </div>

                                                                            {attachment.note ? (
                                                                                <p className="whitespace-pre-wrap break-words text-[11px] leading-6">
                                                                                    {
                                                                                        attachment.note
                                                                                    }
                                                                                </p>
                                                                            ) : null}

                                                                            {attachment.file ? (
                                                                                <div className="mt-2.5 overflow-hidden rounded-2xl bg-black/[0.035] dark:bg-white/[0.045]">
                                                                                    {image ? (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() =>
                                                                                                openAttachment(
                                                                                                    attachment
                                                                                                )
                                                                                            }
                                                                                            className="block w-full overflow-hidden"
                                                                                        >
                                                                                            <img
                                                                                                src={getAttachmentUrl(
                                                                                                    attachment.file
                                                                                                )}
                                                                                                alt={
                                                                                                    fileName
                                                                                                }
                                                                                                className="max-h-64 w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                                                                                            />
                                                                                        </button>
                                                                                    ) : (
                                                                                        <div className="flex min-w-[220px] items-center gap-3 p-3">
                                                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/[0.08] text-indigo-500">
                                                                                                {pdf ? (
                                                                                                    <File
                                                                                                        size={
                                                                                                            19
                                                                                                        }
                                                                                                    />
                                                                                                ) : (
                                                                                                    <Paperclip
                                                                                                        size={
                                                                                                            19
                                                                                                        }
                                                                                                    />
                                                                                                )}
                                                                                            </div>

                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() =>
                                                                                                    openAttachment(
                                                                                                        attachment
                                                                                                    )
                                                                                                }
                                                                                                className="min-w-0 flex-1 text-right"
                                                                                            >
                                                                                                <span className="block truncate text-[10px] font-semibold">
                                                                                                    {
                                                                                                        fileName
                                                                                                    }
                                                                                                </span>

                                                                                                <span className="mt-1 block text-[8px] text-black/30 dark:text-white/30">
                                                                                                    مشاهده فایل
                                                                                                </span>
                                                                                            </button>

                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() =>
                                                                                                    void downloadAttachment(
                                                                                                        attachment
                                                                                                    )
                                                                                                }
                                                                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-black/[0.05] text-black/45 dark:bg-white/[0.06] dark:text-white/45"
                                                                                            >
                                                                                                <Download
                                                                                                    size={
                                                                                                        14
                                                                                                    }
                                                                                                />
                                                                                            </button>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ) : null}

                                                                            <div className="mt-1.5 flex items-center justify-end">
                                                                                <span className="text-[8px] text-black/25 dark:text-white/25">
                                                                                    {formatTime(
                                                                                        attachment.created_at
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    )}

                                    <div
                                        ref={
                                            bottomAnchorRef
                                        }
                                    />
                                </div>
                            )}
                        </div>

                        <div className="shrink-0 border-t border-black/[0.06] bg-white/90 px-4 py-3 backdrop-blur-2xl dark:border-white/[0.06] dark:bg-[#151619]/95">
                            <div className="flex items-center justify-center gap-2 rounded-[20px] border border-black/[0.05] bg-black/[0.025] px-4 py-2.5 dark:border-white/[0.05] dark:bg-white/[0.025]">
                                <Loader2
                                    size={12}
                                    className={
                                        isDark
                                            ? "text-indigo-300"
                                            : "text-indigo-400"
                                    }
                                />

                                <span className="text-[9px] font-medium text-black/30 dark:text-white/25">
                                    این گفتگو فقط برای مشاهده
                                    ادمین است
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
