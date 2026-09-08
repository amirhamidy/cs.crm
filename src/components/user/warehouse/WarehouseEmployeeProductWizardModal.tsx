"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft,
    ArrowRight,
    Boxes,
    Check,
    Loader,
    PackagePlus,
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

function extractError(error: any, fallback: string) {
    const data = error?.response?.data;

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
        const value = data[key];

        if (typeof value === "string") return value;

        if (Array.isArray(value) && value.length) {
            return String(value[0]);
        }
    }

    return fallback;
}

function getUnitDataKey(unitType: string) {
    const normalized = unitType.trim().toLowerCase();

    if (normalized === "weight" || normalized === "kg" || normalized === "gram") {
        return "weight_unit_data";
    }

    if (normalized === "length" || normalized === "meter" || normalized === "metre") {
        return "length_unit_data";
    }

    if (normalized === "volume" || normalized === "liter" || normalized === "litre") {
        return "volume_unit_data";
    }

    if (normalized === "count" || normalized === "piece" || normalized === "unit") {
        return "count_unit_data";
    }

    return `${normalized}_unit_data`;
}

function getUnitOptions() {
    return [
        { value: "count", label: "عددی" },
        { value: "weight", label: "وزنی" },
        { value: "length", label: "طولی" },
        { value: "volume", label: "حجمی" },
    ];
}

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
    const [createdStock, setCreatedStock] = useState<ApiStockInfo | undefined>();
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

    function updateField<K extends keyof FormState>(
        field: K,
        value: FormState[K]
    ) {
        setForm(prev => ({
            ...prev,
            [field]: value,
        }));
        setError("");
    }

    function closeModal() {
        if (!loading) onClose();
    }

    function validateStepOne() {
        if (!form.name.trim()) {
            setError("نام محصول را وارد کنید");
            return false;
        }

        if (!form.salePrice) {
            setError("قیمت فروش را وارد کنید");
            return false;
        }

        if (Number(form.salePrice) < 0) {
            setError("قیمت فروش نمی‌تواند منفی باشد");
            return false;
        }

        if (!form.category) {
            setError("دسته‌بندی را انتخاب کنید");
            return false;
        }

        if (!form.unitType) {
            setError("واحد محصول را انتخاب کنید");
            return false;
        }

        return true;
    }

    function validateStepTwo() {
        if (!form.quantityPerUnit) {
            setError("مقدار واحد را وارد کنید");
            return false;
        }

        const value = Number(form.quantityPerUnit);

        if (!Number.isFinite(value) || value <= 0) {
            setError("مقدار واحد معتبر نیست");
            return false;
        }

        return true;
    }

    function validateStepThree() {
        if (!selectedStaff) {
            setError("ثبت‌کننده موجودی را انتخاب کنید");
            return false;
        }

        if (!form.quantity) {
            setError("موجودی فعلی را وارد کنید");
            return false;
        }

        if (!form.minimumStock) {
            setError("حداقل موجودی را وارد کنید");
            return false;
        }

        if (!form.maximumStock) {
            setError("حداکثر موجودی را وارد کنید");
            return false;
        }

        const quantity = Number(form.quantity);
        const minimum = Number(form.minimumStock);
        const maximum = Number(form.maximumStock);

        if (
            !Number.isFinite(quantity) ||
            !Number.isFinite(minimum) ||
            !Number.isFinite(maximum)
        ) {
            setError("مقادیر موجودی معتبر نیستند");
            return false;
        }

        if (quantity < 0 || minimum < 0 || maximum < 0) {
            setError("مقادیر موجودی نمی‌توانند منفی باشند");
            return false;
        }

        if (minimum > maximum) {
            setError("حداقل موجودی نمی‌تواند بیشتر از حداکثر موجودی باشد");
            return false;
        }

        if (quantity > maximum) {
            setError("موجودی فعلی نمی‌تواند بیشتر از حداکثر موجودی باشد");
            return false;
        }

        return true;
    }

    async function createProduct() {
        setLoading(true);
        setError("");

        try {
            const initPayload: ApiProductInitDraft = {
                name: form.name.trim(),
                sale_price: Number(form.salePrice),
                category: Number(form.category),
                unit_type: form.unitType,
            };

            const initResponse = await axiosInstance.post<ApiProduct>(
                "/warehouse/api/v1/products/create-Init/",
                initPayload
            );

            const product = initResponse.data;

            const unitKey = getUnitDataKey(form.unitType);

            const unitData: ApiUnitData = {
                quantity_per_unit: Number(form.quantityPerUnit),
            };

            const createPayload = {
                name: form.name.trim(),
                sale_price: Number(form.salePrice),
                category: Number(form.category),
                unit_type: form.unitType,
                [unitKey]: unitData,
            };

            const createResponse = await axiosInstance.post<ApiProduct>(
                "/warehouse/api/v1/products/create/",
                createPayload
            );

            const finalProduct = createResponse.data?.id
                ? createResponse.data
                : product;

            setCreatedProduct(finalProduct);
            setStep(3);
        } catch (err) {
            setError(extractError(err, "خطا در ایجاد محصول"));
        } finally {
            setLoading(false);
        }
    }

    async function createInitialStock() {
        if (!createdProduct) {
            setError("محصول ایجاد نشده است");
            return;
        }

        if (!validateStepThree()) return;

        setLoading(true);
        setError("");

        try {
            const response = await axiosInstance.post<ApiStockInfo>(
                "/warehouse/api/v1/process/stock/initial/",
                {
                    product_id: createdProduct.id,
                    performed_by_id: Number(selectedStaff),
                    quantity: Number(form.quantity),
                    minimum_stock: Number(form.minimumStock),
                    maximum_stock: Number(form.maximumStock),
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
            return;
        }

        if (step === 2) {
            if (!validateStepTwo()) return;
            void createProduct();
            return;
        }

        if (step === 3) {
            void createInitialStock();
        }
    }

    const bg = isOpen ? "#ffffff" : "#ffffff";
    const isDark =
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark");

    const surface = isDark ? "#0f172a" : "#ffffff";
    const border = isDark ? "rgba(255,255,255,.07)" : "rgba(15,23,42,.07)";
    const text = isDark ? "#f8fafc" : "#172033";
    const muted = isDark ? "#94a3b8" : "#64748b";
    const input = isDark ? "rgba(255,255,255,.04)" : "rgba(15,23,42,.025)";

    const steps = [
        { number: 1, label: "اطلاعات پایه" },
        { number: 2, label: "واحد محصول" },
        { number: 3, label: "موجودی" },
        { number: 4, label: "تکمیل" },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={closeModal}
                    className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: .98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: .98 }}
                        transition={{ duration: .25 }}
                        onClick={e => e.stopPropagation()}
                        dir="rtl"
                        className="w-full max-w-xl overflow-hidden rounded-[2rem] border shadow-2xl"
                        style={{
                            background: surface,
                            borderColor: border,
                        }}
                    >
                        <div className="flex items-center justify-between px-7 pb-5 pt-7">
                            <div className="flex items-center gap-3">
                                <div
                                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                                    style={{
                                        background:
                                            "linear-gradient(135deg,rgba(99,102,241,.14),rgba(139,92,246,.12))",
                                    }}
                                >
                                    {step === 4 ? (
                                        <Check size={21} className="text-indigo-500" />
                                    ) : (
                                        <PackagePlus size={21} className="text-indigo-500" />
                                    )}
                                </div>

                                <div>
                                    <h2
                                        className="text-[15px] font-extrabold"
                                        style={{ color: text }}
                                    >
                                        افزودن محصول جدید
                                    </h2>

                                    <p
                                        className="mt-1 text-[12px]"
                                        style={{ color: muted }}
                                    >
                                        ایجاد محصول و ثبت موجودی اولیه
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={loading}
                                className="flex h-9 w-9 items-center justify-center rounded-xl transition disabled:opacity-40"
                                style={{
                                    background: isDark
                                        ? "rgba(255,255,255,.05)"
                                        : "rgba(15,23,42,.05)",
                                    color: muted,
                                }}
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <div className="px-7 pb-6">
                            <div className="flex items-center gap-2">
                                {steps.map((item, index) => {
                                    const active = step === item.number;
                                    const completed = step > item.number;

                                    return (
                                        <div
                                            key={item.number}
                                            className="flex min-w-0 flex-1 items-center"
                                        >
                                            <div className="flex min-w-0 items-center gap-2">
                                                <div
                                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold transition-all"
                                                    style={{
                                                        background:
                                                            active || completed
                                                                ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                                                                : isDark
                                                                    ? "rgba(255,255,255,.06)"
                                                                    : "rgba(15,23,42,.05)",
                                                        color:
                                                            active || completed
                                                                ? "#fff"
                                                                : muted,
                                                    }}
                                                >
                                                    {completed ? (
                                                        <Check size={14} />
                                                    ) : (
                                                        item.number
                                                    )}
                                                </div>

                                                <span
                                                    className="hidden truncate text-[10px] font-bold sm:block"
                                                    style={{
                                                        color:
                                                            active || completed
                                                                ? text
                                                                : muted,
                                                    }}
                                                >
                                                    {item.label}
                                                </span>
                                            </div>

                                            {index < steps.length - 1 && (
                                                <div
                                                    className="mx-2 h-px flex-1"
                                                    style={{
                                                        background:
                                                            step > item.number
                                                                ? "#6366f1"
                                                                : border,
                                                    }}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="px-7 pb-7">
                            {step === 1 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4"
                                >
                                    <input
                                        value={form.name}
                                        onChange={e =>
                                            updateField("name", e.target.value)
                                        }
                                        placeholder="نام محصول"
                                        disabled={loading}
                                        className="h-12 w-full rounded-2xl border px-4 text-[13px] font-medium outline-none"
                                        style={{
                                            background: input,
                                            borderColor: border,
                                            color: text,
                                        }}
                                    />

                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={form.salePrice}
                                            onChange={e =>
                                                updateField(
                                                    "salePrice",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="قیمت فروش"
                                            disabled={loading}
                                            dir="ltr"
                                            className="h-12 w-full rounded-2xl border px-4 text-[13px] font-medium outline-none"
                                            style={{
                                                background: input,
                                                borderColor: border,
                                                color: text,
                                            }}
                                        />

                                        <select
                                            value={form.category}
                                            onChange={e =>
                                                updateField(
                                                    "category",
                                                    e.target.value
                                                )
                                            }
                                            disabled={loading}
                                            className="h-12 w-full appearance-none rounded-2xl border px-4 text-[13px] font-medium outline-none"
                                            style={{
                                                background: input,
                                                borderColor: border,
                                                color: form.category
                                                    ? text
                                                    : muted,
                                            }}
                                        >
                                            <option value="" disabled>
                                                انتخاب دسته‌بندی
                                            </option>

                                            {categories.map(category => (
                                                <option
                                                    key={category.id}
                                                    value={category.id}
                                                >
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4"
                                >
                                    <div
                                        className="rounded-2xl border p-4"
                                        style={{
                                            background: input,
                                            borderColor: border,
                                        }}
                                    >
                                        <div className="mb-3 flex items-center gap-2">
                                            <Boxes
                                                size={16}
                                                className="text-indigo-500"
                                            />
                                            <span
                                                className="text-[12px] font-bold"
                                                style={{ color: text }}
                                            >
                                                واحد محصول
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            {getUnitOptions().map(unit => {
                                                const active =
                                                    form.unitType === unit.value;

                                                return (
                                                    <button
                                                        key={unit.value}
                                                        type="button"
                                                        onClick={() =>
                                                            updateField(
                                                                "unitType",
                                                                unit.value
                                                            )
                                                        }
                                                        disabled={loading}
                                                        className="rounded-2xl border px-4 py-3 text-right transition"
                                                        style={{
                                                            background: active
                                                                ? "rgba(99,102,241,.1)"
                                                                : "transparent",
                                                            borderColor: active
                                                                ? "rgba(99,102,241,.45)"
                                                                : border,
                                                            color: active
                                                                ? "#6366f1"
                                                                : text,
                                                        }}
                                                    >
                                                        <div className="text-[12px] font-bold">
                                                            {unit.label}
                                                        </div>

                                                        <div
                                                            className="mt-1 text-[10px]"
                                                            style={{
                                                                color: muted,
                                                            }}
                                                        >
                                                            {unit.value}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <input
                                        type="number"
                                        min="0.0001"
                                        step="any"
                                        value={form.quantityPerUnit}
                                        onChange={e =>
                                            updateField(
                                                "quantityPerUnit",
                                                e.target.value
                                            )
                                        }
                                        placeholder="مقدار در هر واحد"
                                        disabled={loading}
                                        dir="ltr"
                                        className="h-12 w-full rounded-2xl border px-4 text-[13px] font-medium outline-none"
                                        style={{
                                            background: input,
                                            borderColor: border,
                                            color: text,
                                        }}
                                    />
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4"
                                >
                                    <select
                                        value={selectedStaff}
                                        onChange={e =>
                                            setSelectedStaff(e.target.value)
                                        }
                                        disabled={loading || Boolean(performedById)}
                                        className="h-12 w-full appearance-none rounded-2xl border px-4 text-[13px] font-medium outline-none disabled:opacity-60"
                                        style={{
                                            background: input,
                                            borderColor: border,
                                            color: text,
                                        }}
                                    >
                                        <option value="" disabled>
                                            انتخاب ثبت‌کننده موجودی
                                        </option>

                                        {staff.map(item => (
                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.full_name}
                                            </option>
                                        ))}
                                    </select>

                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={form.quantity}
                                        onChange={e =>
                                            updateField(
                                                "quantity",
                                                e.target.value
                                            )
                                        }
                                        placeholder="موجودی فعلی"
                                        disabled={loading}
                                        dir="ltr"
                                        className="h-12 w-full rounded-2xl border px-4 text-[13px] font-medium outline-none"
                                        style={{
                                            background: input,
                                            borderColor: border,
                                            color: text,
                                        }}
                                    />

                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={form.minimumStock}
                                            onChange={e =>
                                                updateField(
                                                    "minimumStock",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="حداقل موجودی"
                                            disabled={loading}
                                            dir="ltr"
                                            className="h-12 w-full rounded-2xl border px-4 text-[13px] font-medium outline-none"
                                            style={{
                                                background: input,
                                                borderColor: border,
                                                color: text,
                                            }}
                                        />

                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={form.maximumStock}
                                            onChange={e =>
                                                updateField(
                                                    "maximumStock",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="حداکثر موجودی"
                                            disabled={loading}
                                            dir="ltr"
                                            className="h-12 w-full rounded-2xl border px-4 text-[13px] font-medium outline-none"
                                            style={{
                                                background: input,
                                                borderColor: border,
                                                color: text,
                                            }}
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {step === 4 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: .97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center py-8 text-center"
                                >
                                    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-indigo-500/10">
                                        <Check
                                            size={38}
                                            className="text-indigo-500"
                                        />
                                    </div>

                                    <h3
                                        className="text-[16px] font-extrabold"
                                        style={{ color: text }}
                                    >
                                        محصول با موفقیت ایجاد شد
                                    </h3>

                                    <p
                                        className="mt-2 max-w-sm text-[12px] leading-6"
                                        style={{ color: muted }}
                                    >
                                        محصول {createdProduct?.name} ایجاد شد و
                                        موجودی اولیه آن نیز ثبت گردید.
                                    </p>

                                    {createdStock && (
                                        <div
                                            className="mt-5 rounded-2xl border px-5 py-3 text-[12px] font-bold"
                                            style={{
                                                background: input,
                                                borderColor: border,
                                                color: text,
                                            }}
                                        >
                                            موجودی اولیه:{" "}
                                            {createdStock.current_quantity ??
                                                createdStock.quantity ??
                                                createdStock.stock ??
                                                form.quantity}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {error && (
                                <p className="mt-4 text-center text-[12px] font-semibold leading-5 text-red-500">
                                    {error}
                                </p>
                            )}

                            <div className="mt-6 flex gap-3">
                                {step > 1 && step < 4 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setError("");
                                            setStep(prev => (prev - 1) as Step);
                                        }}
                                        disabled={loading}
                                        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border text-[12px] font-bold disabled:opacity-50"
                                        style={{
                                            borderColor: border,
                                            color: text,
                                        }}
                                    >
                                        <ArrowRight size={15} />
                                        مرحله قبل
                                    </button>
                                )}

                                {step < 4 && (
                                    <motion.button
                                        type="button"
                                        onClick={handleNext}
                                        disabled={loading}
                                        whileTap={{ scale: .97 }}
                                        className="flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-full text-[12px] font-bold text-white disabled:opacity-50"
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
                                            <>
                                                {step === 2
                                                    ? "ایجاد محصول"
                                                    : step === 3
                                                        ? "ثبت موجودی"
                                                        : "ادامه"}
                                                <ArrowLeft size={15} />
                                            </>
                                        )}
                                    </motion.button>
                                )}

                                {step === 4 && (
                                    <motion.button
                                        type="button"
                                        onClick={onClose}
                                        whileTap={{ scale: .97 }}
                                        className="flex h-12 w-full items-center justify-center rounded-full text-[12px] font-bold text-white"
                                        style={{
                                            background:
                                                "linear-gradient(135deg,#6366f1,#8b5cf6)",
                                        }}
                                    >
                                        بستن
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}