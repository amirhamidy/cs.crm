"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
    forwardRef,
    useLayoutEffect,
    type InputHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Boxes,
    Check,
    ChevronDown,
    Loader,
    Search,
    X,
} from "lucide-react";
import type { AxiosError } from "axios";
import axiosInstance from "@/lib/axiosInstance";
import {
    ApiProduct,
    ApiStockTransaction,
    ApiWarehouseStaff,
    STOCK_OUT_REASON_OPTIONS,
    StockOutReason,
} from "@/types/warehouse";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    product: ApiProduct;
    staff: ApiWarehouseStaff[];
    performedById?: number | string | null;
    onCompleted: (transaction: ApiStockTransaction) => void;
}

type Mode = "in" | "out";
type Option = { value: string; label: string; sub?: string };

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
            : Array.from(String(seed)).reduce((a, c) => a + c.charCodeAt(0), 0);
    return GRADIENTS[Math.abs(n) % GRADIENTS.length];
}

const initialOf = (text: string) => {
    const clean = (text || "").trim();
    return clean ? clean.charAt(0) : "؟";
};

function formatNumber(raw: string) {
    if (!raw) return "";
    let str = String(raw).replace(/,/g, "").trim();
    if (!str) return "";
    const neg = str.startsWith("-");
    if (neg) str = str.slice(1);
    const parts = str.split(".");
    const intPart = parts[0].replace(/[^\d]/g, "");
    const decPart =
        parts.length > 1 ? parts[1].replace(/[^\d]/g, "") : undefined;
    let out = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (decPart !== undefined) out += "." + decPart;
    return (neg ? "-" : "") + out;
}

const parseNumber = (raw: string) => {
    if (!raw) return NaN;
    const cleaned = String(raw).replace(/,/g, "").trim();
    return cleaned === "" ? NaN : Number(cleaned);
};

