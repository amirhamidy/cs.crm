"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { useTheme } from "next-themes";
import type { AxiosError } from "axios";
import axiosInstance from "@/lib/axiosInstance";
import { ApiOrderTaskStockProduct, useOrderTaskLookups } from "@/hooks/useOrderTaskLookups";
import TimeRangeModal from "./TimeRangeModal";
import { ApiOrderTask, ApiProduct, ApiTask } from "@/types/warehouse";

interface CreateOrderTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (orderTask: ApiOrderTask) => void;
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
        if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }

    return fallback;
}

function SearchableCombobox<T>({
    items,
    value,
    onChange,
    getLabel,
    getSubLabel,
    getId,
    placeholder,
    isDark,
    disabled,
}: {
    items: T[];
    value: number | null;
    onChange: (id: number) => void;
    getLabel: (item: T) => string;
    getSubLabel?: (item: T) => string;
    getId: (item: T) => number;
    placeholder: string;
    isDark: boolean;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const selected = items.find((item) => getId(item) === value) ?? null;

    const filtered = useMemo(() => {
        if (!query.trim()) return items;
        const q = query.trim().toLowerCase();
        return items.filter((item) => getLabel(item).toLowerCase().includes(q));
    }, [items, query, getLabel]);

    const border = isDark ? "rgba(255,255,255,.06)" : "rgba(15,23,42,.06)";
    const bg = isDark ? "rgba(255,255,255,.035)" : "rgba(15,23,42,.025)";
    const text = isDark ? "#f1f5f9" : "#1e293b";
    const muted = isDark ? "#94a3b8" : "#64748b";

    return (
        <div className="relative">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((prev) => !prev)}
                className="flex h-12 w-full items-center justify-between rounded-2xl border px-4 text-[13px] font-medium outline-none transition disabled:opacity-60"
                style={{ background: bg, borderColor: border, color: selected ? text : muted }}
            >
                <span className="truncate">{selected ? getLabel(selected) : placeholder}</span>
                <ChevronDown size={15} style={{ color: muted }} />
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                            className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border shadow-xl"
                            style={{ background: isDark ? "#0f172a" : "#fff", borderColor: border }}
                        >
                            <div className="flex items-center gap-2 border-b px-3 py-2" style={{ borderColor: border }}>
                                <Search size={14} style={{ color: muted }} />
                                <input
                                    autoFocus
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="جستجو..."
                                    className="h-8 w-full bg-transparent text-[12.5px] outline-none"
                                    style={{ color: text }}
                                />
                            </div>

                            <div className="max-h-56 overflow-y-auto p-1.5">
                                {filtered.length === 0 ? (
                                    <p className="px-3 py-4 text-center text-[12px]" style={{ color: muted }}>
                                        موردی یافت نشد
                                    </p>
                                ) : (
                                    filtered.map((item) => {
                                        const id = getId(item);
                                        const active = id === value;

                                        return (
                                            <button
                                                key={id}
                                                type="button"
                                                onClick={() => {
                                                    onChange(id);
                                                    setOpen(false);
                                                    setQuery("");
                                                }}
                                                className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-right text-[12.5px] font-semibold transition"
                                                style={{
                                                    background: active ? "rgba(99,102,241,.1)" : "transparent",
                                                    color: active ? "#6366f1" : text,
                                                }}
                                            >
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate">{getLabel(item)}</span>
                                                    {getSubLabel && (
                                                        <span
                                                            className="mt-0.5 block truncate text-[10.5px] font-medium"
                                                            style={{ color: muted }}
                                                        >
                                                            {getSubLabel(item)}
                                                        </span>
                                                    )}
                                                </span>
                                                {active && <Check size={14} />}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    </>
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
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

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
        if (!loading) onClose();
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

    const bg = isDark ? "#0f172a" : "#ffffff";
    const border = isDark ? "rgba(255,255,255,.06)" : "rgba(15,23,42,.06)";
    const text = isDark ? "#f1f5f9" : "#1e293b";
    const muted = isDark ? "#94a3b8" : "#64748b";
    const inputBg = isDark ? "rgba(255,255,255,.035)" : "rgba(15,23,42,.025)";

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{ background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)" }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border"
                        style={{ background: bg, borderColor: border }}
                    >
                        <div className="flex shrink-0 items-center justify-between px-8 pb-6 pt-8">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                                    style={{
                                        background: isDark ? "rgba(99,102,241,.12)" : "rgba(99,102,241,.08)",
                                    }}
                                >
                                    <Boxes size={15} className="text-indigo-500" />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-extrabold" style={{ color: text }}>
                                        ثبت وظیفه برای انبار
                                    </h3>
                                    <p className="mt-0.5 text-[11px]" style={{ color: muted }}>
                                        درخواست سفارش کالا از انبار
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl disabled:opacity-40"
                                style={{
                                    background: isDark ? "rgba(255,255,255,.05)" : "rgba(15,23,42,.05)",
                                    color: muted,
                                }}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            autoComplete="off"
                            className="flex-1 space-y-4 overflow-y-auto px-8 pb-8"
                        >
                            {lookupsError && (
                                <p className="text-center text-[12px] font-semibold text-red-500">
                                    {lookupsError}
                                </p>
                            )}

                            <div>
                                <label className="mb-1.5 block text-[11.5px] font-bold" style={{ color: muted }}>
                                    تسک مرتبط *
                                </label>
                                <SearchableCombobox<ApiTask>
                                    items={tasks}
                                    value={taskId}
                                    onChange={setTaskId}
                                    getId={(item) => item.id}
                                    getLabel={(item) => item.title}
                                    getSubLabel={(item) => item.department_name}
                                    placeholder={lookupsLoading ? "در حال بارگذاری..." : "انتخاب تسک"}
                                    isDark={isDark}
                                    disabled={loading || lookupsLoading}
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[11.5px] font-bold" style={{ color: muted }}>
                                    محصول *
                                </label>
                                <SearchableCombobox<ApiOrderTaskStockProduct>
                                    items={products}
                                    value={productId}
                                    onChange={setProductId}
                                    getId={(item) => item.product}
                                    getLabel={(item) => item.product_name}
                                    getSubLabel={(item) =>
                                        `${item.current_quantity} ${item.unit_label} موجود`
                                    }
                                    placeholder={lookupsLoading ? "در حال بارگذاری..." : "انتخاب محصول"}
                                    isDark={isDark}
                                    disabled={loading || lookupsLoading}
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[11.5px] font-bold" style={{ color: muted }}>
                                    تعداد درخواستی *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="مثلاً 4"
                                    disabled={loading}
                                    dir="ltr"
                                    className="h-12 w-full rounded-2xl border px-4 text-[13px] font-medium outline-none placeholder:text-slate-400 disabled:opacity-60"
                                    style={{ background: inputBg, borderColor: border, color: text }}
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[11.5px] font-bold" style={{ color: muted }}>
                                    توضیح
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="مثلاً: 4 تا اپل 18 میخوام"
                                    disabled={loading}
                                    rows={3}
                                    className="w-full resize-none rounded-2xl border px-4 py-3 text-[13px] font-medium outline-none placeholder:text-slate-400 disabled:opacity-60"
                                    style={{ background: inputBg, borderColor: border, color: text }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => setTimeModalOpen(true)}
                                    className="flex h-12 items-center justify-center gap-2 rounded-2xl border text-[12.5px] font-bold disabled:opacity-60"
                                    style={{ background: inputBg, borderColor: border, color: text }}
                                >
                                    <Calendar size={15} />
                                    {startedAt && deadline ? "ویرایش بازه زمانی" : "تعیین بازه زمانی"}
                                </button>

                                <label
                                    className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border text-[12.5px] font-bold"
                                    style={{ background: inputBg, borderColor: border, color: text }}
                                >
                                    <Paperclip size={15} />
                                    <span className="truncate px-1">{file ? file.name : "ضمیمه فایل"}</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        disabled={loading}
                                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                    />
                                </label>
                            </div>

                            {startedAt && deadline && (
                                <p className="text-center text-[11px]" style={{ color: muted }}>
                                    بازه: {new Date(startedAt).toLocaleDateString("fa-IR")} تا{" "}
                                    {new Date(deadline).toLocaleDateString("fa-IR")}
                                </p>
                            )}

                            {error && (
                                <p className="text-center text-[12px] font-semibold text-red-500">{error}</p>
                            )}

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileTap={{ scale: 0.97 }}
                                className="flex w-full items-center justify-center rounded-full py-3 text-[13px] font-bold text-white disabled:opacity-50"
                                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                            >
                                {loading ? <Loader size={18} className="animate-spin" /> : "ثبت وظیفه"}
                            </motion.button>
                        </form>
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
            )}
        </AnimatePresence>
    );
}