"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { AlertTriangle, ArrowLeft, ArrowLeftRight, Building2, Check, FileText, Layers3, Loader2, Paperclip, Search, Trash2, UserRound, X, type LucideIcon } from "lucide-react";
import { departmentsApi, tasksApi, parseTransferError } from "@/lib/api";
import { toast } from "@/components/notifications/toast";
import { toPersianDigits } from "@/lib/jalali";
import type { Department, DepartmentEmployee, DepartmentStep } from "@/types/department";
import type { TransferTaskResponse } from "@/types/task";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    taskId: number;
    taskTitle: string;
    
    currentDepartmentId?: number;
    currentDepartmentName?: string;
    
    onTransferred: (task: TransferTaskResponse) => void;
}

interface DepartmentOption {
    id: number;
    name: string;
    accent: string;
    firstStep: DepartmentStep | null;
    stepsCount: number;
    managers: DepartmentEmployee[];
}

const ACCENT_PALETTE = [
    "#6366f1",
    "#ec4899",
    "#10b981",
    "#f59e0b",
    "#3b82f6",
    "#8b5cf6",
    "#ef4444",
    "#14b8a6",
    "#f472b6",
    "#0ea5e9",
];

function accentForId(id: number) {
    const safe = Number.isFinite(id) ? Math.abs(Math.trunc(id)) : 0;
    return ACCENT_PALETTE[safe % ACCENT_PALETTE.length];
}

function formatSize(bytes: number) {
    if (bytes < 1024) return `${toPersianDigits(bytes)} B`;
    if (bytes < 1024 * 1024) return `${toPersianDigits((bytes / 1024).toFixed(1))} KB`;
    return `${toPersianDigits((bytes / 1024 / 1024).toFixed(1))} MB`;
}

