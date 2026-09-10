"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Boxes,
    Calendar,
    Check,
    ChevronDown,
    Loader,
    Paperclip,
    Search,
    X,
    AlertCircle,
    Upload,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { AxiosError } from "axios";
import axiosInstance from "@/lib/axiosInstance";
import {
    ApiOrderTaskStockProduct,
    useOrderTaskLookups,
} from "@/hooks/useOrderTaskLookups";
import TimeRangeModal from "./TimeRangeModal";
import { ApiOrderTask, ApiTask } from "@/types/warehouse";

interface CreateOrderTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (orderTask: ApiOrderTask) => void;
}

/* ──────────────────────────────────────────────────────────────
 *  گرادیانت‌های آواتار - دقیقاً مثل NiceSelect کاربر
 * ────────────────────────────────────────────────────────────── */
const GRADIENTS = [
    "from-blue-500 to-indigo-500",
    "from-violet-500 to-fuchsia-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
    "from-cyan-500 to-sky-500",
];

const gradientOf = (seed: number) =>
    GRADIENTS[Math.abs(seed) % GRADIENTS.length];
const initialOf = (text: string) => (text || "").trim().charAt(0) || "؟";

/* ──────────────────────────────────────────────────────────────
 *  Error parser
 * ────────────────────────────────────────────────────────────── */
function getErrorMessage(err: unknown, fallback: string) {
    const error = err as AxiosError<Record<string, unknown>>;
    const data = error.response?.data;
    if (!data) return fallback;
    for (const key of [
        "detail",
        "task_id",
        "product_id",
        "quantity",
        "started_at",
        "deadline",
        "note",
        "file",
        "non_field_errors",
        "message",
        "error",
    ]) {
        const value = data[key];
        if (typeof value === "string") return value;
        if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }
    return fallback;
}

/* ──────────────────────────────────────────────────────────────
 *  FloatingInput - دقیقاً مثل EditTaskModal
 * ────────────────────────────────────────────────────────────── */
