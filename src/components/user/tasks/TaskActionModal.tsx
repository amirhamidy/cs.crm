"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { Check, FileText, Loader2, Paperclip, Star, User2, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";

interface Employee {
    id: number;
    name: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    direction: string;
    title: string;
    description: string;
    departmentId?: number;
    onSubmit: (data: {
        note: string;
        files: File[];
        score: number;
        score_reason: string;
        next_assigned_employee: number[];
    }) => Promise<void>;
    submitting: boolean;
    hideReview?: boolean;
}

export default function TaskActionModal({
    isOpen,
    onClose,
    direction,
    title,
    description,
    departmentId,
    onSubmit,
    submitting,
    hideReview = false,
}: Props) {
    const [note, setNote] = useState("");
    const [reason, setReason] = useState("");
    const [score, setScore] = useState(0);
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState("");
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
    const [employeesLoading, setEmployeesLoading] = useState(false);

    const isFinal =
        (direction === "next" && title.includes("تکمیل")) ||
        direction === "complete";
    const isCancel = direction === "cancel";
    const needsReview =
        !hideReview && (isFinal || !["next", "prev"].includes(direction));
    const needsNextAssignee = direction === "next" && !isFinal;

    useEffect(() => {
        if (!isOpen) {
            setNote("");
            setReason("");
            setScore(0);
            setFiles([]);
            setError("");
            setSelectedEmployees([]);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !needsNextAssignee || !departmentId) {
            setEmployees([]);
            setEmployeesLoading(false);
            return;
        }

        let cancelled = false;

        setEmployeesLoading(true);
        setEmployees([]);

        axiosInstance
            .get("/department/api/v1/department_employee/list/")
            .then(({ data }) => {
                const list = Array.isArray(data) ? data : data?.results ?? [];

                if (!cancelled) {
                    setEmployees(
                        list
                            .filter(
                                (item: any) =>
                                    Number(item.department?.id ?? item.department) ===
                                    Number(departmentId)
                            )
                            .map((item: any) => ({
                                id: Number(
                                    item.employee?.id ?? item.employee
                                ),
                                name:
                                    item.employee_name ??
                                    item.employee?.full_name ??
                                    item.employee?.name ??
                                    `کارمند ${item.employee?.id ?? item.employee}`,
                            }))
                            .filter(
                                (employee: Employee) =>
                                    Number.isFinite(employee.id) &&
                                    employee.id > 0
                            )
                    );
                }
            })
            .catch(() => {
                if (!cancelled) setEmployees([]);
            })
            .finally(() => {
                if (!cancelled) setEmployeesLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isOpen, needsNextAssignee, departmentId]);

    if (typeof document === "undefined") return null;

    async function submit() {
        if (needsReview && score < 1) {
            setError("لطفاً امتیاز مشتری را از ۱ تا ۵ انتخاب کنید");
            return;
        }

        if (needsReview && !reason.trim()) {
            setError("لطفاً نظر خود درباره مشتری را وارد کنید");
            return;
        }

        if (needsNextAssignee && selectedEmployees.length === 0) {
            setError("لطفاً کارمند مرحله بعد را انتخاب کنید");
            return;
        }

        if (needsNextAssignee && employeesLoading) {
            setError("لطفاً منتظر دریافت فهرست کارمندان بمانید");
            return;
        }

        if (needsNextAssignee && employees.length === 0) {
            setError("برای دپارتمان فعلی کارمندی پیدا نشد");
            return;
        }

        setError("");

        await onSubmit({
            note,
            files,
            score: needsReview ? score : 0,
            score_reason: needsReview ? reason.trim() : "",
            next_assigned_employee: needsNextAssignee
                ? selectedEmployees
                : [],
        });
    }

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-md"
                    dir="rtl"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget && !submitting) onClose();
                    }}
                >
                    <m.div
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

                            {needsNextAssignee && (
                                <div className="mb-4">
                                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold text-gray-600 dark:text-gray-300">
                                        <UsersIcon />
                                        انتخاب همکاران مرحله بعد
                                    </div>

                                    {employeesLoading ? (
                                        <div className="flex items-center gap-2 rounded-2xl border border-gray-200 px-3 py-4 text-[11px] text-gray-400 dark:border-white/[.08]">
                                            <Loader2 size={15} className="animate-spin" />
                                            در حال دریافت همکاران دپارتمان...
                                        </div>
                                    ) : employees.length === 0 ? (
                                        <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-[10.5px] font-bold text-amber-600">
                                            برای دپارتمان فعلی کارمندی پیدا نشد.
                                        </p>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            {employees.map((employee) => (
                                                <label
                                                    key={employee.id}
                                                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-[11px] font-bold text-gray-700 dark:border-white/[.08] dark:bg-white/[.03] dark:text-gray-200"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedEmployees.includes(employee.id)}
                                                        disabled={submitting}
                                                        onChange={(e) =>
                                                            setSelectedEmployees((current) =>
                                                                e.target.checked
                                                                    ? [...current, employee.id]
                                                                    : current.filter((id) => id !== employee.id)
                                                            )
                                                        }
                                                        className="h-4 w-4 accent-indigo-600"
                                                    />
                                                    {employee.name}
                                                </label>
                                            ))}
                                        </div>
                                    )}
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
                                    ? needsReview ? "ثبت نظر و تکمیل تسک" : "تکمیل تسک"
                                    : isCancel
                                        ? needsReview ? "ثبت نظر و لغو تسک" : "لغو تسک"
                                        : needsReview
                                            ? "ثبت نظر و ادامه"
                                            : "ثبت و ادامه"}
                            </button>
                        </div>
                    </m.div>
                </m.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

function UsersIcon() {
    return <span className="inline-flex h-[13px] w-[13px] items-center justify-center">
        <User2 />
    </span>;
}