function getErrorMessage(error: unknown) {
    const data = (error as AxiosError<Record<string, unknown>>).response?.data;
    if (!data) return "خطا در ثبت تراکنش انبار";
    for (const key of ["detail", "quantity", "reason", "message", "error", "non_field_errors"]) {
        const value = data[key];
        if (typeof value === "string") return value;
        if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }
    return "خطا در ثبت تراکنش انبار";
}

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
    numeric?: boolean;
    onValueChange?: (value: string) => void;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
    ({ label, id, className = "", numeric = false, onValueChange, ...props }, ref) => {
        function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
            const raw = e.target.value;
            onValueChange?.(numeric ? formatNumber(raw) : raw);
            props.onChange?.(e);
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
                    onChange={handleChange}
                    className={`peer w-full border border-gray-200 rounded-4xl px-5 py-3.5 text-sm text-black outline-none transition-all duration-200 focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-blue-500 ${className}`}
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

function NiceSelect({
    label,
    options,
    value,
    onChange,
    disabled,
}: {
    label: string;
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
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
        const update = () => {
            const r = triggerRef.current!.getBoundingClientRect();
            setCoords({ top: r.bottom, left: r.left, width: r.width });
        };
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
        const handler = (e: MouseEvent) => {
            const t = e.target as Node;
            if (!triggerRef.current?.contains(t) && !panelRef.current?.contains(t))
                setOpen(false);
        };
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
        return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
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
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(selected.value)}`}
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
                                transition={{ type: "spring", damping: 24, stiffness: 340 }}
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

                                <div
                                    className="max-h-48 overflow-y-auto p-1.5"
                                    style={{ scrollbarWidth: "thin" }}
                                >
                                    {visible.length === 0 ? (
                                        <p className="py-6 text-center text-[12px] text-gray-400">
                                            موردی یافت نشد
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
                                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[12px] font-extrabold text-white ${gradientOf(o.value)}`}
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
                                                            <Check size={11} className="text-white" strokeWidth={3} />
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

export default function WarehouseEmployeeStockModal({
    isOpen,
    onClose,
    product,
    staff,
    performedById,
    onCompleted,
}: Props) {
    const [mode, setMode] = useState<Mode>("in");
    const [quantity, setQuantity] = useState("");
    const [reason, setReason] = useState<StockOutReason>("sale");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const resolvedPerformedById = useMemo(() => {
        if (performedById != null && Number(performedById) > 0)
            return Number(performedById);
        if (staff.length === 1 && Number(staff[0]?.id) > 0)
            return Number(staff[0].id);
        return NaN;
    }, [performedById, staff]);

    useEffect(() => {
        if (!isOpen) return;
        setMode("in");
        setQuantity("");
        setReason("sale");
        setNote("");
        setError("");
    }, [isOpen]);

    const reasonOptions: Option[] = useMemo(
        () => STOCK_OUT_REASON_OPTIONS.map((item) => ({
            value: item.value,
            label: item.label,
        })),
        []
    );

    const quantityValue = parseNumber(quantity);
    const quantityValid = Number.isFinite(quantityValue) && quantityValue > 0;
    const noteValid = note.trim().length > 0;
    const canSubmit = quantityValid && noteValid && !loading;

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (!Number.isFinite(resolvedPerformedById)) {
            setError("اطلاعات کارمند انبار یافت نشد");
            return;
        }

        if (!quantityValid) {
            setError("تعداد معتبر وارد کنید");
            return;
        }

        if (!noteValid) {
            setError("توضیحات الزامی است");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const endpoint =
                mode === "in"
                    ? "/warehouse/api/v1/process/stock/in/"
                    : "/warehouse/api/v1/process/stock/out/";

            const payload: Record<string, unknown> = {
                product_id: product.id,
                performed_by_id: resolvedPerformedById,
                quantity: quantityValue,
                note: note.trim(),
            };

            if (mode === "out") payload.reason = reason;

            const { data } = await axiosInstance.post<ApiStockTransaction>(
                endpoint,
                payload
            );

            onCompleted(data);
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
                    onClick={() => !loading && onClose()}
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{
                        background: "rgba(0,0,0,0.45)",
                        backdropFilter: "blur(3px)",
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]"
                        dir="rtl"
                    >
                        <div className="flex items-center justify-between px-8 pb-5 pt-7">
                            <div className="flex min-w-0 items-center gap-3">
                                <div
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${mode === "in"
                                            ? "bg-emerald-50 dark:bg-emerald-500/10"
                                            : "bg-red-50 dark:bg-red-500/10"
                                        }`}
                                >
                                    <Boxes
                                        size={15}
                                        className={
                                            mode === "in"
                                                ? "text-emerald-500"
                                                : "text-red-500"
                                        }
                                    />
                                </div>

                                <div className="min-w-0">
                                    <h3 className="truncate text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        {product.name}
                                    </h3>
                                    <p className="mt-0.5 text-[11px] text-gray-400">
                                        مدیریت موجودی محصول
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={loading}
                                onClick={onClose}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <div className="px-8 pb-1">
                            <div className="flex gap-1 rounded-2xl bg-gray-100 p-1 dark:bg-white/[0.04]">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode("in");
                                        setError("");
                                    }}
                                    className="relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12.5px] font-extrabold transition-colors"
                                    style={{
                                        color: mode === "in" ? "#059669" : undefined,
                                    }}
                                >
                                    {mode === "in" && (
                                        <motion.div
                                            layoutId="employee-stock-mode"
                                            className="absolute inset-0 rounded-xl bg-white shadow-sm dark:bg-white/[0.08]"
                                        />
                                    )}
                                    <ArrowDownCircle size={14} className="relative text-current" />
                                    <span className="relative">افزایش موجودی</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode("out");
                                        setError("");
                                    }}
                                    className="relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12.5px] font-extrabold transition-colors"
                                    style={{
                                        color: mode === "out" ? "#dc2626" : undefined,
                                    }}
                                >
                                    {mode === "out" && (
                                        <motion.div
                                            layoutId="employee-stock-mode"
                                            className="absolute inset-0 rounded-xl bg-white shadow-sm dark:bg-white/[0.08]"
                                        />
                                    )}
                                    <ArrowUpCircle size={14} className="relative text-current" />
                                    <span className="relative">کاهش موجودی</span>
                                </button>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-3 px-8 pb-7 pt-5"
                            autoComplete="off"
                        >
                            <FloatingInput
                                id="stock-quantity"
                                label="تعداد"
                                numeric
                                dir="ltr"
                                value={quantity}
                                onValueChange={(v) => {
                                    setQuantity(v);
                                    setError("");
                                }}
                                disabled={loading}
                            />

                            {mode === "out" && (
                                <NiceSelect
                                    label="دلیل خروج"
                                    value={reason}
                                    options={reasonOptions}
                                    disabled={loading}
                                    onChange={(v) => {
                                        setReason(v as StockOutReason);
                                        setError("");
                                    }}
                                />
                            )}

                            <div className="relative">
                                <textarea
                                    id="stock-note"
                                    value={note}
                                    onChange={(e) => {
                                        setNote(e.target.value);
                                        setError("");
                                    }}
                                    placeholder=" "
                                    rows={3}
                                    disabled={loading}
                                    className="peer w-full resize-none rounded-4xl border border-gray-200 px-5 pb-6 pt-4 text-sm text-black outline-none transition-all duration-200 focus:border-gray-400 disabled:opacity-60 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-blue-500"
                                />
                                <label
                                    htmlFor="stock-note"
                                    className="pointer-events-none absolute right-5 top-4 text-sm text-gray-400 transition-all duration-200 bg-white px-1.5 rounded peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-gray-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-500 dark:bg-[#0f172a]"
                                >
                                    توضیحات <span className="text-red-500">*</span>
                                </label>
                                <span className="absolute bottom-2 left-4 text-[10px] font-semibold text-gray-400">
                                    {note.trim().length} کاراکتر
                                </span>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 4 }}
                                        className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10"
                                    >
                                        <X size={14} className="mt-0.5 shrink-0 text-red-500" />
                                        <p className="flex-1 text-[11.5px] font-semibold leading-5 text-red-500 dark:text-red-400">
                                            {error}
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

                            <motion.button
                                type="submit"
                                disabled={!canSubmit}
                                whileTap={{ scale: 0.97 }}
                                className={`mt-1 flex h-11 items-center justify-center gap-2 rounded-full text-[12.5px] font-bold text-white transition-all disabled:opacity-40 ${mode === "in"
                                        ? "bg-emerald-600 hover:bg-emerald-500"
                                        : "bg-red-600 hover:bg-red-500"
                                    }`}
                            >
                                {loading ? (
                                    <Loader size={15} className="animate-spin" />
                                ) : mode === "in" ? (
                                    "ثبت افزایش موجودی"
                                ) : (
                                    "ثبت کاهش موجودی"
                                )}
                            </motion.button>

                            {!noteValid && (
                                <p className="text-center text-[10.5px] font-semibold text-gray-400">
                                    برای فعال شدن دکمه، توضیحات الزامی است
                                </p>
                            )}
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}