function FloatingInput({
    label,
    id,
    value,
    onChange,
    type = "text",
    dir,
}: {
    label: string;
    id: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    dir?: "rtl" | "ltr";
}) {
    return (
        <div className="relative">
            <input
                id={id}
                type={type}
                dir={dir}
                placeholder=" "
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="peer h-[52px] w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 pt-4 text-[12.5px] font-bold text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:focus:border-blue-500/50"
            />
            <label
                htmlFor={id}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-gray-400 transition-all duration-200 peer-focus:top-[15px] peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-[15px] peer-[:not(:placeholder-shown)]:text-[10px]"
            >
                {label}
            </label>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────
 *  SearchableCombobox - دقیقاً مثل NiceSelect کاربر
 * ────────────────────────────────────────────────────────────── */
function SearchableCombobox<T>({
    label,
    items,
    value,
    onChange,
    getLabel,
    getSubLabel,
    getId,
    placeholder,
    disabled,
    emptyText,
}: {
    label: string;
    items: T[];
    value: number | null;
    onChange: (id: number) => void;
    getLabel: (item: T) => string;
    getSubLabel?: (item: T) => string;
    getId: (item: T) => number;
    placeholder: string;
    disabled?: boolean;
    emptyText: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    const selected = items.find((item) => getId(item) === value) ?? null;

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (!open) setQuery("");
    }, [open]);

    useEffect(() => {
        if (disabled) setOpen(false);
    }, [disabled]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter((item) => getLabel(item).toLowerCase().includes(q));
    }, [items, query, getLabel]);

    return (
        <div ref={ref} className="relative">
            <label className="mb-2 block text-[11.5px] font-bold text-gray-400">
                {label}
            </label>

            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((v) => !v)}
                className={`flex h-[52px] w-full items-center gap-2.5 rounded-2xl border px-3 text-right transition-all duration-200 ${open
                        ? "border-blue-500 bg-blue-50/50 dark:border-blue-500/50 dark:bg-blue-500/[0.06]"
                        : "border-gray-100 bg-gray-50 hover:border-gray-200 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12]"
                    } ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
            >
                {selected ? (
                    <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(
                            getId(selected)
                        )}`}
                    >
                        {initialOf(getLabel(selected))}
                    </span>
                ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.06]">
                        <ChevronDown size={13} className="text-gray-400" />
                    </span>
                )}

                <span className="min-w-0 flex-1">
                    <span
                        className={`block truncate text-[12.5px] font-bold ${selected ? "text-gray-900 dark:text-white" : "text-gray-400"
                            }`}
                    >
                        {selected ? getLabel(selected) : placeholder}
                    </span>
                    {selected && getSubLabel && (
                        <span className="mt-0.5 block truncate text-[10.5px] text-gray-400">
                            {getSubLabel(selected)}
                        </span>
                    )}
                </span>

                {!disabled && (
                    <motion.span
                        animate={{ rotate: open ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown size={14} className="shrink-0 text-gray-400" />
                    </motion.span>
                )}
            </button>

            <AnimatePresence>
                {open && !disabled && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ type: "spring", damping: 24, stiffness: 340 }}
                        className="absolute z-50 mt-2 w-full origin-top overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-xl shadow-black/5 dark:border-white/[0.08] dark:bg-[#0f172a] dark:shadow-black/40"
                    >
                        {items.length > 5 && (
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
                                <p className="py-6 text-center text-[12px] text-gray-400">
                                    {emptyText}
                                </p>
                            ) : (
                                visible.map((item, i) => {
                                    const id = getId(item);
                                    const active = id === value;
                                    return (
                                        <motion.button
                                            key={id}
                                            type="button"
                                            initial={{ opacity: 0, x: 6 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.02 }}
                                            onClick={() => {
                                                onChange(id);
                                                setOpen(false);
                                                setQuery("");
                                            }}
                                            className={`flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-right transition-colors ${active
                                                    ? "bg-blue-50 dark:bg-blue-500/10"
                                                    : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                                                }`}
                                        >
                                            <span
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(
                                                    id
                                                )}`}
                                            >
                                                {initialOf(getLabel(item))}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span
                                                    className={`block truncate text-[12.5px] font-bold ${active
                                                            ? "text-blue-600 dark:text-blue-400"
                                                            : "text-gray-900 dark:text-white"
                                                        }`}
                                                >
                                                    {getLabel(item)}
                                                </span>
                                                {getSubLabel && (
                                                    <span className="mt-0.5 block truncate text-[10.5px] text-gray-400">
                                                        {getSubLabel(item)}
                                                    </span>
                                                )}
                                            </span>
                                            {active && (
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600">
                                                    <Check
                                                        size={11}
                                                        className="text-white"
                                                        strokeWidth={3}
                                                    />
                                                </span>
                                            )}
                                        </motion.button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────
 *  Main Modal - دقیقاً مثل EditTaskModal / CreateTaskModal
 * ────────────────────────────────────────────────────────────── */
export default function CreateOrderTaskModal({
    isOpen,
    onClose,
    onCreated,
}: CreateOrderTaskModalProps) {
    const { tasks, products, loading: lookupsLoading, error: lookupsError } =
        useOrderTaskLookups(isOpen);

    const [taskId, setTaskId] = useState<number | null>(null);
    const [productId, setProductId] = useState<number | null>(null);
    const [quantity, setQuantity] = useState("");
    const [note, setNote] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [startedAt, setStartedAt] = useState<string | null>(null);
    const [deadline, setDeadline] = useState<string | null>(null);
    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        setTaskId(null);
        setProductId(null);
        setQuantity("");
        setNote("");
        setFile(null);
        setStartedAt(null);
        setDeadline(null);
        setError("");
    }, [isOpen]);

    function handleClose() {
        if (loading) return;
        onClose();
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!taskId || !productId || !quantity) {
            setError("تسک، محصول و تعداد الزامی هستند");
            return;
        }
        const qty = Number(quantity);
        if (!Number.isFinite(qty) || qty <= 0) {
            setError("تعداد وارد شده معتبر نیست");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("task_id", String(taskId));
            formData.append("product_id", String(productId));
            formData.append("quantity", String(qty));
            if (note.trim()) formData.append("note", note.trim());
            if (file) formData.append("file", file);
            if (startedAt) formData.append("started_at", startedAt);
            if (deadline) formData.append("deadline", deadline);

            const { data } = await axiosInstance.post<ApiOrderTask>(
                "/warehouse/api/v1/order_task/create/",
                formData
            );
            onCreated(data);
            onClose();
        } catch (err) {
            setError(getErrorMessage(err, "خطا در ثبت وظیفه"));
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
                onClick={handleClose}
            >
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    onClick={(e) => e.stopPropagation()}
                    dir="rtl"
                    className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]"
                >
                    {/* Header - دقیقاً مثل CreateTaskModal */}
                    <div className="flex shrink-0 items-center justify-between px-8 pb-6 pt-8">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                                <Boxes size={15} className="text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    ثبت وظیفه برای انبار
                                </h3>
                                <p className="mt-0.5 text-[11px] text-gray-400">
                                    درخواست سفارش کالا از انبار
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                        >
                            <X size={15} />
                        </button>
                    </div>

                    {/* Form */}
                    <div className="flex-1 overflow-y-auto px-8 pb-2">
                        <div className="flex flex-col gap-4">
                            <AnimatePresence>
                                {(lookupsError || error) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 4 }}
                                        className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10"
                                    >
                                        <AlertCircle
                                            size={14}
                                            className="mt-0.5 shrink-0 text-red-500"
                                        />
                                        <p className="flex-1 text-[11.5px] font-semibold leading-5 text-red-500 dark:text-red-400">
                                            {lookupsError || error}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setError("")}
                                            className="shrink-0 text-red-400 transition-colors hover:text-red-600"
                                        >
                                            <X size={13} />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <SearchableCombobox<ApiTask>
                                label="تسک مرتبط *"
                                items={tasks}
                                value={taskId}
                                onChange={setTaskId}
                                getId={(item) => item.id}
                                getLabel={(item) => item.title}
                                getSubLabel={(item) => item.department_name}
                                placeholder={
                                    lookupsLoading ? "در حال بارگذاری..." : "انتخاب تسک"
                                }
                                emptyText="تسکی یافت نشد"
                                disabled={loading || lookupsLoading}
                            />

                            <SearchableCombobox<ApiOrderTaskStockProduct>
                                label="محصول *"
                                items={products}
                                value={productId}
                                onChange={setProductId}
                                getId={(item) => item.product}
                                getLabel={(item) => item.product_name}
                                getSubLabel={(item) =>
                                    `${item.current_quantity} ${item.unit_label} موجود`
                                }
                                placeholder={
                                    lookupsLoading ? "در حال بارگذاری..." : "انتخاب محصول"
                                }
                                emptyText="محصولی یافت نشد"
                                disabled={loading || lookupsLoading}
                            />

                            <FloatingInput
                                id="order_task_quantity"
                                label="تعداد درخواستی *"
                                value={quantity}
                                onChange={(v) => {
                                    setQuantity(v);
                                    setError("");
                                }}
                                type="number"
                                dir="ltr"
                            />

                            <div className="relative">
                                <textarea
                                    id="order_task_note"
                                    placeholder=" "
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={3}
                                    className="peer w-full resize-none rounded-2xl border border-gray-100 bg-gray-50 px-4 pt-6 pb-3 text-[12.5px] font-bold text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:focus:border-blue-500/50"
                                />
                                <label
                                    htmlFor="order_task_note"
                                    className="pointer-events-none absolute right-4 top-4 text-[12px] font-semibold text-gray-400 transition-all duration-200 peer-focus:top-[15px] peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-[15px] peer-[:not(:placeholder-shown)]:text-[10px]"
                                >
                                    توضیح
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => setTimeModalOpen(true)}
                                    className="flex h-[52px] items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 text-[12.5px] font-bold text-gray-700 transition-colors hover:border-gray-200 disabled:opacity-40 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-gray-300 dark:hover:border-white/[0.12]"
                                >
                                    <Calendar size={14} className="text-gray-400" />
                                    <span className="truncate px-1">
                                        {startedAt && deadline ? "ویرایش بازه" : "بازه زمانی"}
                                    </span>
                                </button>

                                <label className="flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-3.5 transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:border-white/[0.1] dark:bg-white/[0.02] dark:hover:border-blue-500/40 dark:hover:bg-blue-500/[0.05]">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm dark:bg-white/[0.06]">
                                        <Upload size={14} />
                                    </span>
                                    <span className="truncate text-[12px] font-bold text-gray-500 dark:text-gray-400">
                                        {file ? file.name : "ضمیمه فایل"}
                                    </span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        disabled={loading}
                                        onChange={(e) =>
                                            setFile(e.target.files?.[0] ?? null)
                                        }
                                    />
                                </label>
                            </div>

                            {startedAt && deadline && (
                                <div className="flex items-center justify-center gap-2 rounded-2xl bg-blue-50 py-2.5 text-[11.5px] font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                    <Calendar size={13} />
                                    <span>
                                        {new Date(startedAt).toLocaleDateString("fa-IR")} تا{" "}
                                        {new Date(deadline).toLocaleDateString("fa-IR")}
                                    </span>
                                </div>
                            )}

                            {file && (
                                <motion.div
                                    initial={{ opacity: 0, x: 8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.03]"
                                >
                                    <Paperclip
                                        size={12}
                                        className="shrink-0 text-gray-400"
                                    />
                                    <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-gray-600 dark:text-gray-300">
                                        {file.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setFile(null)}
                                        className="shrink-0 text-gray-400 transition-colors hover:text-red-500"
                                    >
                                        <X size={12} />
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Footer - دقیقاً مثل CreateTaskModal */}
                    <div className="flex shrink-0 items-center gap-2 px-8 pb-8 pt-5">
                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 text-[13px] font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
                        >
                            {loading ? (
                                <Loader size={15} className="animate-spin" />
                            ) : (
                                <>
                                    <Check size={14} strokeWidth={3} />
                                    ثبت وظیفه
                                </>
                            )}
                        </motion.button>
                    </div>
                </motion.div>

                <TimeRangeModal
                    open={timeModalOpen}
                    initialStartedAt={startedAt}
                    initialDeadline={deadline}
                    onClose={() => setTimeModalOpen(false)}
                    onSubmit={(start: string, end: string) => {
                        setStartedAt(start);
                        setDeadline(end);
                        setTimeModalOpen(false);
                    }}
                />
            </motion.div>
        </AnimatePresence>
    );
}