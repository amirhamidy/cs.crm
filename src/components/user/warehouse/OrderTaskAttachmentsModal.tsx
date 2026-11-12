"use client";

import { useRef, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { Backdrop } from "@/components/ui/Backdrop";
import { panelMotion } from "@/lib/motion";
import { ExternalLink, Paperclip, Trash2, Upload, X } from "lucide-react";
import { apiErrorMessage, createOrderTaskAttachment, deleteOrderTaskAttachment } from "@/lib/warehouseApi";
import { resolveMediaUrl } from "@/lib/media";
import { formatDate } from "@/utils/warehouseEmployee";
import type { ApiOrderTask } from "@/types/warehouse";

import { BusyContent } from "@/components/ui/Button";
interface Props {
    isOpen: boolean;
    orderTask: ApiOrderTask;
    performedBy: number | string | null;
    canManage: boolean;
    onClose: () => void;
    onChanged: () => void | Promise<void>;
}

export default function OrderTaskAttachmentsModal({
    isOpen,
    orderTask,
    performedBy,
    canManage,
    onClose,
    onChanged,
}: Props) {
    const reduced = useReducedMotion() ?? false;
    const fileRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [note, setNote] = useState("");
    const [busy, setBusy] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [error, setError] = useState("");

    const attachments = orderTask.attachments ?? [];

    async function handleUpload() {
        if (!file) return setError("فایلی انتخاب نشده است");
        if (performedBy == null) return setError("اطلاعات انباردار یافت نشد");

        setBusy(true);
        setError("");

        try {
            await createOrderTaskAttachment({
                orderTaskId: orderTask.id,
                performedBy,
                note,
                file,
            });
            setFile(null);
            setNote("");
            if (fileRef.current) fileRef.current.value = "";
            await onChanged();
        } catch (err) {
            setError(apiErrorMessage(err, "آپلود فایل انجام نشد"));
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete(id: number) {
        setDeletingId(id);
        setError("");

        try {
            await deleteOrderTaskAttachment(id);
            await onChanged();
        } catch (err) {
            setError(apiErrorMessage(err, "حذف فایل انجام نشد"));
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    dir="rtl"
                >
                    <Backdrop onClick={() => !busy && onClose()} />
                    <m.div
                        {...panelMotion(false, reduced)}
                        className="relative flex max-h-[85vh] w-full max-w-md flex-col rounded-3xl bg-white p-5 dark:bg-gray-900"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Paperclip size={16} className="text-indigo-500" />
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    فایل‌های پیوست سفارش #{orderTask.id}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={busy}
                                className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
                            {attachments.length === 0 && (
                                <p className="py-8 text-center text-[12px] text-gray-400">
                                    فایلی پیوست نشده است
                                </p>
                            )}

                            {attachments.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-start justify-between gap-2 rounded-2xl bg-gray-50 p-3 dark:bg-white/5"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-[12px] font-extrabold text-gray-900 dark:text-white">
                                            {item.performed_by?.full_name ?? "—"}
                                        </p>
                                        {item.note && (
                                            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                                {item.note}
                                            </p>
                                        )}
                                        <p className="mt-1 text-[10px] text-gray-400">
                                            {formatDate(item.created_at)}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-1">
                                        <a
                                            href={resolveMediaUrl(item.file)}
                                            target="_blank"
                                            rel="noreferrer"
                                            aria-label="مشاهده فایل"
                                            className="flex h-8 w-8 items-center justify-center rounded-xl text-indigo-500 hover:bg-indigo-500/10"
                                        >
                                            <ExternalLink size={14} />
                                        </a>
                                        {canManage && (
                                            <button
                                                type="button"
                                                aria-label="حذف فایل"
                                                disabled={deletingId === item.id}
                                                onClick={() => handleDelete(item.id)}
                                                className="relative flex h-8 w-8 items-center justify-center rounded-xl text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                                            >
                                                <BusyContent busy={deletingId === item.id}>
                                                    <Trash2 size={14} />
                                                </BusyContent>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {canManage && (
                            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 dark:border-white/10">
                                <input
                                    ref={fileRef}
                                    type="file"
                                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                    className="block w-full text-[11.5px] text-gray-600 file:ml-3 file:rounded-xl file:border-0 file:bg-indigo-500/10 file:px-3 file:py-2 file:text-[11.5px] file:font-bold file:text-indigo-600 dark:text-gray-300"
                                />
                                <input
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="توضیحات (اختیاری)"
                                    className="h-10 w-full rounded-2xl border border-gray-200 bg-white px-3 text-[12px] font-semibold text-gray-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                />

                                {error && (
                                    <p className="rounded-xl bg-red-500/10 px-3 py-2 text-[11.5px] font-bold text-red-500">
                                        {error}
                                    </p>
                                )}

                                <button
                                    type="button"
                                    onClick={handleUpload}
                                    disabled={busy || !file}
                                    className="relative flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 text-[13px] font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                                >
                                    <BusyContent busy={busy}>
                                        <Upload size={15} />
                                        آپلود فایل
                                    </BusyContent>
                                </button>
                            </div>
                        )}

                        {!canManage && error && (
                            <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-[11.5px] font-bold text-red-500">
                                {error}
                            </p>
                        )}
                    </m.div>
                </div>
            )}
        </AnimatePresence>
    );
}
