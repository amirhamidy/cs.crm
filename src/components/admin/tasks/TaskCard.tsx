"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    ArrowLeft,
    CalendarDays,
    Check,
    ClipboardList,
    Loader,
    MoreVertical,
    Pencil,
    Trash2,
    UserRound,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";

interface Task {
    id: number;
    title: string;
    description: string;
    department: number;
    case: number;

    status?: string;
    status_display?: string;

    department_name?: string;
    department_title?: string;

    assigned_employee_name?: string;
    assigned_employee_full_name?: string;

    created_at?: string;
    updated_at?: string;
}

interface TaskCardProps {
    task: Task;
    index: number;
    onDelete: (id: number) => void;
    onEdit: (task: Task) => void;
}

interface StatusStyle {
    label: string;
    className: string;
    dotClassName: string;
}

const statusStyles: Record<string, StatusStyle> = {
    pending: {
        label: "در انتظار",
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        dotClassName: "bg-amber-500",
    },
    in_progress: {
        label: "در حال انجام",
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        dotClassName: "bg-blue-500",
    },
    processing: {
        label: "در حال انجام",
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        dotClassName: "bg-blue-500",
    },
    completed: {
        label: "تکمیل شده",
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        dotClassName: "bg-emerald-500",
    },
    cancelled: {
        label: "لغو شده",
        className: "bg-red-500/10 text-red-600 dark:text-red-400",
        dotClassName: "bg-red-500",
    },
};

function getStatusStyle(status?: string): StatusStyle {
    if (!status) {
        return {
            label: "نامشخص",
            className: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
            dotClassName: "bg-zinc-500",
        };
    }

    return (
        statusStyles[status] || {
            label: status,
            className: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
            dotClassName: "bg-zinc-500",
        }
    );
}

function formatDate(date?: string) {
    if (!date) return "بدون تاریخ";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "بدون تاریخ";
    }

    return parsedDate.toLocaleDateString("fa-IR");
}

