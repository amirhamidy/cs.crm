
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
    X,
    ChevronDown,
    Upload,
    Check,
    Loader,
    Search,
    Paperclip,
    AlertCircle,
    UserPlus,
    Info,
    Briefcase,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { listAll } from "@/lib/api";

interface Department { id: number; name: string }
interface DepartmentStep { id: number; department: number; name: string; order: number }
interface DepartmentEmployee {
    id: number;
    employee: number;
    employee_name: string;
    department: number;
    department_name: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Option { id: number; label: string; sub?: string }

const GRADIENTS = [
    "from-emerald-500 to-teal-500", "from-blue-500 to-indigo-500",
    "from-violet-500 to-fuchsia-500", "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500", "from-cyan-500 to-sky-500",
];

const gradientOf = (seed: number) => GRADIENTS[Math.abs(seed) % GRADIENTS.length];
const initialOf = (text: string) => (text || "").trim().charAt(0) || "؟";

function FloatingInput({ label, id, value, onChange }: {
    label: string; id: string; value: string; onChange: (v: string) => void;
}) {
    return (
        <div className="relative">
            <input
                id={id}
                type="text"
                placeholder=" "
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="peer h-[52px] w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 pt-4 text-[12.5px] font-bold text-gray-900 outline-none transition-colors focus:border-emerald-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:focus:border-emerald-500/50"
            />
            <label
                htmlFor={id}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-gray-400 transition-all duration-200 peer-focus:top-[15px] peer-focus:text-[10px] peer-focus:text-emerald-500 peer-[:not(:placeholder-shown)]:top-[15px] peer-[:not(:placeholder-shown)]:text-[10px]"
            >
                {label}
            </label>
        </div>
    );
}

function FloatingTextarea({ label, id, value, onChange }: {
    label: string; id: string; value: string; onChange: (v: string) => void;
}) {
    return (
        <div className="relative">
            <textarea
                id={id}
                placeholder=" "
                value={value}
                rows={3}
                onChange={(e) => onChange(e.target.value)}
                className="peer w-full resize-none rounded-2xl border border-gray-100 bg-gray-50 px-4 pb-3 pt-6 text-[12.5px] font-bold text-gray-900 outline-none transition-colors focus:border-emerald-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:focus:border-emerald-500/50"
            />
            <label
                htmlFor={id}
                className="pointer-events-none absolute right-4 top-4 text-[12px] font-semibold text-gray-400 transition-all duration-200 peer-focus:top-[10px] peer-focus:text-[10px] peer-focus:text-emerald-500 peer-[:not(:placeholder-shown)]:top-[10px] peer-[:not(:placeholder-shown)]:text-[10px]"
            >
                {label}
            </label>
        </div>
    );
}

function NiceSelect({ label, options, value, onChange, placeholder, disabled, emptyText, multiple = false }: {
    label: string;
    options: Option[];
    value: number | number[] | null;
    onChange: (id: number | number[]) => void;
    placeholder: string;
    disabled?: boolean;
    emptyText: string;
    multiple?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    const selectedValues = Array.isArray(value) ? value : value !== null ? [value] : [];
    const selectedOptions = options.filter((o) => selectedValues.includes(o.id));

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => { if (!open) setQuery(""); }, [open]);
    useEffect(() => { if (disabled) setOpen(false); }, [disabled]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
    }, [options, query]);

    const handleSelect = (id: number) => {
        if (!multiple) {
            onChange(id);
            setOpen(false);
            return;
        }
        const current = Array.isArray(value) ? value : [];
        onChange(current.includes(id) ? current.filter((v) => v !== id) : [...current, id]);
    };

    const displayText = multiple
        ? selectedOptions.length > 0 ? `${selectedOptions.length} کارمند انتخاب شد` : placeholder
        : selectedOptions[0]?.label || placeholder;

