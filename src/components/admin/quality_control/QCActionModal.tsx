"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    CheckCircle2,
    FileText,
    Loader2,
    Upload,
    X,
    XCircle,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import type {
    ApiQualityControlEmployee,
    ApiQualityControlItem,
    QualityControlActionResponse,
} from "@/types/quality_control";

type Mode = "approve" | "reject";

interface Props {
    isOpen: boolean;
    mode: Mode;
    item: ApiQualityControlItem;
    employees: ApiQualityControlEmployee[];
    onClose: () => void;
    onCompleted: (response: QualityControlActionResponse) => void;
}

function getErrorMessage(err: unknown, fallback: string) {
    const error = err as AxiosError<Record<string, unknown>>;
    const data = error.response?.data;

    if (!data) return fallback;

    const keys = [
        "detail",
        "checked_by",
        "note",
        "file",
        "message",
        "error",
        "non_field_errors",
    ];

    for (const key of keys) {
        const value = data[key];

        if (typeof value === "string") return value;

        if (Array.isArray(value)) {
            const first = value[0];

            if (typeof first === "string") return first;

            if (
                first &&
                typeof first === "object" &&
                "string" in first
            ) {
                return String(
                    (first as Record<string, unknown>).string
                );
            }
        }
    }

    return fallback;
}

