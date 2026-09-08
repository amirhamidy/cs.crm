"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Boxes, Loader, X } from "lucide-react";
import { useTheme } from "next-themes";
import type { AxiosError } from "axios";
import axiosInstance from "@/lib/axiosInstance";
import type {
    ApiProduct,
    ApiStockInfo,
    ApiWarehouseStaff,
} from "@/types/warehouse";

interface WarehouseEmployeeInitialStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: ApiProduct;
    staff: ApiWarehouseStaff[];
    performedById?: number | null;
    onCompleted: (stockInfo: ApiStockInfo) => void;
}

function getErrorMessage(err: unknown, fallback: string) {
    const error = err as AxiosError<Record<string, unknown>>;
    const data = error.response?.data;

    if (!data) {
        return fallback;
    }

    for (const key of [
        "detail",
        "quantity",
        "minimum_stock",
        "maximum_stock",
        "performed_by_id",
        "message",
        "error",
        "non_field_errors",
    ]) {
        const value = data[key];

        if (typeof value === "string") {
            return value;
        }

        if (
            Array.isArray(value) &&
            typeof value[0] === "string"
        ) {
            return value[0];
        }
    }

    return fallback;
}

export default function WarehouseEmployeeInitialStockModal({
    isOpen,
    onClose,
    product,
    staff,
    performedById,
    onCompleted,
}: WarehouseEmployeeInitialStockModalProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [selectedStaff, setSelectedStaff] = useState("");
    const [quantity, setQuantity] = useState("");
    const [minimumStock, setMinimumStock] = useState("");
    const [maximumStock, setMaximumStock] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setSelectedStaff(
            performedById != null
                ? String(performedById)
                : staff.length === 1
                    ? String(staff[0].id)
                    : "",
        );

        setQuantity("");
        setMinimumStock("");
        setMaximumStock("");
        setError("");
    }, [isOpen, performedById, staff]);

    function handleClose() {
        if (!loading) {
            onClose();
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (
            !selectedStaff ||
            !quantity ||
            !minimumStock ||
            !maximumStock
        ) {
            setError("تمام فیلدها الزامی است");
            return;
        }

        const qty = Number(quantity);
        const min = Number(minimumStock);
        const max = Number(maximumStock);

        if (
            !Number.isFinite(qty) ||
            !Number.isFinite(min) ||
            !Number.isFinite(max)
        ) {
            setError("مقادیر وارد شده معتبر نیستند");
            return;
        }

        if (qty < 0 || min < 0 || max < 0) {
            setError("مقادیر نمی‌توانند منفی باشند");
            return;
        }

        if (min > max) {
            setError(
                "حداقل موجودی نمی‌تواند بیشتر از حداکثر موجودی باشد",
            );
            return;
        }

        if (qty > max) {
            setError(
                "موجودی فعلی نمی‌تواند بیشتر از حداکثر موجودی باشد",
            );
            return;
        }

        setLoading(true);
        setError("");

        try {
            const { data } = await axiosInstance.post<ApiStockInfo>(
                "/warehouse/api/v1/process/stock/initial/",
                {
                    product_id: product.id,
                    performed_by_id: Number(selectedStaff),
                    quantity: qty,
                    minimum_stock: min,
                    maximum_stock: max,
                },
            );

            onCompleted(data);
            onClose();
        } catch (err) {
            setError(
                getErrorMessage(
                    err,
                    "خطا در ثبت موجودی اولیه",
                ),
            );
        } finally {
            setLoading(false);
        }
    }

    const bg = isDark ? "#0f172a" : "#ffffff";
    const border = isDark
        ? "rgba(255,255,255,.06)"
        : "rgba(15,23,42,.06)";
    const text = isDark ? "#f1f5f9" : "#1e293b";
    const muted = isDark ? "#94a3b8" : "#64748b";
    const inputBg = isDark
        ? "rgba(255,255,255,.035)"
        : "rgba(15,23,42,.025)";

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{
                        background: "rgba(15,23,42,.5)",
                        backdropFilter: "blur(4px)",
                    }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{
                            duration: 0.3,
                            ease: "easeOut",
                        }}
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                        className="w-full max-w-sm overflow-hidden rounded-[2rem] border"
                        style={{
                            background: bg,
                            borderColor: border,
                        }}
                    >
                        <div className="flex items-center justify-between px-8 pb-6 pt-8">
                            <div className="flex min-w-0 items-center gap-2.5">
                                <div
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                                    style={{
                                        background: isDark
                                            ? "rgba(99,102,241,.12)"
                                            : "rgba(99,102,241,.08)",
                                    }}
                                >
                                    <Boxes
                                        size={15}
                                        className="text-indigo-500"
                                    />
                                </div>

                                <div className="min-w-0">
                                    <h3
                                        className="text-[14px] font-extrabold"
                                        style={{ color: text }}
                                    >
                                        ثبت موجودی اولیه
                                    </h3>

                                    <p
                                        className="mt-0.5 truncate text-[12px]"
                                        style={{ color: muted }}
                                    >
                                        {product.name}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl disabled:opacity-40"
                                style={{
                                    background: isDark
                                        ? "rgba(255,255,255,.05)"
                                        : "rgba(15,23,42,.05)",
                                    color: muted,
                                }}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            autoComplete="off"
                            className="flex flex-col gap-4 px-8 pb-8"
                        >
                            <div className="relative">
                                <select
                                    id="employee_initial_stock_staff"
                                    value={selectedStaff}
                                    onChange={(e) => {
                                        setSelectedStaff(
                                            e.target.value,
                                        );
                                        setError("");
                                    }}
                                    disabled={
                                        loading ||
                                        Boolean(performedById)
                                    }
                                    className="h-12 w-full appearance-none rounded-2xl border px-4 text-[13px] font-medium outline-none transition disabled:opacity-60"
                                    style={{
                                        background: inputBg,
                                        borderColor: border,
                                        color: text,
                                    }}
                                >
                                    <option value="" disabled>
                                        انتخاب ثبت‌کننده
                                    </option>

                                    {staff.map((item) => (
                                        <option
                                            key={item.id}
                                            value={item.id}
                                        >
                                            {item.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="relative">
                                <input
                                    id="employee_initial_stock_quantity"
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={quantity}
                                    onChange={(e) => {
                                        setQuantity(
                                            e.target.value,
                                        );
                                        setError("");
                                    }}
                                    placeholder="موجودی فعلی"
                                    disabled={loading}
                                    dir="ltr"
                                    className="h-12 w-full rounded-2xl border px-4 text-[13px] font-medium outline-none transition placeholder:text-slate-400 disabled:opacity-60"
                                    style={{
                                        background: inputBg,
                                        borderColor: border,
                                        color: text,
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    id="employee_initial_stock_min"
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={minimumStock}
                                    onChange={(e) => {
                                        setMinimumStock(
                                            e.target.value,
                                        );
                                        setError("");
                                    }}
                                    placeholder="حداقل موجودی"
                                    disabled={loading}
                                    dir="ltr"
                                    className="h-12 w-full rounded-2xl border px-4 text-[13px] font-medium outline-none placeholder:text-slate-400 disabled:opacity-60"
                                    style={{
                                        background: inputBg,
                                        borderColor: border,
                                        color: text,
                                    }}
                                />

                                <input
                                    id="employee_initial_stock_max"
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={maximumStock}
                                    onChange={(e) => {
                                        setMaximumStock(
                                            e.target.value,
                                        );
                                        setError("");
                                    }}
                                    placeholder="حداکثر موجودی"
                                    disabled={loading}
                                    dir="ltr"
                                    className="h-12 w-full rounded-2xl border px-4 text-[13px] font-medium outline-none placeholder:text-slate-400 disabled:opacity-60"
                                    style={{
                                        background: inputBg,
                                        borderColor: border,
                                        color: text,
                                    }}
                                />
                            </div>

                            {error && (
                                <p className="-mt-1 text-center text-[12px] font-semibold text-red-500">
                                    {error}
                                </p>
                            )}

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center justify-center rounded-full py-3 text-[13px] font-bold text-white disabled:opacity-50"
                                style={{
                                    background:
                                        "linear-gradient(135deg,#6366f1,#8b5cf6)",
                                }}
                            >
                                {loading ? (
                                    <Loader
                                        size={18}
                                        className="animate-spin"
                                    />
                                ) : (
                                    "ثبت موجودی اولیه"
                                )}
                            </motion.button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}