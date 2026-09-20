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
import type { AxiosError } from "axios";
import axiosInstance from "@/lib/axiosInstance";
import {
    ApiOrderTaskStockProduct,
    useOrderTaskLookups,
} from "@/hooks/useOrderTaskLookups";
import { ApiOrderTask, ApiTask } from "@/types/warehouse";
import TimeRangeModal from "../tasks/TimeRangeModal";

interface CreateOrderTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (orderTask: ApiOrderTask) => void;
}

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

function formatNumber(raw: string): string {
    if (!raw) return "";
    let str = String(raw).replace(/,/g, "").trim();
    if (!str) return "";
    const neg = str.startsWith("-");
    if (neg) str = str.slice(1);
    const parts = str.split(".");
    const intPart = parts[0].replace(/[^\d]/g, "");
    const decPart =
        parts.length > 1 ? parts[1].replace(/[^\d]/g, "") : undefined;
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    let out = formattedInt;
    if (decPart !== undefined) out += "." + decPart;
    return (neg ? "-" : "") + out;
}

function parseNumber(raw: string): number {
    if (!raw) return NaN;
    const cleaned = String(raw).replace(/,/g, "").trim();
    return cleaned === "" ? NaN : Number(cleaned);
}

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
        if (Array.isArray(value) && typeof value[0] === "string")
            return value[0];
    }
    return fallback;
}

