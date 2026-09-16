"use client";

import {
    useEffect,
    useState,
    useRef,
    useMemo,
    useLayoutEffect,
    forwardRef,
    type InputHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Loader, Pencil, Search, X } from "lucide-react";
import type { AxiosError } from "axios";
import axiosInstance from "@/lib/axiosInstance";
import {
    ApiCategory,
    ApiProduct,
    unitDetailKey,
} from "@/types/warehouse";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    product: ApiProduct;
    categories: ApiCategory[];
    onUpdated: (product: ApiProduct) => void;
}

type Option = { value: string; label: string; sub?: string };

/* ------------------------------ helpers ------------------------------ */

const GRADIENTS = [
    "from-blue-500 to-indigo-500",
    "from-violet-500 to-fuchsia-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
    "from-cyan-500 to-sky-500",
];

function gradientOf(seed: string | number) {
    const n =
        typeof seed === "number"
            ? seed
            : Array.from(String(seed)).reduce(
                (acc, ch) => acc + ch.charCodeAt(0),
                0
            );
    return GRADIENTS[Math.abs(n) % GRADIENTS.length];
}

function initialOf(text: string) {
    const clean = (text || "").trim();
    return clean ? clean.charAt(0) : "؟";
}

/** جدا کردن هر 3 رقم با کاما، حفظ نقطه اعشار */
function formatNumber(raw: string): string {
    if (!raw) return "";
    let str = String(raw).replace(/,/g, "").trim();
    if (!str) return "";
    const neg = str.startsWith("-");
    if (neg) str = str.slice(1);
    const parts = str.split(".");
    const intPart = parts[0].replace(/[^\d]/g, "");
    const decPart = parts.length > 1 ? parts[1].replace(/[^\d]/g, "") : undefined;
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    let out = formattedInt;
    if (decPart !== undefined) out += "." + decPart;
    return (neg ? "-" : "") + out;
}

/** تبدیل مقدار فرمت‌شده به عدد خام */
function parseNumber(raw: string): number {
    if (!raw) return NaN;
    const cleaned = String(raw).replace(/,/g, "").trim();
    return cleaned === "" ? NaN : Number(cleaned);
}

/* ------------------------------ FloatingInput ------------------------------ */

interface FloatingInputProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
    label: string;
    id: string;
    /** فعال‌سازی فرمت عددی با کاما */
    numeric?: boolean;
    onValueChange?: (value: string) => void;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
    (
        {
            label,
            id,
            className = "",
            numeric = false,
            onValueChange,
            value,
            ...props
        },
        ref
    ) => {
        function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
            const raw = e.target.value;
            const next = numeric ? formatNumber(raw) : raw;
            onValueChange?.(next);
        }

        return (
            <div className="relative mx-0">
                <input
                    ref={ref}
                    id={id}
                    placeholder=" "
                    type="text"
                    inputMode={numeric ? "decimal" : undefined}
                    autoComplete="new-password"
                    value={value}
                    onChange={handleChange}
                    className={`peer w-full border border-gray-200 rounded-4xl px-5 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-blue-500 ${className}`}
                    {...props}
                />
                <label
                    htmlFor={id}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none transition-all duration-200 bg-white px-1.5 rounded peer-focus:top-0 peer-focus:text-xs peer-focus:text-gray-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-500 dark:bg-[#0f172a]"
                >
                    {label}
                </label>
            </div>
        );
    }
);
FloatingInput.displayName = "FloatingInput";

/* ------------------------------ NiceSelect ------------------------------ */