export default function TaskCard({
    task,
    index,
    onDelete,
    onEdit,
}: TaskCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const status = getStatusStyle(task.status);
    const isCompleted = task.status === "completed";

    const departmentName =
        task.department_name ||
        task.department_title ||
        `دپارتمان شماره ${task.department}`;

    const employeeName =
        task.assigned_employee_name ||
        task.assigned_employee_full_name ||
        "بدون مسئول";

    const handleEdit = () => {
        setMenuOpen(false);
        onEdit(task);
    };

    const handleDelete = async () => {
        setDeleting(true);
        setDeleteError("");

        try {
            await axiosInstance.delete(
                `/tasks/api/v1/tasks/${task.id}/delete/`
            );

            setDeleteModalOpen(false);
            onDelete(task.id);
        } catch (error) {
            console.error("خطا در حذف وظایف:", error);
            setDeleteError("حذف وظایف انجام نشد. دوباره تلاش کنید.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <motion.article
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{
                    duration: 0.28,
                    delay: Math.min(index * 0.04, 0.2),
                }}
                className="group relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/[0.08] dark:border-white/[0.07] dark:bg-[#151515]"
                dir="rtl"
            >
                <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-blue-500/[0.07] blur-3xl transition-all duration-500 group-hover:bg-blue-500/[0.14]" />

                <div className="relative">
                    {/* Header */}
                    <div className="mb-5 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                            <div className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-blue-500/10 px-2 text-xs font-black text-blue-600 dark:text-blue-400">
                                #{task.id}
                            </div>

                            <span
                                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${status.className}`}
                            >
                                <span
                                    className={`h-1.5 w-1.5 rounded-full ${status.dotClassName}`}
                                />
                                {task.status_display || status.label}
                            </span>
                        </div>

                        {/* Action menu */}
                        <div className="relative">
                            <button
                                type="button"
                                aria-label="عملیات وظایف"
                                onClick={() => setMenuOpen((previous) => !previous)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/[0.07] dark:hover:text-zinc-200"
                            >
                                <MoreVertical size={17} />
                            </button>

                            {menuOpen && (
                                <>
                                    <button
                                        type="button"
                                        aria-label="بستن منو"
                                        onClick={() => setMenuOpen(false)}
                                        className="fixed inset-0 z-10 h-full w-full cursor-default"
                                    />

                                    <motion.div
                                        initial={{
                                            opacity: 0,
                                            scale: 0.95,
                                            y: -6,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            scale: 1,
                                            y: 0,
                                        }}
                                        className="absolute left-0 top-10 z-20 w-40 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/[0.08] dark:bg-[#222]"
                                    >
                                        <button
                                            type="button"
                                            onClick={handleEdit}
                                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-right text-xs font-medium text-zinc-600 transition-colors hover:bg-blue-500/10 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400"
                                        >
                                            <Pencil size={14} />
                                            ویرایش وظایف
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMenuOpen(false);
                                                setDeleteError("");
                                                setDeleteModalOpen(true);
                                            }}
                                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-right text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10"
                                        >
                                            <Trash2 size={14} />
                                            حذف وظایف
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="mb-5">
                        <h2 className="mb-2 line-clamp-1 text-[16px] font-black text-zinc-800 dark:text-white">
                            {task.title || "بدون عنوان"}
                        </h2>

                        <p className="line-clamp-3 min-h-[66px] text-[12px] leading-6 text-zinc-500 dark:text-zinc-400">
                            {task.description ||
                                "توضیحاتی برای این وظایف ثبت نشده است."}
                        </p>
                    </div>

                    {/* Details */}
                    <div className="mb-5 grid grid-cols-2 gap-3 border-y border-zinc-100 py-4 dark:border-white/[0.06]">
                        <div className="flex min-w-0 items-center gap-2">
                            <div className="flex h-9 w-9 min-w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                                <ClipboardList size={16} />
                            </div>

                            <div className="min-w-0">
                                <span className="mb-1 block text-[9px] text-zinc-400 dark:text-zinc-500">
                                    دپارتمان
                                </span>
                                <span className="block truncate text-[11px] font-bold text-zinc-700 dark:text-zinc-200">
                                    {departmentName}
                                </span>
                            </div>
                        </div>

                        <div className="flex min-w-0 items-center gap-2">
                            <div className="flex h-9 w-9 min-w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                                <UserRound size={16} />
                            </div>

                            <div className="min-w-0">
                                <span className="mb-1 block text-[9px] text-zinc-400 dark:text-zinc-500">
                                    مسئول انجام
                                </span>
                                <span className="block truncate text-[11px] font-bold text-zinc-700 dark:text-zinc-200">
                                    {employeeName}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
                            <CalendarDays size={14} />
                            <span className="text-[10px] font-medium">
                                {formatDate(task.created_at)}
                            </span>
                        </div>

                        <button
                            type="button"
                            disabled={isCompleted}
                            onClick={() => {
                                // در صورت داشتن advance handler،
                                // این بخش را به آن متصل کن.
                            }}
                            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2.5 text-[10px] font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:shadow-none"
                        >
                            {isCompleted ? "تکمیل شده" : "مشاهده جزئیات"}
                            <ArrowLeft size={14} />
                        </button>
                    </div>
                </div>
            </motion.article>

            {/* Delete confirmation modal */}
            {deleteModalOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
                    dir="rtl"
                    onClick={() => !deleting && setDeleteModalOpen(false)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        onClick={(event) => event.stopPropagation()}
                        className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#181818]"
                    >
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                            <AlertTriangle size={22} />
                        </div>

                        <h3 className="mb-2 text-base font-black text-zinc-900 dark:text-white">
                            حذف وظایف
                        </h3>

                        <p className="mb-5 text-xs leading-6 text-zinc-500 dark:text-zinc-400">
                            آیا از حذف وظایف «{task.title}» مطمئن هستید؟ این
                            عملیات قابل بازگشت نیست.
                        </p>

                        {deleteError && (
                            <div className="mb-4 rounded-xl bg-red-500/10 px-3 py-2 text-center text-xs font-medium text-red-500">
                                {deleteError}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={() => setDeleteModalOpen(false)}
                                className="flex-1 rounded-xl bg-zinc-100 py-3 text-xs font-bold text-zinc-600 transition-colors hover:bg-zinc-200 disabled:opacity-50 dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:bg-white/[0.1]"
                            >
                                انصراف
                            </button>

                            <button
                                type="button"
                                disabled={deleting}
                                onClick={handleDelete}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-xs font-bold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {deleting ? (
                                    <>
                                        <Loader
                                            size={15}
                                            className="animate-spin"
                                        />
                                        در حال حذف
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={15} />
                                        حذف کن
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );
}