    return (
        <div ref={ref} className="relative">
            <label className="mb-2 block text-[11.5px] font-bold text-gray-400">{label}</label>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((v) => !v)}
                className={`flex h-[52px] w-full items-center gap-2.5 rounded-2xl border px-3 text-right transition-all duration-200 ${open
                    ? "border-emerald-500 bg-emerald-50/50 dark:border-emerald-500/50 dark:bg-emerald-500/[0.06]"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12]"
                    } ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
            >
                {selectedOptions.length > 0 && !multiple ? (
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(selectedOptions[0].id)}`}>
                        {initialOf(selectedOptions[0].label)}
                    </span>
                ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.06]">
                        {multiple ? <UserPlus size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
                    </span>
                )}
                <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[12.5px] font-bold ${selectedOptions.length > 0 ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
                        {displayText}
                    </span>
                    {multiple && selectedOptions.length > 0 && (
                        <span className="mt-0.5 block truncate text-[10.5px] text-gray-400">
                            {selectedOptions.map((o) => o.label).join("، ")}
                        </span>
                    )}
                </span>
                <m.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={14} className="shrink-0 text-gray-400" />
                </m.span>
            </button>

            <AnimatePresence>
                {open && (
                    <m.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ type: "spring", damping: 24, stiffness: 340 }}
                        className="absolute z-50 mt-2 w-full origin-top overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-xl shadow-black/5 dark:border-white/[0.08] dark:bg-[#0f172a] dark:shadow-black/40"
                    >
                        {options.length > 5 && (
                            <div className="border-b border-gray-100 px-3 py-2.5 dark:border-white/[0.06]">
                                <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.04]">
                                    <Search size={13} className="shrink-0 text-gray-400" />
                                    <input
                                        autoFocus
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="جستجو..."
                                        className="w-full bg-transparent text-[12px] font-semibold text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="max-h-56 overflow-y-auto p-1.5">
                            {visible.length === 0 ? (
                                <p className="py-6 text-center text-[12px] text-gray-400">{emptyText}</p>
                            ) : visible.map((o, i) => {
                                const active = selectedValues.includes(o.id);
                                return (
                                    <m.button
                                        key={o.id}
                                        type="button"
                                        initial={{ opacity: 0, x: 6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.02 }}
                                        onClick={() => handleSelect(o.id)}
                                        className={`flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-right transition-colors ${active ? "bg-emerald-50 dark:bg-emerald-500/10" : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"}`}
                                    >
                                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(o.id)}`}>
                                            {initialOf(o.label)}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className={`block truncate text-[12.5px] font-bold ${active ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"}`}>
                                                {o.label}
                                            </span>
                                            {o.sub && <span className="mt-0.5 block truncate text-[10.5px] text-gray-400">{o.sub}</span>}
                                        </span>
                                        {active && (
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600">
                                                <Check size={11} className="text-white" strokeWidth={3} />
                                            </span>
                                        )}
                                    </m.button>
                                );
                            })}
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function CreateNoCaseTaskModal({ isOpen, onClose, onSuccess }: Props) {
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const [departments, setDepartments] = useState<Department[]>([]);
    const [departmentSteps, setDepartmentSteps] = useState<DepartmentStep[]>([]);
    const [employees, setEmployees] = useState<DepartmentEmployee[]>([]);

    const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
    const [selectedStep, setSelectedStep] = useState<number | null>(null);
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [files, setFiles] = useState<File[]>([]);

    useEffect(() => {
        if (!isOpen) return;

        listAll<Department>("/department/api/v1/department/list/").then((all) => setDepartments(all))
            .catch(() => setDepartments([]));

        listAll<DepartmentStep>("/department/api/v1/department_step/").then((all) => setDepartmentSteps(all))
            .catch(() => setDepartmentSteps([]));

        listAll<DepartmentEmployee>("/department/api/v1/department_employee/list/").then((all) => setEmployees(all))
            .catch(() => setEmployees([]));
    }, [isOpen]);

    useEffect(() => {
        setSelectedEmployees([]);
        setSelectedStep(null);
    }, [selectedDepartment]);

    const filteredEmployees = useMemo(
        () => selectedDepartment
            ? employees.filter((e) => Number(e.department) === Number(selectedDepartment))
            : [],
        [employees, selectedDepartment]
    );

    const filteredSteps = useMemo(
        () => selectedDepartment
            ? departmentSteps
                .filter((step) => Number(step.department) === Number(selectedDepartment))
                .sort((a, b) => a.order - b.order)
            : [],
        [departmentSteps, selectedDepartment]
    );

    const canSubmit = title.trim().length > 0
        && selectedDepartment !== null
        && selectedEmployees.length > 0
        && !submitting;

    function resetAll() {
        setSelectedDepartment(null);
        setSelectedStep(null);
        setSelectedEmployees([]);
        setTitle("");
        setDescription("");
        setFiles([]);
        setSubmitError("");
    }

    function handleClose() {
        if (submitting) return;
        resetAll();
        onClose();
    }

    function parseBackendError(data: unknown): string {
        if (!data) return "خطایی رخ داد. دوباره تلاش کنید.";
        if (typeof data === "string") return data;
        if (Array.isArray(data)) return String(data[0]);
        if (typeof data === "object") {
            const first = Object.values(data as Record<string, unknown>)[0];
            if (Array.isArray(first)) return String(first[0]);
            if (typeof first === "string") return first;
        }
        return "خطایی رخ داد. دوباره تلاش کنید.";
    }

    async function handleSubmit() {
        if (!canSubmit) return;

        setSubmitError("");
        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            formData.append("case", "");
            formData.append("department", String(selectedDepartment));

            if (selectedStep !== null) {
                formData.append("current_step", String(selectedStep));
            }

            selectedEmployees.forEach((id) => formData.append("assigned_employee", String(id)));
            files.forEach((f) => formData.append("files", f));

            await axiosInstance.post("/tasks/api/v1/tasks/create/", formData);

            onSuccess();
            resetAll();
            onClose();
        } catch (err) {
            const e = err as { response?: { data?: unknown } };
            setSubmitError(parseBackendError(e.response?.data));
        } finally {
            setSubmitting(false);
        }
    }

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
                onClick={handleClose}
            >
                <m.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    onClick={(e) => e.stopPropagation()}
                    dir="rtl"
                    className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]"
                >
                    <div className="relative shrink-0 overflow-hidden px-8 pb-6 pt-8">
                        <div className="pointer-events-none absolute -top-12 -left-12 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl" />
                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
                                    <Briefcase size={17} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">ایجاد وظیفه بدون پرونده</h3>
                                    <p className="mt-0.5 text-[11px] text-gray-400">عنوان، دپارتمان، مرحله و مسئولین</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={submitting}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 pb-2">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.06] px-3.5 py-3">
                                <Info size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                                <p className="flex-1 text-[11.5px] font-semibold leading-5 text-emerald-700 dark:text-emerald-300">
                                    این وظیفه به هیچ مشتری یا پرونده‌ای وصل نمی‌شود و مستقیم برای کارمندان انتخاب‌شده ثبت می‌شود.
                                </p>
                            </div>

                            <AnimatePresence>
                                {submitError && (
                                    <m.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 4 }}
                                        className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10"
                                    >
                                        <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
                                        <p className="flex-1 text-[11.5px] font-semibold leading-5 text-red-500 dark:text-red-400">{submitError}</p>
                                        <button
                                            type="button"
                                            onClick={() => setSubmitError("")}
                                            className="shrink-0 text-red-400 transition-colors hover:text-red-600"
                                        >
                                            <X size={13} />
                                        </button>
                                    </m.div>
                                )}
                            </AnimatePresence>

                            <FloatingInput
                                id="no_case_task_title"
                                label="عنوان وظیفه"
                                value={title}
                                onChange={(v) => { setTitle(v); setSubmitError(""); }}
                            />

                            <FloatingTextarea
                                id="no_case_task_description"
                                label="توضیحات (اختیاری)"
                                value={description}
                                onChange={(v) => { setDescription(v); setSubmitError(""); }}
                            />

                            <NiceSelect
                                label="دپارتمان"
                                placeholder="انتخاب دپارتمان"
                                emptyText="دپارتمانی یافت نشد"
                                options={departments.map((d) => ({ id: d.id, label: d.name }))}
                                value={selectedDepartment}
                                onChange={(id) => {
                                    setSelectedDepartment(id as number);
                                    setSubmitError("");
                                }}
                            />

                            <NiceSelect
                                label="مرحله شروع وظیفه (اختیاری)"
                                placeholder={selectedDepartment ? "انتخاب مرحله شروع" : "ابتدا دپارتمان را انتخاب کنید"}
                                emptyText="مرحله‌ای برای این دپارتمان یافت نشد"
                                disabled={!selectedDepartment || filteredSteps.length === 0}
                                options={filteredSteps.map((step) => ({ id: step.id, label: step.name }))}
                                value={selectedStep}
                                onChange={(id) => {
                                    setSelectedStep(id as number);
                                    setSubmitError("");
                                }}
                            />

                            <NiceSelect
                                label="کارمندان مسئول"
                                placeholder={selectedDepartment ? "انتخاب کارمند" : "ابتدا دپارتمان را انتخاب کنید"}
                                emptyText="کارمندی در این دپارتمان نیست"
                                disabled={!selectedDepartment}
                                multiple
                                options={filteredEmployees.map((e) => ({
                                    id: e.employee,
                                    label: e.employee_name,
                                    sub: e.department_name,
                                }))}
                                value={selectedEmployees}
                                onChange={(ids) => {
                                    setSelectedEmployees(ids as number[]);
                                    setSubmitError("");
                                }}
                            />

                            <div>
                                <label className="mb-2 block text-[11.5px] font-bold text-gray-400">فایل‌ها (اختیاری)</label>
                                <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-3.5 py-3 transition-colors hover:border-emerald-400 hover:bg-emerald-50/40 dark:border-white/[0.1] dark:bg-white/[0.02] dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/[0.05]">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm dark:bg-white/[0.06]">
                                        <Upload size={14} />
                                    </span>
                                    <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400">
                                        {files.length > 0 ? `${files.length} فایل انتخاب شد` : "افزودن فایل"}
                                    </span>
                                    <input
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
                                    />
                                </label>

                                <AnimatePresence>
                                    {files.length > 0 && (
                                        <m.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-2 flex flex-col gap-1.5 overflow-hidden"
                                        >
                                            {files.map((f, i) => (
                                                <m.div
                                                    key={`${f.name}-${i}`}
                                                    initial={{ opacity: 0, x: 8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 8 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.03]"
                                                >
                                                    <Paperclip size={12} className="shrink-0 text-gray-400" />
                                                    <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-gray-600 dark:text-gray-300">{f.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                                                        className="shrink-0 text-gray-400 transition-colors hover:text-red-500"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </m.div>
                                            ))}
                                        </m.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 px-8 pb-8 pt-5">
                        <m.button
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 text-[13px] font-bold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-500 disabled:opacity-40 disabled:shadow-none"
                        >
                            {submitting
                                ? <Loader size={15} className="animate-spin" />
                                : <><Check size={14} strokeWidth={3} />ثبت وظیفه بدون پرونده</>}
                        </m.button>
                    </div>
                </m.div>
            </m.div>
        </AnimatePresence>
    );
}
