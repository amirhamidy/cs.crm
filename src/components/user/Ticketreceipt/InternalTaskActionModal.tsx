"use client";

import { useState } from "react";
import { X, Paperclip, Loader2 } from "lucide-react";
import { InternalTask, TaskStatus } from "./InternalTasksKanban";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
    { value: "todo", label: "انجام نشده" },
    { value: "in_progress", label: "در حال انجام" },
    { value: "done", label: "انجام شده" },
];

export default function InternalTaskActionModal({
    open,
    task,
    onClose,
    onSubmit,
}: {
    open: boolean;
    task: InternalTask;
    onClose: () => void;
    onSubmit: (id: number, status: TaskStatus, files: File[]) => Promise<void>;
}) {
    const [status, setStatus] = useState<TaskStatus>(task.status);
    const [files, setFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);
        try {
            await onSubmit(task.id, status, files);
        } catch {
            setError("خطا در ثبت تغییرات. لطفاً دوباره امتحان کنید.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-4xl border border-white/10 bg-[oklch(0.14_0.02_270)] p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
            >
                <div className="mb-5 flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-white">{task.title}</h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {task.description && (
                    <p className="mb-5 text-sm text-white/50">{task.description}</p>
                )}

                <div className="mb-5">
                    <label className="mb-2 block text-xs text-white/60">
                        وضعیت جدید
                    </label>
                    <div className="flex gap-2">
                        {STATUS_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setStatus(opt.value)}
                                className={[
                                    "flex-1 rounded-2xl border py-2 text-xs font-medium transition",
                                    status === opt.value
                                        ? "border-violet-500 bg-violet-500/20 text-violet-300"
                                        : "border-white/10 bg-white/5 text-white/50 hover:border-white/20",
                                ].join(" ")}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-5">
                    <label className="mb-2 block text-xs text-white/60">
                        پیوست جدید
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-white/20 px-4 py-3 text-xs text-white/40 transition hover:border-violet-500/40 hover:text-violet-300">
                        <Paperclip className="h-4 w-4" />
                        {files.length > 0
                            ? `${files.length} فایل انتخاب شده`
                            : "انتخاب فایل"}
                        <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) =>
                                setFiles(Array.from(e.target.files ?? []))
                            }
                        />
                    </label>
                </div>

                {task.attachments.length > 0 && (
                    <div className="mb-5">
                        <p className="mb-2 text-xs text-white/60">پیوست‌های قبلی</p>
                        <div className="space-y-1">
                            {task.attachments.map((att) => (
                                <a
                                    key={att.id}
                                    href={att.file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-violet-400 transition hover:bg-white/5"
                                >
                                    <Paperclip className="h-3 w-3" />
                                    فایل {att.id}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <p className="mb-4 rounded-2xl bg-rose-500/10 px-4 py-2 text-xs text-rose-400">
                        {error}
                    </p>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex w-full items-center justify-center rounded-2xl bg-violet-600 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                >
                    {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        "ثبت تغییرات"
                    )}
                </button>
            </div>
        </div>
    );
}
