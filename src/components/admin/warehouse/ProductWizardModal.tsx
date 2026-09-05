"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader, Package, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import {
    ApiCategory,
    ApiProduct,
    ApiProductInitDraft,
    ApiUnitData,
    ApiWarehouseStaff,
    UNIT_TYPE_OPTIONS,
    UnitType,
    unitDataKey,
} from "@/types/warehouse";
import { FloatingInput, FloatingSelect } from "./FormControls";

interface ProductWizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: ApiCategory[];
    staff: ApiWarehouseStaff[];
    onCreated: (product: ApiProduct) => void;
}

type Step = "basic" | "unit" | "stock" | "done";

function getErrorMessage(err: unknown, fallback: string) {
    const error = err as AxiosError<Record<string, unknown>>;
    const data = error.response?.data;
    if (!data) return fallback;
    const keys = ["detail", "name", "sale_price", "category", "quantity", "message", "error", "non_field_errors"];
    for (const key of keys) {
        const val = data[key];
        if (typeof val === "string") return val;
        if (Array.isArray(val) && typeof val[0] === "string") return val[0];
    }
    return fallback;
}

export default function ProductWizardModal({
    isOpen,
    onClose,
    categories,
    staff,
    onCreated,
}: ProductWizardModalProps) {
    const [step, setStep] = useState<Step>("basic");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [name, setName] = useState("");
    const [salePrice, setSalePrice] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [unitType, setUnitType] = useState<UnitType>("count");

    const [quantityPerUnit, setQuantityPerUnit] = useState("1");
    const [createdProduct, setCreatedProduct] = useState<ApiProduct | null>(null);

    const [performedById, setPerformedById] = useState("");
    const [initialQuantity, setInitialQuantity] = useState("");
    const [minimumStock, setMinimumStock] = useState("");
    const [maximumStock, setMaximumStock] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        setStep("basic");
        setError("");
        setName("");
        setSalePrice("");
        setCategoryId("");
        setUnitType("count");
        setQuantityPerUnit("1");
        setCreatedProduct(null);
        setPerformedById("");
        setInitialQuantity("");
        setMinimumStock("");
        setMaximumStock("");
    }, [isOpen]);

    function handleClose() {
        if (loading) return;
        onClose();
    }

    async function handleBasicSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim() || !salePrice || !categoryId) {
            setError("تمام فیلدها الزامی است");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await axiosInstance.post<ApiProductInitDraft>(
                "/warehouse/api/v1/products/create-Init/",
                {
                    name: name.trim(),
                    sale_price: salePrice,
                    category: Number(categoryId),
                    unit_type: unitType,
                }
            );
            setStep("unit");
        } catch (err) {
            setError(getErrorMessage(err, "خطا در ثبت اطلاعات اولیه"));
        } finally {
            setLoading(false);
        }
    }

    async function handleUnitSubmit(e: React.FormEvent) {
        e.preventDefault();
        const qty = Number(quantityPerUnit);
        if (!qty || qty <= 0) {
            setError("مقدار باید بزرگتر از صفر باشد");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const payload: Record<string, unknown> = {
                name: name.trim(),
                sale_price: salePrice,
                category: Number(categoryId),
                unit_type: unitType,
            };
            payload[unitDataKey(unitType)] = { quantity_per_unit: qty } as ApiUnitData;

            const { data } = await axiosInstance.post<ApiProduct>(
                "/warehouse/api/v1/products/create/",
                payload
            );
            setCreatedProduct(data);
            setStep("stock");
        } catch (err) {
            setError(getErrorMessage(err, "خطا در ثبت محصول"));
        } finally {
            setLoading(false);
        }
    }

    async function handleStockSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!createdProduct) return;

        if (!performedById || !initialQuantity || !minimumStock || !maximumStock) {
            setError("تمام فیلدهای موجودی الزامی است");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await axiosInstance.post("/warehouse/api/v1/process/stock/initial/", {
                product_id: createdProduct.id,
                performed_by_id: Number(performedById),
                quantity: Number(initialQuantity),
                minimum_stock: Number(minimumStock),
                maximum_stock: Number(maximumStock),
            });
            setStep("done");
        } catch (err) {
            setError(getErrorMessage(err, "خطا در ثبت موجودی اولیه"));
        } finally {
            setLoading(false);
        }
    }

    function handleFinish() {
        if (createdProduct) onCreated(createdProduct);
        onClose();
    }

    return (
        <AnimatePresence>
            {isOpen && (
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
                        className="w-full max-w-sm rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]"
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                                    <Package size={15} className="text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        محصول جدید
                                    </h3>
                                    <p className="mt-0.5 text-[11px] text-gray-400">
                                        {step === "basic" && "اطلاعات پایه محصول"}
                                        {step === "unit" && "واحد شمارش محصول"}
                                        {step === "stock" && "موجودی اولیه انبار"}
                                        {step === "done" && "محصول با موفقیت ثبت شد"}
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

                        <div className="mb-6 flex items-center gap-1.5">
                            {(["basic", "unit", "stock"] as Step[]).map((s) => (
                                <div
                                    key={s}
                                    className={`h-1 flex-1 rounded-full transition-colors ${step === s || (step === "done" && s !== "basic") ||
                                            (step === "unit" && s === "basic") ||
                                            (step === "stock" && (s === "basic" || s === "unit")) ||
                                            (step === "done")
                                            ? "bg-blue-500"
                                            : "bg-gray-100 dark:bg-white/[0.08]"
                                        }`}
                                />
                            ))}
                        </div>

                        {step === "basic" && (
                            <form onSubmit={handleBasicSubmit} autoComplete="off" className="flex flex-col gap-5">
                                <FloatingInput
                                    label="نام محصول"
                                    id="wizard_name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setError("");
                                    }}
                                    dir="rtl"
                                />
                                <FloatingInput
                                    label="قیمت فروش (تومان)"
                                    id="wizard_price"
                                    type="number"
                                    value={salePrice}
                                    onChange={(e) => {
                                        setSalePrice(e.target.value);
                                        setError("");
                                    }}
                                    dir="ltr"
                                />
                                <FloatingSelect
                                    label="دسته‌بندی"
                                    id="wizard_category"
                                    value={categoryId}
                                    onChange={(e) => {
                                        setCategoryId(e.target.value);
                                        setError("");
                                    }}
                                    dir="rtl"
                                >
                                    <option value="" disabled>
                                        انتخاب کنید
                                    </option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </FloatingSelect>
                                <FloatingSelect
                                    label="نوع واحد اندازه‌گیری"
                                    id="wizard_unit_type"
                                    value={unitType}
                                    onChange={(e) => setUnitType(e.target.value as UnitType)}
                                    dir="rtl"
                                >
                                    {UNIT_TYPE_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </FloatingSelect>

                                {error && (
                                    <p className="text-center text-[11.5px] font-semibold text-red-500 -mt-2">
                                        {error}
                                    </p>
                                )}

                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex items-center justify-center rounded-full bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                                >
                                    {loading ? <Loader size={18} className="animate-spin" /> : "مرحله بعد"}
                                </motion.button>
                            </form>
                        )}

                        {step === "unit" && (
                            <form onSubmit={handleUnitSubmit} autoComplete="off" className="flex flex-col gap-5">
                                <FloatingInput
                                    label="تعداد در هر بسته"
                                    id="wizard_quantity_per_unit"
                                    type="number"
                                    value={quantityPerUnit}
                                    onChange={(e) => {
                                        setQuantityPerUnit(e.target.value);
                                        setError("");
                                    }}
                                    dir="ltr"
                                />

                                {error && (
                                    <p className="text-center text-[11.5px] font-semibold text-red-500 -mt-2">
                                        {error}
                                    </p>
                                )}

                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex items-center justify-center rounded-full bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                                >
                                    {loading ? <Loader size={18} className="animate-spin" /> : "ثبت محصول"}
                                </motion.button>
                            </form>
                        )}

                        {step === "stock" && (
                            <form onSubmit={handleStockSubmit} autoComplete="off" className="flex flex-col gap-5">
                                <FloatingSelect
                                    label="ثبت‌کننده"
                                    id="wizard_performed_by"
                                    value={performedById}
                                    onChange={(e) => {
                                        setPerformedById(e.target.value);
                                        setError("");
                                    }}
                                    dir="rtl"
                                >
                                    <option value="" disabled>
                                        انتخاب کنید
                                    </option>
                                    {staff.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.full_name}
                                        </option>
                                    ))}
                                </FloatingSelect>

                                <FloatingInput
                                    label="موجودی فعلی"
                                    id="wizard_initial_quantity"
                                    type="number"
                                    value={initialQuantity}
                                    onChange={(e) => {
                                        setInitialQuantity(e.target.value);
                                        setError("");
                                    }}
                                    dir="ltr"
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <FloatingInput
                                        label="حداقل موجودی"
                                        id="wizard_min_stock"
                                        type="number"
                                        value={minimumStock}
                                        onChange={(e) => {
                                            setMinimumStock(e.target.value);
                                            setError("");
                                        }}
                                        dir="ltr"
                                    />
                                    <FloatingInput
                                        label="حداکثر موجودی"
                                        id="wizard_max_stock"
                                        type="number"
                                        value={maximumStock}
                                        onChange={(e) => {
                                            setMaximumStock(e.target.value);
                                            setError("");
                                        }}
                                        dir="ltr"
                                    />
                                </div>

                                {error && (
                                    <p className="text-center text-[11.5px] font-semibold text-red-500 -mt-2">
                                        {error}
                                    </p>
                                )}

                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex items-center justify-center rounded-full bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                                >
                                    {loading ? <Loader size={18} className="animate-spin" /> : "ثبت موجودی اولیه"}
                                </motion.button>
                            </form>
                        )}

                        {step === "done" && (
                            <div className="flex flex-col items-center gap-5 py-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
                                    <CheckCircle2 size={26} className="text-emerald-500" />
                                </div>
                                <p className="text-center text-[12.5px] font-semibold text-gray-600 dark:text-gray-300">
                                    محصول «{name}» با موفقیت به انبار اضافه شد
                                </p>
                                <motion.button
                                    type="button"
                                    onClick={handleFinish}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex w-full items-center justify-center rounded-full bg-emerald-600 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-500"
                                >
                                    بستن
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}