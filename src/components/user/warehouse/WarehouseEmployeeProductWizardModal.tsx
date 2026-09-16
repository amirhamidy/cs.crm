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
    ArrowLeft,
    ArrowRight,
    Check,
    ChevronDown,
    Loader,
    PackagePlus,
    Search,
    X,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type {
    ApiCategory,
    ApiProduct,
    ApiProductInitDraft,
    ApiStockInfo,
    ApiUnitData,
    ApiWarehouseStaff,
} from "@/types/warehouse";

interface WarehouseEmployeeProductWizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: ApiCategory[];
    staff: ApiWarehouseStaff[];
    performedById?: number | null;
    onCreated: (product: ApiProduct, stockInfo?: ApiStockInfo) => void;
}

type Step = 1 | 2 | 3 | 4;

type FormState = {
    name: string;
    salePrice: string;
    category: string;
    unitType: string;
    quantityPerUnit: string;
    quantity: string;
    minimumStock: string;
    maximumStock: string;
};

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

function parseNumber(raw: string): number {
    if (!raw) return NaN;
    const cleaned = String(raw).replace(/,/g, "").trim();
    return cleaned === "" ? NaN : Number(cleaned);
}

function extractError(error: unknown, fallback: string) {
    const data = (
        error as { response?: { data?: Record<string, unknown> | string } }
    )?.response?.data;
    if (!data) return fallback;
    if (typeof data === "string") return data;
    for (const key of [
        "detail",
        "message",
        "error",
        "name",
        "sale_price",
        "category",
        "unit_type",
        "quantity_per_unit",
        "quantity",
        "minimum_stock",
        "maximum_stock",
        "non_field_errors",
    ]) {
        const v = data[key];
        if (typeof v === "string") return v;
        if (Array.isArray(v) && v.length) return String(v[0]);
    }
    return fallback;
}

function getUnitDataKey(unitType: string) {
    const n = unitType.trim().toLowerCase();
    if (["weight", "kg", "gram"].includes(n)) return "weight_unit_data";
    if (["length", "meter", "metre"].includes(n)) return "length_unit_data";
    if (["volume", "liter", "litre"].includes(n)) return "volume_unit_data";
    if (["count", "piece", "unit"].includes(n)) return "count_unit_data";
    return `${n}_unit_data`;
}

function getUnitOptions(): Option[] {
    return [
        { value: "count", label: "عددی" },
        { value: "weight", label: "وزنی" },
        { value: "length", label: "طولی" },
        { value: "volume", label: "حجمی" },
    ];
}

/* ------------------------------ FloatingInput ------------------------------ */

