"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    Check,
    ChevronDown,
    Loader,
    PackagePlus,
    Search,
    X,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiPurchasingStep, ApiPurchasingTask } from "@/types/purchasing";

interface Product {
    id: number;
    name: string;
    sale_price?: string | number;
    category?: number;
    category_detail?: {
        id: number;
        name: string;
    };
    unit_type?: string;
    count_unit?: number;
    count_unit_detail?: {
        id: number;
        quantity_per_unit: number;
    };
}

interface Warehouse {
    id: number;
    name: string;
    code?: string;
}

interface Props {
    open: boolean;
    steps: ApiPurchasingStep[];
    tasks: ApiPurchasingTask[];
    onClose: () => void;
    onSaved: () => void;
}

interface Option {
    id: number;
    label: string;
    sub?: string;
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

const initialOf = (text: string) =>
    (text || "").trim().charAt(0) || "؟";

const normalizeList = <T,>(value: unknown): T[] => {
    if (Array.isArray(value)) return value as T[];

    if (
        value &&
        typeof value === "object" &&
        "results" in value &&
        Array.isArray((value as { results?: unknown }).results)
    ) {
        return (value as { results: T[] }).results;
    }

    return [];
};

function errorText(error: unknown) {
    const data = (
        error as {
            response?: {
                data?: Record<string, unknown> | string;
            };
        }
    ).response?.data;

    if (!data) return "ایجاد درخواست خرید انجام نشد.";

    if (typeof data === "string") return data;

    for (const key of [
        "warehouse",
        "product",
        "process_step",
        "purchase_quantity",
        "detail",
        "message",
        "error",
        "non_field_errors",
    ]) {
        const value = data[key];

        if (typeof value === "string") return value;

        if (Array.isArray(value) && typeof value[0] === "string") {
            return value[0];
        }
    }

    return "ایجاد درخواست خرید انجام نشد.";
}

function getWarehouseId(task: ApiPurchasingTask) {
    const value = (task as ApiPurchasingTask & {
        warehouse?: number | null;
    }).warehouse;

    return value == null ? null : Number(value);
}

function getWarehouseName(task: ApiPurchasingTask) {
    return (
        (task as ApiPurchasingTask & {
            warehouse_name?: string | null;
        }).warehouse_name || `انبار #${getWarehouseId(task)}`
    );
}

function FloatingInput({
    label,
    id,
    value,
    onChange,
    inputMode,
}: {
    label: string;
    id: string;
    value: string;
    onChange: (value: string) => void;
    inputMode?: "numeric" | "decimal" | "text";
}) {
    return (
        <div className="relative">
            <input
                id={id}
                type="text"
                inputMode={inputMode}
                placeholder=" "
                value={value}
                onChange={(event) => onChange(event.target.value)}
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

function NiceSelect({
    label,
    options,
    value,
    onChange,
    placeholder,
    disabled,
    emptyText,
}: {
    label: string;
    options: Option[];
    value: number | null;
    onChange: (id: number) => void;
    placeholder: string;
    disabled?: boolean;
    emptyText: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    const selectedOptions = options.filter((option) => option.id === value);

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (
                ref.current &&
                !ref.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handler);

        return () => {
            document.removeEventListener("mousedown", handler);
        };
    }, []);

    useEffect(() => {
        if (!open) setQuery("");
    }, [open]);

    useEffect(() => {
        if (disabled) setOpen(false);
    }, [disabled]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();

        return q
            ? options.filter((option) =>
                option.label.toLowerCase().includes(q)
            )
            : options;
    }, [options, query]);

    const selected = selectedOptions[0];

    return (
        <div ref={ref} className="relative">
            <label className="mb-2 block text-[11.5px] font-bold text-gray-400">
                {label}
            </label>

            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((value) => !value)}
                className={`flex h-[52px] w-full items-center gap-2.5 rounded-2xl border px-3 text-right transition-all duration-200 ${open
                        ? "border-blue-500 bg-blue-50/50 dark:border-blue-500/50 dark:bg-blue-500/[0.06]"
                        : "border-gray-100 bg-gray-50 hover:border-gray-200 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12]"
                    } ${disabled
                        ? "cursor-not-allowed opacity-40"
                        : "cursor-pointer"
                    }`}
            >
                {selected ? (
                    <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(
                            selected.id
                        )}`}
                    >
                        {initialOf(selected.label)}
                    </span>
                ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.06]">
                        <PackagePlus
                            size={13}
                            className="text-gray-400"
                        />
                    </span>
                )}

                <span className="min-w-0 flex-1">
                    <span
                        className={`block truncate text-[12.5px] font-bold ${selected
                                ? "text-gray-900 dark:text-white"
                                : "text-gray-400"
                            }`}
                    >
                        {selected?.label || placeholder}
                    </span>

                    {selected?.sub && (
                        <span className="mt-0.5 block truncate text-[10.5px] text-gray-400">
                            {selected.sub}
                        </span>
                    )}
                </span>

                <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown
                        size={14}
                        className="shrink-0 text-gray-400"
                    />
                </motion.span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: -6,
                            scale: 0.97,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                        }}
                        exit={{
                            opacity: 0,
                            y: -4,
                            scale: 0.97,
                        }}
                        transition={{
                            type: "spring",
                            damping: 24,
                            stiffness: 340,
                        }}
                        className="absolute z-50 mt-2 w-full origin-top overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-xl shadow-black/5 dark:border-white/[0.08] dark:bg-[#0f172a] dark:shadow-black/40"
                    >
                        {options.length > 5 && (
                            <div className="border-b border-gray-100 px-3 py-2.5 dark:border-white/[0.06]">
                                <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.04]">
                                    <Search
                                        size={13}
                                        className="shrink-0 text-gray-400"
                                    />

                                    <input
                                        autoFocus
                                        value={query}
                                        onChange={(event) =>
                                            setQuery(event.target.value)
                                        }
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
                                visible.map((option, index) => {
                                    const active =
                                        option.id === value;

                                    return (
                                        <motion.button
                                            key={option.id}
                                            type="button"
                                            initial={{
                                                opacity: 0,
                                                x: 6,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                x: 0,
                                            }}
                                            transition={{
                                                delay: index * 0.02,
                                            }}
                                            onClick={() => {
                                                onChange(option.id);
                                                setOpen(false);
                                            }}
                                            className={`flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-right transition-colors ${active
                                                    ? "bg-blue-50 dark:bg-blue-500/10"
                                                    : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                                                }`}
                                        >
                                            <span
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(
                                                    option.id
                                                )}`}
                                            >
                                                {initialOf(
                                                    option.label
                                                )}
                                            </span>

                                            <span className="min-w-0 flex-1">
                                                <span
                                                    className={`block truncate text-[12.5px] font-bold ${active
                                                            ? "text-blue-600 dark:text-blue-400"
                                                            : "text-gray-900 dark:text-white"
                                                        }`}
                                                >
                                                    {option.label}
                                                </span>

                                                {option.sub && (
                                                    <span className="mt-0.5 block truncate text-[10.5px] text-gray-400">
                                                        {option.sub}
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

export default function PurchasingCreateTaskModal({
    open,
    steps,
    tasks,
    onClose,
    onSaved,
}: Props) {
    const [products, setProducts] = useState<Product[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

    const [productId, setProductId] = useState("");
    const [warehouseId, setWarehouseId] = useState("");
    const [stepId, setStepId] = useState("");
    const [quantity, setQuantity] = useState("");

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;

        setProductId("");
        setWarehouseId("");
        setStepId(
            steps.length > 0
                ? String(
                    [...steps].sort(
                        (a, b) => a.order - b.order
                    )[0].id
                )
                : ""
        );
        setQuantity("");
        setError("");
        setProducts([]);
        setWarehouses([]);
        setLoading(true);

        let cancelled = false;

        Promise.all([
            axiosInstance.get("/warehouse/api/v1/products/"),
            axiosInstance.get("/warehouse/api/v1/process/stock/"),
        ])
            .then(([productsResponse, stockResponse]) => {
                if (cancelled) return;

                const productList = normalizeList<Product>(
                    productsResponse.data
                );

                setProducts(productList);

                const stockList = normalizeList<{
                    warehouse?: number;
                    warehouse_name?: string;
                    warehouse_code?: string;
                }>(stockResponse.data);

                const map = new Map<number, Warehouse>();

                stockList.forEach((item) => {
                    if (item.warehouse == null) return;

                    map.set(Number(item.warehouse), {
                        id: Number(item.warehouse),
                        name:
                            item.warehouse_name ||
                            `انبار #${item.warehouse}`,
                        code: item.warehouse_code,
                    });
                });

                if (map.size > 0) {
                    setWarehouses([...map.values()]);
                } else {
                    const taskWarehouses =
                        new Map<number, Warehouse>();

                    tasks.forEach((task) => {
                        const id = getWarehouseId(task);

                        if (id == null) return;

                        taskWarehouses.set(id, {
                            id,
                            name: getWarehouseName(task),
                        });
                    });

                    setWarehouses([...taskWarehouses.values()]);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(errorText(err));
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [open, steps, tasks]);

    const orderedSteps = useMemo(
        () => [...steps].sort((a, b) => a.order - b.order),
        [steps]
    );

    const selectedProduct = useMemo(
        () =>
            products.find(
                (item) => item.id === Number(productId)
            ),
        [products, productId]
    );

    const selectedStep = useMemo(
        () =>
            orderedSteps.find(
                (item) => item.id === Number(stepId)
            ),
        [orderedSteps, stepId]
    );

    const quantityNumber = Number(
        quantity.replace(/[۰-۹]/g, (digit) =>
            String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
        )
    );

    const canSubmit =
        !loading &&
        !submitting &&
        Number(warehouseId) > 0 &&
        Number(productId) > 0 &&
        Number(stepId) > 0 &&
        Number.isFinite(quantityNumber) &&
        quantityNumber > 0;

    async function submit() {
        if (!canSubmit) return;

        setSubmitting(true);
        setError("");

        try {
            await axiosInstance.post(
                "/purchasing/api/v1/tasks/",
                {
                    warehouse: Number(warehouseId),
                    product: Number(productId),
                    process_step: Number(stepId),
                    purchase_quantity: quantityNumber,
                }
            );

            onSaved();
        } catch (err) {
            setError(errorText(err));
        } finally {
            setSubmitting(false);
        }
    }

    function handleClose() {
        if (submitting) return;
        onClose();
    }

    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
                    style={{
                        background: "rgba(0,0,0,0.45)",
                        backdropFilter: "blur(3px)",
                    }}
                    onMouseDown={handleClose}
                >
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 16,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                            y: 16,
                        }}
                        transition={{
                            duration: 0.35,
                            ease: "easeOut",
                        }}
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                        dir="rtl"
                        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]"
                    >
                        <div className="flex shrink-0 items-center justify-between px-8 pb-6 pt-8">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                                    <PackagePlus
                                        size={15}
                                        className="text-blue-500"
                                    />
                                </div>

                                <div>
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        ایجاد درخواست خرید
                                    </h3>

                                    <p className="mt-0.5 text-[11px] text-gray-400">
                                        افزودن دستی کالا به فرآیند خرید
                                    </p>
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

                        <div className="flex-1 overflow-y-auto px-8 pb-2">
                            <div className="flex flex-col gap-4">
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{
                                                opacity: 0,
                                                y: 6,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                            }}
                                            exit={{
                                                opacity: 0,
                                                y: 4,
                                            }}
                                            className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10"
                                        >
                                            <AlertCircle
                                                size={14}
                                                className="mt-0.5 shrink-0 text-red-500"
                                            />

                                            <p className="flex-1 text-[11.5px] font-semibold leading-5 text-red-500 dark:text-red-400">
                                                {error}
                                            </p>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setError("")
                                                }
                                                className="shrink-0 text-red-400 transition-colors hover:text-red-600"
                                            >
                                                <X size={13} />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {loading ? (
                                    <div className="flex h-48 items-center justify-center">
                                        <Loader
                                            size={22}
                                            className="animate-spin text-blue-500"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <NiceSelect
                                            label="انبار"
                                            placeholder={
                                                warehouses.length
                                                    ? "انتخاب انبار"
                                                    : "انباری برای انتخاب پیدا نشد"
                                            }
                                            emptyText="انباری برای انتخاب پیدا نشد"
                                            options={warehouses.map(
                                                (warehouse) => ({
                                                    id: warehouse.id,
                                                    label: warehouse.name,
                                                    sub: warehouse.code
                                                        ? `کد انبار: ${warehouse.code}`
                                                        : undefined,
                                                })
                                            )}
                                            value={
                                                warehouseId
                                                    ? Number(
                                                        warehouseId
                                                    )
                                                    : null
                                            }
                                            disabled={
                                                warehouses.length === 0
                                            }
                                            onChange={(id) => {
                                                setWarehouseId(
                                                    String(id)
                                                );
                                                setError("");
                                            }}
                                        />

                                        <NiceSelect
                                            label="محصول"
                                            placeholder={
                                                products.length
                                                    ? "انتخاب محصول"
                                                    : "محصولی وجود ندارد"
                                            }
                                            emptyText="محصولی برای انتخاب پیدا نشد"
                                            options={products.map(
                                                (product) => ({
                                                    id: product.id,
                                                    label: product.name,
                                                    sub:
                                                        product.unit_type ||
                                                        undefined,
                                                })
                                            )}
                                            value={
                                                productId
                                                    ? Number(productId)
                                                    : null
                                            }
                                            disabled={
                                                products.length === 0
                                            }
                                            onChange={(id) => {
                                                setProductId(
                                                    String(id)
                                                );
                                                setError("");
                                            }}
                                        />

                                        <AnimatePresence>
                                            {selectedProduct && (
                                                <motion.div
                                                    initial={{
                                                        opacity: 0,
                                                        height: 0,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        height: "auto",
                                                    }}
                                                    exit={{
                                                        opacity: 0,
                                                        height: 0,
                                                    }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="rounded-2xl bg-blue-50 px-3.5 py-3 dark:bg-blue-500/[0.08]">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <span className="text-[10px] font-bold text-gray-400">
                                                                محصول انتخاب‌شده
                                                            </span>

                                                            <span className="truncate text-[11px] font-extrabold text-blue-500">
                                                                {
                                                                    selectedProduct.name
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <NiceSelect
                                            label="مرحله شروع"
                                            placeholder="انتخاب مرحله"
                                            emptyText="مرحله‌ای برای انتخاب وجود ندارد"
                                            options={orderedSteps.map(
                                                (step) => ({
                                                    id: step.id,
                                                    label: `مرحله ${step.order} · ${step.title}`,
                                                    sub: "شروع فرآیند خرید از این مرحله",
                                                })
                                            )}
                                            value={
                                                stepId
                                                    ? Number(stepId)
                                                    : null
                                            }
                                            disabled={
                                                orderedSteps.length === 0
                                            }
                                            onChange={(id) => {
                                                setStepId(
                                                    String(id)
                                                );
                                                setError("");
                                            }}
                                        />

                                        <AnimatePresence>
                                            {selectedStep && (
                                                <motion.div
                                                    initial={{
                                                        opacity: 0,
                                                        height: 0,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        height: "auto",
                                                    }}
                                                    exit={{
                                                        opacity: 0,
                                                        height: 0,
                                                    }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="rounded-2xl bg-gray-50 px-3.5 py-3 dark:bg-white/[0.035]">
                                                        <p className="text-[9.5px] font-bold text-gray-400">
                                                            فرآیند از این مرحله شروع می‌شود
                                                        </p>

                                                        <p className="mt-1 text-[11px] font-extrabold text-gray-700 dark:text-gray-200">
                                                            مرحله{" "}
                                                            {
                                                                selectedStep.order
                                                            }{" "}
                                                            ·{" "}
                                                            {
                                                                selectedStep.title
                                                            }
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <FloatingInput
                                            id="purchase_quantity"
                                            label="مقدار خرید"
                                            value={quantity}
                                            inputMode="numeric"
                                            onChange={(value) => {
                                                setQuantity(value);
                                                setError("");
                                            }}
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 px-8 pb-8 pt-5">
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.97 }}
                                onClick={submit}
                                disabled={!canSubmit}
                                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 text-[13px] font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
                            >
                                {submitting ? (
                                    <Loader
                                        size={15}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Check
                                        size={14}
                                        strokeWidth={3}
                                    />
                                )}

                                ایجاد درخواست
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}