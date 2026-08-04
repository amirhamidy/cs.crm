"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
    X,
    User,
    Phone,
    Building2,
    MapPin,
    Briefcase,
    FileText,
    CheckCircle2,
} from "lucide-react";
import { Customer, CustomerSource, MOCK_SOURCES } from "./types";

interface AddCustomerModalProps {
    open: boolean;
    onClose: () => void;
    onAdd: (customer: Customer) => void;
}

interface FormState {
    firstName: string;
    lastName: string;
    jobTitle: string;
    company: string;
    phone: string;
    address: string;
    sourceId: string;
    description: string;
}

interface FieldError {
    firstName?: string;
    lastName?: string;
    phone?: string;
    company?: string;
    sourceId?: string;
}

const initialForm: FormState = {
    firstName: "",
    lastName: "",
    jobTitle: "",
    company: "",
    phone: "",
    address: "",
    sourceId: "",
    description: "",
};

function InputField({
    icon: Icon,
    label,
    value,
    onChange,
    placeholder,
    error,
    type = "text",
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    error?: string;
    type?: string;
}) {
    return (
        <motion.div
            animate={error ? { x: [0, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-1"
        >
            <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Icon size={11} />
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full rounded-xl px-3 py-2.5 text-sm
                    bg-gray-50 dark:bg-white/[0.04]
                    border transition-all duration-200 outline-none
                    text-gray-800 dark:text-white
                    placeholder:text-gray-400 dark:placeholder:text-gray-600
                    focus:ring-2 focus:ring-offset-0
                    ${error
                        ? "border-red-400 focus:ring-red-200 dark:focus:ring-red-900"
                        : "border-gray-200 dark:border-white/10 focus:border-gray-400 dark:focus:border-white/30 focus:ring-gray-100 dark:focus:ring-white/5"
                    }`}
            />
            {error && <p className="text-[10px] text-red-400">{error}</p>}
        </motion.div>
    );
}

export default function AddCustomerModal({
    open,
    onClose,
    onAdd,
}: AddCustomerModalProps) {
    const [form, setForm] = useState<FormState>(initialForm);
    const [errors, setErrors] = useState<FieldError>({});
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    const set = (key: keyof FormState) => (val: string) => {
        setForm((prev) => ({ ...prev, [key]: val }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const validate = (): boolean => {
        const newErrors: FieldError = {};
        if (!form.firstName.trim()) newErrors.firstName = "نام الزامیه";
        if (!form.lastName.trim()) newErrors.lastName = "نام خانوادگی الزامیه";
        if (!form.phone.trim()) newErrors.phone = "تلفن الزامیه";
        if (!form.company.trim()) newErrors.company = "شرکت الزامیه";
        if (!form.sourceId) newErrors.sourceId = "منبع آشنایی رو انتخاب کن";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        const source = MOCK_SOURCES.find((s) => s.id === form.sourceId)!;
        const newCustomer: Customer = {
            id: crypto.randomUUID(),
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            jobTitle: form.jobTitle.trim(),
            company: form.company.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            source,
            description: form.description.trim() || undefined,
        };

        setSuccess(true);
        setTimeout(() => {
            onAdd(newCustomer);
            setSuccess(false);
            setForm(initialForm);
            setErrors({});
            onClose();
        }, 1400);
    };

    const handleClose = () => {
        if (success) return;
        setForm(initialForm);
        setErrors({});
        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        onClick={handleClose}
                        className="fixed inset-0 z-40 bg-black/30 dark:bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            key="modal"
                            initial={{ opacity: 0, scale: 0.93, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.93, y: 16 }}
                            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-lg max-h-[90vh] flex flex-col
                                bg-white dark:bg-[#141414]
                                border border-gray-200 dark:border-white/[0.08]
                                rounded-2xl shadow-2xl"
                            dir="rtl"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] flex-shrink-0">
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                        افزودن مشتری
                                    </h2>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        اطلاعات مشتری جدید رو وارد کن
                                    </p>
                                </div>
                                <button
                                    onClick={handleClose}
                                    disabled={success}
                                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white
                                        hover:bg-gray-100 dark:hover:bg-white/[0.06]
                                        transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <InputField
                                        icon={User}
                                        label="نام"
                                        value={form.firstName}
                                        onChange={set("firstName")}
                                        placeholder="علی"
                                        error={errors.firstName}
                                    />
                                    <InputField
                                        icon={User}
                                        label="نام خانوادگی"
                                        value={form.lastName}
                                        onChange={set("lastName")}
                                        placeholder="رضایی"
                                        error={errors.lastName}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <InputField
                                        icon={Briefcase}
                                        label="سمت شغلی"
                                        value={form.jobTitle}
                                        onChange={set("jobTitle")}
                                        placeholder="مدیر فروش"
                                    />
                                    <InputField
                                        icon={Building2}
                                        label="شرکت"
                                        value={form.company}
                                        onChange={set("company")}
                                        placeholder="شرکت نمونه"
                                        error={errors.company}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <InputField
                                        icon={Phone}
                                        label="تلفن"
                                        value={form.phone}
                                        onChange={set("phone")}
                                        placeholder="09120000000"
                                        type="tel"
                                        error={errors.phone}
                                    />
                                    <InputField
                                        icon={MapPin}
                                        label="آدرس"
                                        value={form.address}
                                        onChange={set("address")}
                                        placeholder="تهران، ونک"
                                    />
                                </div>

                                {/* Source chips */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                        منبع آشنایی
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {MOCK_SOURCES.map((source: CustomerSource) => {
                                            const selected = form.sourceId === source.id;
                                            return (
                                                <button
                                                    key={source.id}
                                                    onClick={() => set("sourceId")(source.id)}
                                                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border"
                                                    style={{
                                                        background: selected ? `${source.color}18` : "transparent",
                                                        color: selected ? source.color : "#9ca3af",
                                                        borderColor: selected ? `${source.color}40` : "#e5e7eb",
                                                        boxShadow: selected ? `0 0 0 2px ${source.color}22` : "none",
                                                    }}
                                                >
                                                    {source.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {errors.sourceId && (
                                        <p className="text-[10px] text-red-400">{errors.sourceId}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                        <FileText size={11} />
                                        توضیحات (اختیاری)
                                    </label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => set("description")(e.target.value)}
                                        placeholder="یادداشت یا توضیح اضافه..."
                                        rows={3}
                                        className="w-full rounded-xl px-3 py-2.5 text-sm resize-none
                                            bg-gray-50 dark:bg-white/[0.04]
                                            border border-gray-200 dark:border-white/10
                                            text-gray-800 dark:text-white
                                            placeholder:text-gray-400 dark:placeholder:text-gray-600
                                            focus:border-gray-400 dark:focus:border-white/30
                                            focus:ring-2 focus:ring-gray-100 dark:focus:ring-white/5
                                            outline-none transition-all duration-200"
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] flex-shrink-0">
                                <AnimatePresence mode="wait">
                                    {success ? (
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="flex items-center justify-center gap-2 py-3 rounded-xl
                                                bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium"
                                        >
                                            <CheckCircle2 size={16} />
                                            مشتری با موفقیت اضافه شد
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="actions"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex gap-3"
                                        >
                                            <button
                                                onClick={handleClose}
                                                className="flex-1 py-2.5 rounded-xl text-sm font-medium
                                                    text-gray-500 dark:text-gray-400
                                                    bg-gray-100 dark:bg-white/[0.05]
                                                    hover:bg-gray-200 dark:hover:bg-white/[0.09]
                                                    transition-colors duration-200"
                                            >
                                                انصراف
                                            </button>
                                            <button
                                                onClick={handleSubmit}
                                                className="flex-1 py-2.5 rounded-xl text-sm font-medium
                                                    text-white bg-gray-900 dark:bg-white dark:text-gray-900
                                                    hover:bg-gray-700 dark:hover:bg-gray-100
                                                    transition-colors duration-200"
                                            >
                                                افزودن مشتری
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