function NiceSelect({
    label,
    options,
    value,
    onChange,
    disabled,
    emptyText = "موردی یافت نشد",
}: {
    label: string;
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    emptyText?: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [mounted, setMounted] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const selected = useMemo(
        () => options.find((o) => o.value === value),
        [options, value]
    );

    useEffect(() => setMounted(true), []);

    useLayoutEffect(() => {
        if (!open || !triggerRef.current) return;
        function update() {
            const r = triggerRef.current!.getBoundingClientRect();
            setCoords({ top: r.bottom, left: r.left, width: r.width });
        }
        update();
        window.addEventListener("resize", update);
        window.addEventListener("scroll", update, true);
        return () => {
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update, true);
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        function handler(e: MouseEvent) {
            const t = e.target as Node;
            if (
                triggerRef.current?.contains(t) ||
                panelRef.current?.contains(t)
            )
                return;
            setOpen(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    useEffect(() => {
        if (!open) setQuery("");
    }, [open]);

    useEffect(() => {
        if (disabled) setOpen(false);
    }, [disabled]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q
            ? options.filter((o) => o.label.toLowerCase().includes(q))
            : options;
    }, [options, query]);

    return (
        <div className="relative">
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen((v) => !v)}
                className={`flex h-12 w-full items-center gap-2.5 rounded-4xl border px-3 text-right transition-all duration-200 ${open
                        ? "border-blue-500 bg-blue-50/50 dark:border-blue-500/50 dark:bg-blue-500/[0.06]"
                        : "border-gray-200 bg-white hover:border-gray-300 dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-white/[0.12]"
                    } ${disabled ? "pointer-events-none opacity-40" : "cursor-pointer"}`}
            >
                {selected ? (
                    <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(
                            selected.value
                        )}`}
                    >
                        {initialOf(selected.label)}
                    </span>
                ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.06]">
                        <ChevronDown size={13} className="text-gray-400" />
                    </span>
                )}

                <span className="min-w-0 flex-1">
                    <span
                        className={`block truncate text-[12.5px] font-bold ${selected
                                ? "text-gray-900 dark:text-white"
                                : "text-gray-400"
                            }`}
                    >
                        {selected?.label || label}
                    </span>
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

            {mounted &&
                createPortal(
                    <AnimatePresence>
                        {open && !disabled && (
                            <motion.div
                                ref={panelRef}
                                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                                transition={{
                                    type: "spring",
                                    damping: 24,
                                    stiffness: 340,
                                }}
                                style={{
                                    position: "fixed",
                                    top: coords.top + 4,
                                    left: coords.left,
                                    width: coords.width,
                                    zIndex: 100,
                                    transformOrigin: "top center",
                                }}
                                className="overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-xl shadow-black/5 dark:border-white/[0.08] dark:bg-[#0f172a] dark:shadow-black/40"
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
                                                onChange={(e) =>
                                                    setQuery(e.target.value)
                                                }
                                                placeholder="جستجو..."
                                                className="w-full bg-transparent text-[12px] font-semibold text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div
                                    className="max-h-48 overflow-y-auto p-1.5"
                                    style={{ scrollbarWidth: "thin" }}
                                >
                                    {visible.length === 0 ? (
                                        <p className="py-6 text-center text-[12px] text-gray-400">
                                            {emptyText}
                                        </p>
                                    ) : (
                                        visible.map((o, i) => {
                                            const active = o.value === value;
                                            return (
                                                <motion.button
                                                    key={o.value}
                                                    type="button"
                                                    initial={{ opacity: 0, x: 6 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.02 }}
                                                    onClick={() => {
                                                        onChange(o.value);
                                                        setOpen(false);
                                                    }}
                                                    className={`flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-right transition-colors ${active
                                                            ? "bg-blue-50 dark:bg-blue-500/10"
                                                            : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                                                        }`}
                                                >
                                                    <span
                                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(
                                                            o.value
                                                        )}`}
                                                    >
                                                        {initialOf(o.label)}
                                                    </span>

                                                    <span className="min-w-0 flex-1">
                                                        <span
                                                            className={`block truncate text-[12.5px] font-bold ${active
                                                                    ? "text-blue-600 dark:text-blue-400"
                                                                    : "text-gray-900 dark:text-white"
                                                                }`}
                                                        >
                                                            {o.label}
                                                        </span>
                                                        {o.sub && (
                                                            <span className="mt-0.5 block truncate text-[10.5px] text-gray-400">
                                                                {o.sub}
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
                    </AnimatePresence>,
                    document.body
                )}
        </div>
    );
}

/* ------------------------------ helpers ------------------------------ */

function getErrorMessage(error: unknown) {
    const data = (error as AxiosError<Record<string, unknown>>).response?.data;
    if (!data) return "خطا در ویرایش محصول";

    for (const key of [
        "detail",
        "name",
        "sale_price",
        "category",
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

    return "خطا در ویرایش محصول";
}

/* ============================== component ============================== */

export default function WarehouseEmployeeProductEditModal({
    isOpen,
    onClose,
    product,
    categories,
    onUpdated,
}: Props) {
    const [name, setName] = useState("");
    const [salePrice, setSalePrice] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [quantityPerUnit, setQuantityPerUnit] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;

        const detail = product[
            unitDetailKey(product.unit_type)
        ] as { quantity_per_unit?: number } | null | undefined;

        setName(product.name ?? "");
        setSalePrice(formatNumber(String(product.sale_price ?? "")));
        setCategoryId(
            product.category_detail?.id
                ? String(product.category_detail.id)
                : ""
        );
        setQuantityPerUnit(
            detail?.quantity_per_unit != null
                ? formatNumber(String(detail.quantity_per_unit))
                : ""
        );
        setError("");
    }, [isOpen, product]);

    function handleClose() {
        if (loading) return;
        onClose();
    }

    const categoryOptions: Option[] = useMemo(
        () =>
            categories.map((c) => ({
                value: String(c.id),
                label: c.name,
            })),
        [categories]
    );

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!name.trim()) {
            setError("نام محصول الزامی است");
            return;
        }

        if (!categoryId) {
            setError("دسته‌بندی محصول را انتخاب کنید");
            return;
        }

        const priceValue = parseNumber(salePrice);
        if (!Number.isFinite(priceValue) || priceValue < 0) {
            setError("قیمت فروش معتبر وارد کنید");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const payload: Record<string, unknown> = {
                name: name.trim(),
                sale_price: priceValue,
                category: Number(categoryId),
                unit_type: product.unit_type,
            };

            const detailKey = unitDetailKey(product.unit_type);
            const currentDetail = product[detailKey] as
                | { id?: number }
                | null
                | undefined;

            if (currentDetail?.id) {
                const qtyValue = parseNumber(quantityPerUnit);
                payload[`${product.unit_type}_unit`] = currentDetail.id;
                payload[`${product.unit_type}_unit_data`] = {
                    quantity_per_unit: Number.isFinite(qtyValue) ? qtyValue : 1,
                };
            }

            const { data } = await axiosInstance.put<ApiProduct>(
                `/warehouse/api/v1/products/${product.id}/update/`,
                payload
            );

            onUpdated(data);
            onClose();
        } catch (err) {
            setError(getErrorMessage(err));
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
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{
                        background: "rgba(0,0,0,0.45)",
                        backdropFilter: "blur(3px)",
                    }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                        className="w-full max-w-sm overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]"
                    >
                        <div className="flex items-center justify-between px-8 pb-6 pt-8">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                                    <Pencil size={15} className="text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        ویرایش محصول
                                    </h3>
                                    <p className="mt-0.5 text-[12px] text-gray-400">
                                        بروزرسانی اطلاعات محصول
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

                        <form
                            onSubmit={handleSubmit}
                            autoComplete="off"
                            className="flex flex-col gap-4 px-8 pb-8"
                        >
                            <FloatingInput
                                label="نام محصول"
                                id="edit_product_name"
                                type="text"
                                value={name}
                                onValueChange={(v) => {
                                    setName(v);
                                    setError("");
                                }}
                                dir="rtl"
                            />

                            <FloatingInput
                                label="قیمت فروش (تومان)"
                                id="edit_product_price"
                                numeric
                                value={salePrice}
                                onValueChange={(v) => {
                                    setSalePrice(v);
                                    setError("");
                                }}
                                dir="ltr"
                            />

                            <NiceSelect
                                label="دسته‌بندی"
                                value={categoryId}
                                options={categoryOptions}
                                disabled={loading}
                                onChange={(v) => {
                                    setCategoryId(v);
                                    setError("");
                                }}
                                emptyText="دسته‌بندی‌ای یافت نشد"
                            />

                            <FloatingInput
                                label="مقدار در هر بسته"
                                id="edit_product_qty_per_unit"
                                numeric
                                value={quantityPerUnit}
                                onValueChange={(v) => {
                                    setQuantityPerUnit(v);
                                    setError("");
                                }}
                                dir="ltr"
                            />

                            {error && (
                                <p className="-mt-1 text-center text-[12px] font-semibold text-red-500">
                                    {error}
                                </p>
                            )}

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center justify-center rounded-full bg-blue-600 py-3 text-[13px] font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader size={18} className="animate-spin" />
                                ) : (
                                    "ذخیره تغییرات"
                                )}
                            </motion.button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}