interface FloatingInputProps
    extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
    numeric?: boolean;
    onValueChange?: (value: string) => void;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
    (
        { label, id, className = "", numeric = false, onValueChange, ...props },
        ref
    ) => {
        function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
            const raw = e.target.value;
            const next = numeric ? formatNumber(raw) : raw;
            if (onValueChange) onValueChange(next);
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

/* ------------------------------ NiceSelect ------------------------------ */

function NiceSelect({
    label,
    options,
    value,
    onChange,
    disabled,
    emptyText,
}: {
    label: string;
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    emptyText: string;
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
                                    className="max-h-48 p-1.5"
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
                                                    initial={{
                                                        opacity: 0,
                                                        x: 6,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        x: 0,
                                                    }}
                                                    transition={{
                                                        delay: i * 0.02,
                                                    }}
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

/* ============================== component ============================== */

export default function WarehouseEmployeeProductWizardModal({
    isOpen,
    onClose,
    categories,
    staff,
    performedById,
    onCreated,
}: WarehouseEmployeeProductWizardModalProps) {
    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [createdProduct, setCreatedProduct] = useState<ApiProduct | null>(null);
    const [createdStock, setCreatedStock] = useState<ApiStockInfo>();
    const [selectedStaff, setSelectedStaff] = useState("");

    const [form, setForm] = useState<FormState>({
        name: "",
        salePrice: "",
        category: "",
        unitType: "count",
        quantityPerUnit: "1",
        quantity: "",
        minimumStock: "",
        maximumStock: "",
    });

    useEffect(() => {
        if (!isOpen) return;
        setStep(1);
        setLoading(false);
        setError("");
        setCreatedProduct(null);
        setCreatedStock(undefined);
        setSelectedStaff(
            performedById != null
                ? String(performedById)
                : staff.length === 1
                    ? String(staff[0].id)
                    : ""
        );
        setForm({
            name: "",
            salePrice: "",
            category: "",
            unitType: "count",
            quantityPerUnit: "1",
            quantity: "",
            minimumStock: "",
            maximumStock: "",
        });
    }, [isOpen, performedById, staff]);

    function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [field]: value }));
        setError("");
    }

    function closeModal() {
        if (!loading) onClose();
    }

    function validateStepOne() {
        if (!form.name.trim()) return setError("نام محصول را وارد کنید"), false;
        if (!form.salePrice) return setError("قیمت فروش را وارد کنید"), false;
        const salePrice = parseNumber(form.salePrice);
        if (!Number.isFinite(salePrice) || salePrice < 0)
            return setError("قیمت فروش معتبر نیست"), false;
        if (!form.category) return setError("دسته‌بندی را انتخاب کنید"), false;
        if (!form.unitType) return setError("واحد محصول را انتخاب کنید"), false;
        return true;
    }

    function validateStepTwo() {
        if (!form.quantityPerUnit) return setError("مقدار واحد را وارد کنید"), false;
        const value = parseNumber(form.quantityPerUnit);
        if (!Number.isFinite(value) || value <= 0)
            return setError("مقدار واحد معتبر نیست"), false;
        return true;
    }

    function validateStepThree() {
        if (!selectedStaff) return setError("اطلاعات ثبت موجودی کامل نیست"), false;
        if (!form.quantity) return setError("موجودی فعلی را وارد کنید"), false;
        if (!form.minimumStock) return setError("حداقل موجودی را وارد کنید"), false;
        if (!form.maximumStock) return setError("حداکثر موجودی را وارد کنید"), false;
        const quantity = parseNumber(form.quantity);
        const minimum = parseNumber(form.minimumStock);
        const maximum = parseNumber(form.maximumStock);
        if (![quantity, minimum, maximum].every(Number.isFinite))
            return setError("مقادیر موجودی معتبر نیستند"), false;
        if (quantity < 0 || minimum < 0 || maximum < 0)
            return setError("مقادیر موجودی نمی‌توانند منفی باشند"), false;
        if (minimum > maximum)
            return setError("حداقل موجودی نمی‌تواند بیشتر از حداکثر موجودی باشد"), false;
        if (quantity > maximum)
            return setError("موجودی فعلی نمی‌تواند بیشتر از حداکثر موجودی باشد"), false;
        return true;
    }

    async function createProduct() {
        if (!validateStepTwo()) return;
        setLoading(true);
        setError("");
        try {
            const unitType = form.unitType as ApiProduct["unit_type"];
            const initPayload: ApiProductInitDraft = {
                name: form.name.trim(),
                sale_price: parseNumber(form.salePrice),
                category: Number(form.category),
                unit_type: unitType,
            };
            const initResponse = await axiosInstance.post<ApiProduct>(
                "/warehouse/api/v1/products/create-Init/",
                initPayload
            );
            const product = initResponse.data;
            const unitData: ApiUnitData = {
                quantity_per_unit: parseNumber(form.quantityPerUnit),
            };
            const createPayload: Record<string, unknown> = {
                ...initPayload,
                [getUnitDataKey(form.unitType)]: unitData,
            };
            const createResponse = await axiosInstance.post<ApiProduct>(
                "/warehouse/api/v1/products/create/",
                createPayload
            );
            const finalProduct =
                createResponse.data?.id != null ? createResponse.data : product;
            setCreatedProduct(finalProduct);
            setStep(3);
        } catch (err) {
            setError(extractError(err, "خطا در ایجاد محصول"));
        } finally {
            setLoading(false);
        }
    }

    async function createInitialStock() {
        if (!createdProduct) return setError("محصول ایجاد نشده است");
        if (!validateStepThree()) return;
        setLoading(true);
        setError("");
        try {
            const response = await axiosInstance.post<ApiStockInfo>(
                "/warehouse/api/v1/process/stock/initial/",
                {
                    product_id: createdProduct.id,
                    performed_by_id: Number(selectedStaff),
                    quantity: parseNumber(form.quantity),
                    minimum_stock: parseNumber(form.minimumStock),
                    maximum_stock: parseNumber(form.maximumStock),
                }
            );
            setCreatedStock(response.data);
            setStep(4);
            onCreated(createdProduct, response.data);
        } catch (err) {
            setError(extractError(err, "خطا در ثبت موجودی اولیه"));
        } finally {
            setLoading(false);
        }
    }

    function handleNext() {
        if (step === 1) {
            if (!validateStepOne()) return;
            setStep(2);
        } else if (step === 2) {
            void createProduct();
        } else if (step === 3) {
            void createInitialStock();
        }
    }

    const categoryOptions: Option[] = useMemo(
        () =>
            categories.map((item) => ({
                value: String(item.id),
                label: item.name,
            })),
        [categories]
    );

    const staffOptions: Option[] = useMemo(
        () =>
            staff.map((s) => {
                const a = s as unknown as {
                    full_name?: string;
                    username?: string;
                    role?: string;
                };
                return {
                    value: String(s.id),
                    label: a.full_name || a.username || `کارمند ${s.id}`,
                    sub: a.role || undefined,
                };
            }),
        [staff]
    );

    const steps = [1, 2, 3];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={closeModal}
                    className="fixed inset-0 z-[80] flex items-center justify-center px-4"
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
                        dir="rtl"
                        className="flex max-h-[90vh] w-full max-w-md flex-col rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]"
                    >
                        <div className="flex shrink-0 items-center justify-between px-8 pb-5 pt-7">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                                    {step === 4 ? (
                                        <Check size={15} className="text-blue-500" />
                                    ) : (
                                        <PackagePlus size={15} className="text-blue-500" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        {step === 4 ? "تکمیل شد" : "افزودن محصول جدید"}
                                    </h3>
                                    <p className="mt-0.5 text-[11px] text-gray-400">
                                        {step === 4
                                            ? "محصول و موجودی اولیه ثبت شد"
                                            : "ایجاد محصول و ثبت موجودی اولیه"}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={loading}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {step < 4 && (
                            <div className="shrink-0 px-8 pb-4">
                                <div className="flex items-center gap-1.5">
                                    {steps.map((n) => (
                                        <div
                                            key={n}
                                            className="h-1 flex-1 rounded-full transition-all duration-300"
                                            style={{
                                                background:
                                                    step >= n
                                                        ? "linear-gradient(90deg,#3b82f6,#60a5fa)"
                                                        : "rgba(0,0,0,0.07)",
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex-1  px-8 pb-2">
                            <div className="flex flex-col gap-3">
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 4 }}
                                            className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10"
                                        >
                                            <X
                                                size={14}
                                                className="mt-0.5 shrink-0 text-red-500"
                                            />
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

                                <AnimatePresence mode="wait">
                                    {step === 1 && (
                                        <motion.div
                                            key="step-1"
                                            initial={{ opacity: 0, x: 12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -12 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex flex-col gap-3"
                                        >
                                            <FloatingInput
                                                id="product-name"
                                                label="نام محصول"
                                                value={form.name}
                                                onValueChange={(v) =>
                                                    updateField("name", v)
                                                }
                                                disabled={loading}
                                            />

                                            <div className="grid grid-cols-2 gap-3">
                                                <FloatingInput
                                                    id="product-sale-price"
                                                    label="قیمت فروش"
                                                    numeric
                                                    dir="ltr"
                                                    value={form.salePrice}
                                                    onValueChange={(v) =>
                                                        updateField("salePrice", v)
                                                    }
                                                    disabled={loading}
                                                />

                                                <NiceSelect
                                                    label="دسته‌بندی"
                                                    emptyText="دسته‌بندی‌ای یافت نشد"
                                                    value={form.category}
                                                    options={categoryOptions}
                                                    disabled={loading}
                                                    onChange={(v) =>
                                                        updateField("category", v)
                                                    }
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 2 && (
                                        <motion.div
                                            key="step-2"
                                            initial={{ opacity: 0, x: 12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -12 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex flex-col gap-3"
                                        >
                                            <NiceSelect
                                                label="واحد محصول"
                                                emptyText="واحدی یافت نشد"
                                                value={form.unitType}
                                                options={getUnitOptions()}
                                                disabled={loading}
                                                onChange={(v) =>
                                                    updateField("unitType", v)
                                                }
                                            />

                                            <FloatingInput
                                                id="quantity-per-unit"
                                                label="مقدار در هر واحد"
                                                numeric
                                                dir="ltr"
                                                value={form.quantityPerUnit}
                                                onValueChange={(v) =>
                                                    updateField("quantityPerUnit", v)
                                                }
                                                disabled={loading}
                                            />
                                        </motion.div>
                                    )}

                                    {step === 3 && (
                                        <motion.div
                                            key="step-3"
                                            initial={{ opacity: 0, x: 12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -12 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex flex-col gap-3"
                                        >
                                            <FloatingInput
                                                id="current-stock"
                                                label="موجودی فعلی"
                                                numeric
                                                dir="ltr"
                                                value={form.quantity}
                                                onValueChange={(v) =>
                                                    updateField("quantity", v)
                                                }
                                                disabled={loading}
                                            />

                                            <div className="grid grid-cols-2 gap-3">
                                                <FloatingInput
                                                    id="minimum-stock"
                                                    label="حداقل موجودی"
                                                    numeric
                                                    dir="ltr"
                                                    value={form.minimumStock}
                                                    onValueChange={(v) =>
                                                        updateField("minimumStock", v)
                                                    }
                                                    disabled={loading}
                                                />
                                                <FloatingInput
                                                    id="maximum-stock"
                                                    label="حداکثر موجودی"
                                                    numeric
                                                    dir="ltr"
                                                    value={form.maximumStock}
                                                    onValueChange={(v) =>
                                                        updateField("maximumStock", v)
                                                    }
                                                    disabled={loading}
                                                />
                                            </div>

                                            {staffOptions.length > 1 && (
                                                <NiceSelect
                                                    label="ثبت‌کننده"
                                                    emptyText="کارمندی یافت نشد"
                                                    value={selectedStaff}
                                                    options={staffOptions}
                                                    disabled={loading}
                                                    onChange={(v) =>
                                                        setSelectedStaff(v)
                                                    }
                                                />
                                            )}
                                        </motion.div>
                                    )}

                                    {step === 4 && (
                                        <motion.div
                                            key="step-4"
                                            initial={{ opacity: 0, scale: 0.97 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="flex flex-col items-center py-8 text-center"
                                        >
                                            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-emerald-50 dark:bg-emerald-500/10">
                                                <Check
                                                    size={38}
                                                    className="text-emerald-500"
                                                    strokeWidth={3}
                                                />
                                            </div>

                                            <h3 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                                                محصول با موفقیت ایجاد شد
                                            </h3>

                                            <p className="mt-2 max-w-sm text-[12px] leading-6 text-gray-400">
                                                محصول{" "}
                                                <span className="font-bold text-gray-700 dark:text-gray-200">
                                                    {createdProduct?.name}
                                                </span>{" "}
                                                ایجاد شد و موجودی اولیه آن نیز ثبت گردید.
                                            </p>

                                            {createdStock && (
                                                <div className="mt-5 rounded-2xl bg-gray-50 px-5 py-3 text-[12px] font-bold text-gray-700 dark:bg-white/[0.04] dark:text-gray-200">
                                                    موجودی اولیه:{" "}
                                                    {formatNumber(
                                                        String(createdStock.current_quantity)
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 px-8 pb-7 pt-5">
                            {step > 1 && step < 4 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setError("");
                                        setStep((prev) => (prev - 1) as Step);
                                    }}
                                    disabled={loading}
                                    className="flex h-11 items-center justify-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-5 text-[12.5px] font-bold text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-40 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white/50 dark:hover:text-white/80"
                                >
                                    <ArrowRight size={14} />
                                    قبل
                                </button>
                            )}

                            {step < 4 && (
                                <motion.button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={loading}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 text-[12.5px] font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
                                >
                                    {loading ? (
                                        <Loader size={15} className="animate-spin" />
                                    ) : (
                                        <>
                                            {step === 2
                                                ? "ایجاد محصول"
                                                : step === 3
                                                    ? "ثبت موجودی"
                                                    : "ادامه"}
                                            <ArrowLeft size={14} />
                                        </>
                                    )}
                                </motion.button>
                            )}

                            {step === 4 && (
                                <motion.button
                                    type="button"
                                    onClick={onClose}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex h-11 w-full items-center justify-center rounded-full bg-blue-600 text-[12.5px] font-bold text-white transition-colors hover:bg-blue-500"
                                >
                                    بستن
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}