function FloatingInput({
    label,
    id,
    value,
    onChange,
    numeric = false,
    dir,
}: {
    label: string;
    id: string;
    value: string;
    onChange: (v: string) => void;
    numeric?: boolean;
    dir?: "rtl" | "ltr";
}) {
    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const raw = e.target.value;
        onChange(numeric ? formatNumber(raw) : raw);
    }

    return (
        <div className="relative">
            <input
                id={id}
                type="text"
                inputMode={numeric ? "decimal" : undefined}
                dir={dir}
                placeholder=" "
                value={value}
                onChange={handleChange}
                className="peer h-[56px] w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 pt-4 text-[12.5px] font-bold text-slate-900 outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-white/[0.07] dark:bg-white/[0.035] dark:text-white dark:focus:border-blue-500/50 dark:focus:bg-white/[0.05] dark:focus:ring-blue-500/10"
            />
            <label
                htmlFor={id}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-400 transition-all duration-200 peer-focus:top-[15px] peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-[15px] peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-slate-500 dark:peer-[:not(:placeholder-shown)]:text-slate-400"
            >
                {label}
            </label>
        </div>
    );
}

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
            if (ref.current && !ref.current.contains(e.target as Node))
                setOpen(false);
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
        return items.filter((item) =>
            getLabel(item).toLowerCase().includes(q)
        );
    }, [items, query, getLabel]);

    return (
        <div ref={ref} className="relative">
            <label className="mb-2 block px-1 text-[11px] font-bold text-slate-400">
                {label}
            </label>

            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((v) => !v)}
                className={`flex h-[56px] w-full items-center gap-3 rounded-2xl border px-3.5 text-right transition-all duration-200 ${open
                        ? "border-blue-500 bg-blue-50/60 shadow-sm shadow-blue-500/5 dark:border-blue-500/50 dark:bg-blue-500/[0.07]"
                        : "border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-white dark:border-white/[0.07] dark:bg-white/[0.035] dark:hover:border-white/[0.13] dark:hover:bg-white/[0.05]"
                    } ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
            >
                {selected ? (
                    <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white shadow-sm ${gradientOf(
                            getId(selected)
                        )}`}
                    >
                        {initialOf(getLabel(selected))}
                    </span>
                ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-white/[0.07]">
                        <ChevronDown size={13} className="text-slate-400" />
                    </span>
                )}

                <span className="min-w-0 flex-1">
                    <span
                        className={`block truncate text-[12.5px] font-bold ${selected
                                ? "text-slate-900 dark:text-white"
                                : "text-slate-400"
                            }`}
                    >
                        {selected ? getLabel(selected) : placeholder}
                    </span>
                    {selected && getSubLabel && (
                        <span className="mt-0.5 block truncate text-[10.5px] text-slate-400">
                            {getSubLabel(selected)}
                        </span>
                    )}
                </span>

                {!disabled && (
                    <motion.span
                        animate={{ rotate: open ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown
                            size={14}
                            className="shrink-0 text-slate-400"
                        />
                    </motion.span>
                )}
            </button>

            <AnimatePresence>
                {open && !disabled && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{
                            type: "spring",
                            damping: 24,
                            stiffness: 340,
                        }}
                        className="absolute z-[60] mt-2 w-full origin-top overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-white/[0.08] dark:bg-[#151a23] dark:shadow-black/40"
                    >
                        {items.length > 5 && (
                            <div className="border-b border-slate-100 px-3 py-2.5 dark:border-white/[0.06]">
                                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-white/[0.04]">
                                    <Search
                                        size={13}
                                        className="shrink-0 text-slate-400"
                                    />
                                    <input
                                        autoFocus
                                        value={query}
                                        onChange={(e) =>
                                            setQuery(e.target.value)
                                        }
                                        placeholder="جستجو..."
                                        className="w-full bg-transparent text-[12px] font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="max-h-56 overflow-y-auto p-1.5">
                            {visible.length === 0 ? (
                                <p className="py-7 text-center text-[12px] text-slate-400">
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
                                            className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-right transition-colors ${active
                                                    ? "bg-blue-50 dark:bg-blue-500/10"
                                                    : "hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                                                }`}
                                        >
                                            <span
                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(
                                                    id
                                                )}`}
                                            >
                                                {initialOf(getLabel(item))}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span
                                                    className={`block truncate text-[12.5px] font-bold ${active
                                                            ? "text-blue-600 dark:text-blue-400"
                                                            : "text-slate-900 dark:text-white"
                                                        }`}
                                                >
                                                    {getLabel(item)}
                                                </span>
                                                {getSubLabel && (
                                                    <span className="mt-0.5 block truncate text-[10.5px] text-slate-400">
                                                        {getSubLabel(item)}
                                                    </span>
                                                )}
                                            </span>
                                            {active && (
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 shadow-sm shadow-blue-500/20">
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

export default function CreateOrderTaskModal({
    isOpen,
    onClose,
    onCreated,
}: CreateOrderTaskModalProps) {
    const {
        tasks,
        products,
        loading: lookupsLoading,
        error: lookupsError,
    } = useOrderTaskLookups(isOpen);

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
        const qty = parseNumber(quantity);
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
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-3 py-4 backdrop-blur-md sm:px-4"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ opacity: 0, y: 18, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 18, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    onClick={(e) => e.stopPropagation()}
                    dir="rtl"
                    className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-2xl shadow-black/20 dark:border-white/[0.07] dark:bg-[#10151d]"
                >
                    <div className="h-1 w-full shrink-0 bg-gradient-to-l from-blue-600 via-cyan-500 to-violet-500" />

                    <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 pb-5 pt-6 dark:border-white/[0.06] sm:px-7">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                                <Boxes size={19} />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-extrabold text-slate-900 dark:text-white">
                                    ثبت وظیفه برای انبار
                                </h3>
                                <p className="mt-1 text-[10.5px] font-medium text-slate-400">
                                    درخواست سفارش کالا از انبار
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition-all hover:bg-slate-200 hover:text-slate-700 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:bg-white/[0.09] dark:hover:text-white"
                        >
                            <X size={15} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-7">
                        <div className="flex flex-col gap-4">
                            <AnimatePresence>
                                {(lookupsError || error) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 4 }}
                                        className="flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 px-3.5 py-3 dark:border-red-500/10 dark:bg-red-500/10"
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

                            <div className="rounded-[1.35rem] border border-slate-100 bg-slate-50/50 p-3.5 dark:border-white/[0.05] dark:bg-white/[0.018]">
                                <div className="mb-3 flex items-center gap-2 px-1">
                                    <span className="h-4 w-1 rounded-full bg-blue-500" />
                                    <span className="text-[10.5px] font-extrabold text-slate-500 dark:text-slate-300">
                                        اطلاعات درخواست
                                    </span>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <SearchableCombobox<ApiTask>
                                        label="تسک مرتبط *"
                                        items={tasks}
                                        value={taskId}
                                        onChange={setTaskId}
                                        getId={(item) => item.id}
                                        getLabel={(item) => item.title}
                                        getSubLabel={(item) =>
                                            item.department_name
                                        }
                                        placeholder={
                                            lookupsLoading
                                                ? "در حال بارگذاری..."
                                                : "انتخاب تسک"
                                        }
                                        emptyText="تسکی یافت نشد"
                                        disabled={
                                            loading || lookupsLoading
                                        }
                                    />

                                    <SearchableCombobox<ApiOrderTaskStockProduct>
                                        label="محصول *"
                                        items={products}
                                        value={productId}
                                        onChange={setProductId}
                                        getId={(item) => item.product}
                                        getLabel={(item) => item.product_name}
                                        getSubLabel={(item) =>
                                            `${formatNumber(
                                                String(item.current_quantity)
                                            )} ${item.unit_label} موجود`
                                        }
                                        placeholder={
                                            lookupsLoading
                                                ? "در حال بارگذاری..."
                                                : "انتخاب محصول"
                                        }
                                        emptyText="محصولی یافت نشد"
                                        disabled={
                                            loading || lookupsLoading
                                        }
                                    />

                                    <FloatingInput
                                        id="order_task_quantity"
                                        label="تعداد درخواستی *"
                                        value={quantity}
                                        onChange={(v) => {
                                            setQuantity(v);
                                            setError("");
                                        }}
                                        numeric
                                        dir="ltr"
                                    />

                                    <div className="relative">
                                        <textarea
                                            id="order_task_note"
                                            placeholder="توضیحات"
                                            value={note}
                                            onChange={(e) =>
                                                setNote(e.target.value)
                                            }
                                            rows={3}
                                            className="peer w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 pb-3 pt-6 text-[12.5px] font-bold text-slate-900 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/[0.07] dark:bg-white/[0.035] dark:text-white dark:focus:border-blue-500/50 dark:focus:bg-white/[0.05]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => setTimeModalOpen(true)}
                                    className={`group flex h-[58px] items-center gap-2.5 rounded-2xl border px-3 transition-all duration-200 disabled:opacity-40 ${startedAt && deadline
                                            ? "border-blue-500/30 bg-blue-50/60 dark:border-blue-500/30 dark:bg-blue-500/[0.07]"
                                            : "border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-white dark:border-white/[0.07] dark:bg-white/[0.035] dark:hover:border-white/[0.13]"
                                        }`}
                                >
                                    <span
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${startedAt && deadline
                                                ? "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
                                                : "bg-white text-slate-400 dark:bg-white/[0.06]"
                                            }`}
                                    >
                                        <Calendar size={14} />
                                    </span>
                                    <span
                                        className={`truncate text-[11.5px] font-bold ${startedAt && deadline
                                                ? "text-blue-600 dark:text-blue-400"
                                                : "text-slate-500 dark:text-slate-400"
                                            }`}
                                    >
                                        {startedAt && deadline
                                            ? "ویرایش بازه"
                                            : "تعیین بازه زمانی"}
                                    </span>
                                </button>

                                <label className="group flex h-[58px] cursor-pointer items-center gap-2.5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-3 transition-all hover:border-blue-400 hover:bg-blue-50/40 dark:border-white/[0.1] dark:bg-white/[0.025] dark:hover:border-blue-500/40 dark:hover:bg-blue-500/[0.05]">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm transition-colors group-hover:text-blue-500 dark:bg-white/[0.06]">
                                        <Upload size={14} />
                                    </span>
                                    <span className="truncate text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                                        {file ? file.name : "ضمیمه فایل"}
                                    </span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        disabled={loading}
                                        onChange={(e) =>
                                            setFile(
                                                e.target.files?.[0] ?? null
                                            )
                                        }
                                    />
                                </label>
                            </div>

                            {startedAt && deadline && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 py-2.5 text-[11.5px] font-bold text-blue-600 dark:border-blue-500/10 dark:bg-blue-500/10 dark:text-blue-400"
                                >
                                    <Calendar size={13} />
                                    <span dir="rtl">
                                        {new Date(
                                            startedAt
                                        ).toLocaleDateString("fa-IR")}{" "}
                                        تا{" "}
                                        {new Date(
                                            deadline
                                        ).toLocaleDateString("fa-IR")}
                                    </span>
                                </motion.div>
                            )}

                            {file && (
                                <motion.div
                                    initial={{ opacity: 0, x: 8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 dark:border-white/[0.05] dark:bg-white/[0.03]"
                                >
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-white/[0.06]">
                                        <Paperclip
                                            size={12}
                                            className="text-slate-400"
                                        />
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-slate-600 dark:text-slate-300">
                                        {file.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setFile(null)}
                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                                    >
                                        <X size={12} />
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    <div className="shrink-0 border-t border-slate-100 bg-white/95 px-6 pb-6 pt-4 backdrop-blur sm:px-7 dark:border-white/[0.06] dark:bg-[#10151d]/95">
                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-blue-600 to-blue-500 text-[13px] font-extrabold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-500 hover:to-cyan-500 hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-40"
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
                    onSubmit={async (start: string, end: string) => {
                        setStartedAt(start);
                        setDeadline(end);
                        setTimeModalOpen(false);
                    }}
                />
            </motion.div>
        </AnimatePresence>
    );
}