export default function QCActionModal({
    isOpen,
    mode,
    item,
    employees,
    onClose,
    onCompleted,
}: Props) {
    const [checkedById, setCheckedById] = useState("");
    const [note, setNote] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const isApprove = mode === "approve";

    const activeEmployees = employees.filter((employee) => employee.is_active);

    useEffect(() => {
        if (!isOpen) return;

        setCheckedById("");
        setNote("");
        setFile(null);
        setError("");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, [isOpen, mode, item.id]);

    function closeModal() {
        if (loading) return;
        onClose();
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!checkedById) {
            setError("انتخاب بررسی‌کننده الزامی است");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const formData = new FormData();

            formData.append("checked_by", checkedById);
            formData.append("note", note.trim());

            if (file) {
                formData.append("file", file);
            }

            const endpoint = isApprove
                ? `/quality_control/api/v1/${item.id}/approve/`
                : `/quality_control/api/v1/${item.id}/reject/`;

            const { data } =
                await axiosInstance.post<QualityControlActionResponse>(
                    endpoint,
                    formData
                );

            onCompleted(data);
            onClose();
        } catch (err) {
            setError(
                getErrorMessage(
                    err,
                    isApprove
                        ? "تایید کنترل کیفی انجام نشد"
                        : "رد کنترل کیفی انجام نشد"
                )
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onMouseDown={closeModal}
                    className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 25, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 25, scale: 0.97 }}
                        transition={{ duration: 0.25 }}
                        onMouseDown={(event) => event.stopPropagation()}
                        dir="rtl"
                        className="my-auto w-full max-w-[520px] overflow-hidden rounded-[30px] border border-black/[0.05] bg-white shadow-2xl dark:border-white/[0.07] dark:bg-[#0b1220]"
                    >
                        <div
                            className={`p-6 ${isApprove
                                    ? "bg-emerald-500/[0.07]"
                                    : "bg-red-500/[0.07]"
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isApprove
                                                ? "bg-emerald-500/10 text-emerald-500"
                                                : "bg-red-500/10 text-red-500"
                                            }`}
                                    >
                                        {isApprove ? (
                                            <CheckCircle2 size={23} />
                                        ) : (
                                            <XCircle size={23} />
                                        )}
                                    </div>

                                    <div>
                                        <h2 className="text-[16px] font-black text-gray-900 dark:text-white">
                                            {isApprove
                                                ? "تایید کنترل کیفی"
                                                : "رد کنترل کیفی"}
                                        </h2>

                                        <p className="mt-1 max-w-[280px] truncate text-[11px] font-medium text-gray-400">
                                            {item.product_name}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={loading}
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] text-gray-400 transition hover:bg-black/[0.07] hover:text-gray-700 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:bg-white/[0.08] dark:hover:text-white"
                                >
                                    <X size={17} />
                                </button>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-5 p-6"
                        >
                            <div className="rounded-2xl bg-gray-50 p-4 dark:bg-white/[0.035]">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400">
                                            محصول
                                        </p>
                                        <p className="mt-1 truncate text-[12px] font-extrabold text-gray-900 dark:text-white">
                                            {item.product_name}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400">
                                            وظیفه خرید
                                        </p>
                                        <p className="mt-1 text-[12px] font-extrabold text-gray-900 dark:text-white">
                                            #{item.purchase_task_id}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="qc_checked_by"
                                    className="mb-2 block text-[11px] font-extrabold text-gray-500 dark:text-gray-400"
                                >
                                    بررسی‌کننده
                                </label>

                                <select
                                    id="qc_checked_by"
                                    value={checkedById}
                                    onChange={(event) => {
                                        setCheckedById(event.target.value);
                                        setError("");
                                    }}
                                    disabled={loading}
                                    className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-[12px] font-bold text-gray-800 outline-none transition focus:border-emerald-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                                >
                                    <option value="" disabled>
                                        انتخاب بررسی‌کننده
                                    </option>

                                    {activeEmployees.map((employee) => (
                                        <option
                                            key={employee.id}
                                            value={employee.user}
                                        >
                                            {employee.username}
                                        </option>
                                    ))}
                                </select>

                                {activeEmployees.length === 0 && (
                                    <p className="mt-2 text-[10px] font-bold text-amber-500">
                                        هیچ کارمند فعالی برای بررسی وجود ندارد.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="qc_note"
                                    className="mb-2 block text-[11px] font-extrabold text-gray-500 dark:text-gray-400"
                                >
                                    توضیحات بررسی
                                </label>

                                <textarea
                                    id="qc_note"
                                    value={note}
                                    onChange={(event) =>
                                        setNote(event.target.value)
                                    }
                                    disabled={loading}
                                    rows={4}
                                    placeholder={
                                        isApprove
                                            ? "توضیحات مربوط به تایید را وارد کنید..."
                                            : "دلیل رد کردن محصول را وارد کنید..."
                                    }
                                    className="w-full resize-none rounded-2xl border border-gray-200 bg-white p-4 text-[12px] font-medium leading-6 text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-emerald-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/20"
                                />
                            </div>

                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    hidden
                                    onChange={(event) =>
                                        setFile(
                                            event.target.files?.[0] ?? null
                                        )
                                    }
                                />

                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-right transition hover:border-emerald-400 hover:bg-emerald-50/40 dark:border-white/[0.08] dark:bg-white/[0.025] dark:hover:bg-emerald-500/[0.04]"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm dark:bg-white/[0.05]">
                                        {file ? (
                                            <FileText
                                                size={17}
                                                className="text-emerald-500"
                                            />
                                        ) : (
                                            <Upload size={17} />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[11.5px] font-extrabold text-gray-700 dark:text-gray-200">
                                            {file
                                                ? file.name
                                                : "افزودن فایل پیوست"}
                                        </p>

                                        <p className="mt-0.5 text-[9.5px] font-medium text-gray-400">
                                            فایل اختیاری
                                        </p>
                                    </div>
                                </button>
                            </div>

                            {error && (
                                <div className="flex items-start gap-2 rounded-2xl bg-red-500/[0.07] p-3 text-red-500">
                                    <AlertCircle
                                        size={15}
                                        className="mt-0.5 shrink-0"
                                    />

                                    <p className="text-[11px] font-bold leading-5">
                                        {error}
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={
                                    loading ||
                                    !checkedById ||
                                    activeEmployees.length === 0
                                }
                                className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-[12px] font-black text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${isApprove
                                        ? "bg-emerald-600 hover:bg-emerald-500"
                                        : "bg-red-600 hover:bg-red-500"
                                    }`}
                            >
                                {loading ? (
                                    <Loader2
                                        size={17}
                                        className="animate-spin"
                                    />
                                ) : isApprove ? (
                                    <>
                                        <CheckCircle2 size={16} />
                                        تایید و ارسال به انبار
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={16} />
                                        رد و بازگشت به فرآیند خرید
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}