export default function TaskTransferModal({
    isOpen,
    onClose,
    taskId,
    taskTitle,
    currentDepartmentId,
    currentDepartmentName,
    onTransferred,
}: Props) {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [steps, setSteps] = useState<DepartmentStep[]>([]);
    const [members, setMembers] = useState<DepartmentEmployee[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    const [query, setQuery] = useState("");
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [note, setNote] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [confirming, setConfirming] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    
    useEffect(() => {
        if (isOpen) return;
        setQuery("");
        setSelectedId(null);
        setNote("");
        setFiles([]);
        setConfirming(false);
        setSubmitting(false);
        setError("");
    }, [isOpen]);

    
    useEffect(() => {
        if (!isOpen) return;

        let cancelled = false;
        setLoading(true);
        setLoadError("");

        Promise.allSettled([
            departmentsApi.list(),
            departmentsApi.steps(),
            departmentsApi.employees(),
        ]).then(([deptRes, stepRes, memberRes]) => {
            if (cancelled) return;

            if (deptRes.status === "fulfilled") {
                setDepartments(deptRes.value);
            } else {
                setDepartments([]);
                setLoadError("دریافت فهرست دپارتمان‌ها با خطا مواجه شد");
            }

            setSteps(stepRes.status === "fulfilled" ? stepRes.value : []);
            setMembers(memberRes.status === "fulfilled" ? memberRes.value : []);
            setLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, [isOpen]);

    
    const options = useMemo<DepartmentOption[]>(() => {
        return departments
            .filter((department) => Number(department.id) !== Number(currentDepartmentId))
            .map((department) => {
                const deptSteps = steps
                    .filter((step) => Number(step.department) === Number(department.id))
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

                return {
                    id: department.id,
                    name: department.name,
                    accent: accentForId(department.id),
                    firstStep: deptSteps[0] ?? null,
                    stepsCount: deptSteps.length,
                    managers: members.filter(
                        (member) =>
                            Number(member.department) === Number(department.id) &&
                            member.is_manager
                    ),
                };
            });
    }, [departments, steps, members, currentDepartmentId]);

    const visibleOptions = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter((option) => option.name.toLowerCase().includes(q));
    }, [options, query]);

    const selected = useMemo(
        () => options.find((option) => option.id === selectedId) ?? null,
        [options, selectedId]
    );

    
    useEffect(() => {
        if (selectedId !== null && !options.some((o) => o.id === selectedId)) {
            setSelectedId(null);
        }
    }, [options, selectedId]);

    if (typeof document === "undefined") return null;

    const stepsKnown = steps.length > 0;
    const managersKnown = members.length > 0;
    const noSteps = Boolean(selected) && stepsKnown && selected!.stepsCount === 0;
    const noManagers = Boolean(selected) && managersKnown && selected!.managers.length === 0;

    function handleFiles(list: FileList | null) {
        if (!list?.length) return;
        setFiles((current) => [...current, ...Array.from(list)]);
    }

    function removeFile(index: number) {
        setFiles((current) => current.filter((_, i) => i !== index));
    }

    function goToConfirm() {
        if (!selected) {
            setError("لطفاً دپارتمان مقصد را انتخاب کنید");
            return;
        }
        setError("");
        setConfirming(true);
    }

    async function submit() {
        if (!selected || submitting) return;

        setSubmitting(true);
        setError("");

        try {
            const result = await tasksApi.transfer(taskId, {
                department: selected.id,
                note,
                files,
            });

            toast.success("تسک با موفقیت منتقل شد", {
                description: `تسک «${taskTitle}» به دپارتمان ${
                    result.department_name ?? result.name_department ?? selected.name
                } منتقل شد`,
            });

            onClose();
            onTransferred(result);
        } catch (err) {
            setError(parseTransferError(err));
            setSubmitting(false);
        }
    }

    function close() {
        if (!submitting) onClose();
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
                        if (e.target === e.currentTarget) close();
                    }}
                >
                    <m.div
                        initial={{ opacity: 0, y: 18, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-lg overflow-hidden rounded-[1.7rem] border border-white/10 bg-white shadow-2xl dark:bg-[#101827]"
                    >
                        
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/[.06]">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                                    <ArrowLeftRight size={16} className="text-indigo-500" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                                        انتقال به دپارتمان دیگر
                                    </h3>
                                    <p className="mt-1 truncate text-[10.5px] text-gray-400">
                                        {confirming
                                            ? "اطلاعات را بررسی و انتقال را تأیید کنید"
                                            : "دپارتمان مقصد را انتخاب کنید"}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={close}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400 disabled:opacity-50 dark:bg-white/[.05]"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        
                        <div className="max-h-[72vh] overflow-y-auto px-5 py-5">
                            
                            <div className="mb-4 rounded-2xl bg-gray-50 px-3.5 py-3 dark:bg-white/[.035]">
                                <p className="line-clamp-2 text-[12px] font-extrabold leading-snug text-gray-800 dark:text-white">
                                    {taskTitle}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                                    <span className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-gray-500 dark:bg-white/[.05] dark:text-gray-300">
                                        <Building2 size={10} className="text-gray-400" />
                                        {currentDepartmentName || "دپارتمان فعلی"}
                                    </span>
                                    <ArrowLeft size={12} className="text-gray-300" />
                                    <span
                                        className="flex items-center gap-1 rounded-full px-2 py-1"
                                        style={{
                                            background: selected ? `${selected.accent}18` : undefined,
                                            color: selected ? selected.accent : "#9ca3af",
                                        }}
                                    >
                                        <Building2 size={10} />
                                        {selected ? selected.name : "مقصد انتخاب نشده"}
                                    </span>
                                </div>
                            </div>

                            {confirming && selected ? (
                                
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/20 bg-amber-500/[.07] p-3.5">
                                        <AlertTriangle
                                            size={16}
                                            className="mt-0.5 shrink-0 text-amber-500"
                                        />
                                        <div>
                                            <p className="text-[11.5px] font-extrabold text-amber-600 dark:text-amber-400">
                                                آیا از انتقال مطمئن هستید؟
                                            </p>
                                            <p className="mt-1.5 text-[11px] font-semibold leading-6 text-gray-600 dark:text-gray-300">
                                                تسک به مدیر دپارتمان انتخاب‌شده اختصاص داده می‌شود و
                                                ددلاین‌های فعلی حذف می‌شوند.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5 rounded-2xl bg-gray-50 px-3.5 py-3 dark:bg-white/[.035]">
                                        <SummaryRow
                                            icon={Building2}
                                            label="دپارتمان مقصد"
                                            value={selected.name}
                                        />
                                        <SummaryRow
                                            icon={Layers3}
                                            label="مرحله‌ی شروع"
                                            value={selected.firstStep?.name ?? "اولین مرحله‌ی دپارتمان"}
                                        />
                                        <SummaryRow
                                            icon={UserRound}
                                            label="مسئول جدید"
                                            value={
                                                selected.managers.length
                                                    ? selected.managers
                                                        .map((m) => m.employee_name)
                                                        .join("، ")
                                                    : "مدیر دپارتمان مقصد"
                                            }
                                        />
                                        {note.trim() && (
                                            <SummaryRow icon={FileText} label="توضیح" value={note.trim()} />
                                        )}
                                        {files.length > 0 && (
                                            <SummaryRow
                                                icon={Paperclip}
                                                label="ضمیمه"
                                                value={`${toPersianDigits(files.length)} فایل`}
                                            />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                
                                <>
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-gray-600 dark:text-gray-300">
                                            <Building2 size={13} />
                                            دپارتمان مقصد
                                        </div>
                                        {!loading && options.length > 0 && (
                                            <span className="text-[10px] font-bold text-gray-400">
                                                {toPersianDigits(options.length)} گزینه
                                            </span>
                                        )}
                                    </div>

                                    {options.length > 5 && (
                                        <div className="relative mb-2">
                                            <Search
                                                size={13}
                                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            />
                                            <input
                                                value={query}
                                                onChange={(e) => setQuery(e.target.value)}
                                                placeholder="جستجوی دپارتمان..."
                                                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pr-9 pl-3 text-[11px] outline-none focus:border-indigo-400 dark:border-white/[.08] dark:bg-white/[.03] dark:text-white"
                                            />
                                        </div>
                                    )}

                                    {loading ? (
                                        <div className="flex items-center gap-2 rounded-2xl border border-gray-200 px-3 py-4 text-[11px] text-gray-400 dark:border-white/[.08]">
                                            <Loader2 size={15} className="animate-spin" />
                                            در حال دریافت دپارتمان‌ها...
                                        </div>
                                    ) : loadError ? (
                                        <p className="rounded-xl bg-red-500/10 px-3 py-2.5 text-center text-[10.5px] font-bold text-red-500">
                                            {loadError}
                                        </p>
                                    ) : options.length === 0 ? (
                                        <p className="rounded-xl bg-amber-500/10 px-3 py-2.5 text-center text-[10.5px] font-bold text-amber-600">
                                            دپارتمان دیگری برای انتقال وجود ندارد.
                                        </p>
                                    ) : visibleOptions.length === 0 ? (
                                        <p className="rounded-xl bg-gray-100 px-3 py-3 text-center text-[10.5px] font-bold text-gray-400 dark:bg-white/[.04]">
                                            دپارتمانی با این نام پیدا نشد
                                        </p>
                                    ) : (
                                        <div className="flex max-h-[220px] flex-col gap-2 overflow-y-auto pl-0.5">
                                            {visibleOptions.map((option) => {
                                                const active = option.id === selectedId;
                                                return (
                                                    <button
                                                        key={option.id}
                                                        type="button"
                                                        disabled={submitting}
                                                        onClick={() => {
                                                            setSelectedId(option.id);
                                                            setError("");
                                                        }}
                                                        className="flex items-center gap-3 rounded-xl border px-3 py-2.5 text-right transition-colors"
                                                        style={{
                                                            background: active
                                                                ? `${option.accent}12`
                                                                : undefined,
                                                            borderColor: active
                                                                ? option.accent
                                                                : "rgba(148,163,184,.28)",
                                                        }}
                                                    >
                                                        <span
                                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                                                            style={{ background: option.accent }}
                                                        >
                                                            <Building2 size={14} />
                                                        </span>

                                                        <span className="min-w-0 flex-1">
                                                            <span
                                                                className={`block truncate text-[11.5px] font-extrabold ${active ? "" : "text-gray-700 dark:text-gray-200"}`}
                                                                style={active ? { color: option.accent } : undefined}
                                                            >
                                                                {option.name}
                                                            </span>
                                                            <span className="mt-0.5 block truncate text-[9.5px] font-semibold text-gray-400">
                                                                {stepsKnown
                                                                    ? option.stepsCount > 0
                                                                        ? `شروع از «${option.firstStep?.name}» · ${toPersianDigits(option.stepsCount)} مرحله`
                                                                        : "بدون مرحله"
                                                                    : "—"}
                                                            </span>
                                                        </span>

                                                        {active && (
                                                            <span
                                                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                                                                style={{ background: option.accent }}
                                                            >
                                                                <Check size={11} strokeWidth={3} />
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    
                                    {selected && (
                                        <div className="mt-3 flex flex-col gap-1.5 rounded-2xl bg-indigo-500/[.045] px-3.5 py-3">
                                            <SummaryRow
                                                icon={Layers3}
                                                label="اولین مرحله"
                                                value={selected.firstStep?.name ?? "—"}
                                            />
                                            <SummaryRow
                                                icon={UserRound}
                                                label="مدیر(ها)"
                                                value={
                                                    selected.managers.length
                                                        ? selected.managers
                                                            .map((m) => m.employee_name)
                                                            .join("، ")
                                                        : "—"
                                                }
                                            />
                                        </div>
                                    )}

                                    {(noSteps || noManagers) && (
                                        <div className="mt-2 flex flex-col gap-1 rounded-xl bg-amber-500/10 px-3 py-2 text-[10.5px] font-bold text-amber-600">
                                            {noSteps && <span>این دپارتمان هیچ مرحله‌ای ندارد؛ انتقال ممکن است رد شود.</span>}
                                            {noManagers && <span>این دپارتمان مدیر فعالی ندارد؛ انتقال ممکن است رد شود.</span>}
                                        </div>
                                    )}

                                    
                                    <div className="mt-4">
                                        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold text-gray-600 dark:text-gray-300">
                                            <FileText size={13} />
                                            توضیح
                                        </div>
                                        <textarea
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            disabled={submitting}
                                            rows={3}
                                            placeholder="توضیح اختیاری برای دپارتمان مقصد..."
                                            className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-[11px] outline-none focus:border-indigo-400 dark:border-white/[.08] dark:bg-white/[.03] dark:text-white"
                                        />
                                    </div>

                                    
                                    <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-3 text-[10.5px] font-bold text-gray-500 dark:border-white/[.08] dark:bg-white/[.025] dark:text-gray-400">
                                        <Paperclip size={13} />
                                        {files.length
                                            ? `${toPersianDigits(files.length)} فایل انتخاب شده · افزودن فایل بیشتر`
                                            : "افزودن فایل"}
                                        <input
                                            type="file"
                                            multiple
                                            hidden
                                            disabled={submitting}
                                            onChange={(e) => {
                                                handleFiles(e.target.files);
                                                
                                                e.target.value = "";
                                            }}
                                        />
                                    </label>

                                    {files.length > 0 && (
                                        <div className="mt-2 flex flex-col gap-1.5">
                                            {files.map((file, index) => (
                                                <div
                                                    key={`${file.name}-${file.size}-${index}`}
                                                    className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[.035]"
                                                >
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        <Paperclip size={11} className="shrink-0 text-gray-400" />
                                                        <span className="truncate text-[10.5px] font-bold text-gray-600 dark:text-gray-300">
                                                            {file.name}
                                                        </span>
                                                        <span className="shrink-0 text-[9.5px] font-semibold text-gray-400">
                                                            {formatSize(file.size)}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        disabled={submitting}
                                                        onClick={() => removeFile(index)}
                                                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-500/10"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {error && (
                                <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-center text-[10.5px] font-bold text-red-500">
                                    {error}
                                </p>
                            )}
                        </div>

                        
                        <div className="flex gap-2 border-t border-gray-100 px-5 py-4 dark:border-white/[.06]">
                            {confirming ? (
                                <>
                                    <button
                                        type="button"
                                        disabled={submitting}
                                        onClick={() => {
                                            setConfirming(false);
                                            setError("");
                                        }}
                                        className="h-11 flex-1 rounded-xl bg-gray-100 text-[11px] font-extrabold text-gray-500 disabled:opacity-60 dark:bg-white/[.05] dark:text-gray-400"
                                    >
                                        بازگشت
                                    </button>
                                    <button
                                        type="button"
                                        disabled={submitting}
                                        onClick={submit}
                                        className="flex h-11 flex-[1.5] items-center justify-center gap-2 rounded-xl bg-indigo-600 text-[11px] font-extrabold text-white shadow-lg shadow-indigo-500/20 disabled:opacity-60"
                                    >
                                        {submitting ? (
                                            <Loader2 size={15} className="animate-spin" />
                                        ) : (
                                            <Check size={15} />
                                        )}
                                        تأیید و انتقال تسک
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={close}
                                        className="h-11 flex-1 rounded-xl bg-gray-100 text-[11px] font-extrabold text-gray-500 dark:bg-white/[.05] dark:text-gray-400"
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!selected || loading}
                                        onClick={goToConfirm}
                                        className="flex h-11 flex-[1.5] items-center justify-center gap-2 rounded-xl bg-indigo-600 text-[11px] font-extrabold text-white shadow-lg shadow-indigo-500/20 disabled:opacity-60"
                                    >
                                        <ArrowLeftRight size={15} />
                                        ادامه
                                    </button>
                                </>
                            )}
                        </div>
                    </m.div>
                </m.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

function SummaryRow({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon;
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-1.5 text-[10.5px]">
            <Icon size={11} className="mt-0.5 shrink-0 text-gray-400" />
            <span className="shrink-0 font-semibold text-gray-400">{label}:</span>
            <span className="min-w-0 break-words font-bold text-gray-700 dark:text-white/80">
                {value}
            </span>
        </div>
    );
}
