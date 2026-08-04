"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    User,
    Briefcase,
    Phone,
    Building2,
    MapPin,
    FileText,
    Zap,
    ArrowRight,
    CheckCircle2,
} from "lucide-react";
import { MOCK_SOURCES } from "./types";

interface FormField {
    id: string;
    label: string;
    placeholder: string;
    icon: React.ReactNode;
    type?: string;
    required?: boolean;
    colSpan?: boolean;
}

const FIELDS: FormField[] = [
    {
        id: "firstName",
        label: "نام",
        placeholder: "علی",
        icon: <User size={14} />,
        required: true,
    },
    {
        id: "lastName",
        label: "نام خانوادگی",
        placeholder: "محمدی",
        icon: <User size={14} />,
        required: true,
    },
    {
        id: "jobTitle",
        label: "سمت شغلی",
        placeholder: "مدیرعامل",
        icon: <Briefcase size={14} />,
        required: true,
    },
    {
        id: "phone",
        label: "شماره تماس",
        placeholder: "09121234567",
        icon: <Phone size={14} />,
        type: "tel",
        required: true,
    },
    {
        id: "company",
        label: "شرکت",
        placeholder: "شرکت آلفا",
        icon: <Building2 size={14} />,
    },
    {
        id: "address",
        label: "آدرس",
        placeholder: "تهران، ولیعصر",
        icon: <MapPin size={14} />,
        colSpan: true,
    },
];

export default function AddCustomerPage() {
    const router = useRouter();
    const [values, setValues] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [shakeFields, setShakeFields] = useState<Record<string, boolean>>({});
    const [selectedSource, setSelectedSource] = useState<string>("");
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (id: string, val: string) => {
        setValues((prev) => ({ ...prev, [id]: val }));
        if (errors[id]) setErrors((prev) => ({ ...prev, [id]: false }));
    };

    const triggerShake = (fields: string[]) => {
        const shakeMap = Object.fromEntries(fields.map((f) => [f, true]));
        setShakeFields(shakeMap);
        setTimeout(
            () => setShakeFields({}),
            500
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const required = FIELDS.filter((f) => f.required).map((f) => f.id);
        const newErrors: Record<string, boolean> = {};

        required.forEach((id) => {
            if (!values[id]?.trim()) newErrors[id] = true;
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            triggerShake(Object.keys(newErrors));
            return;
        }

        setSubmitted(true);
        setTimeout(() => router.push("/admin/customers"), 1800);
    };

    return (
        <div
            className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] p-6 md:p-8 flex items-start justify-center"
            dir="rtl"
        >
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="w-full max-w-2xl"
            >
                <div className="flex items-center gap-3 mb-8">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.back()}
                        className="p-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-all"
                    >
                        <ArrowRight size={16} />
                    </motion.button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            افزودن مشتری جدید
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            فیلدهای ستاره‌دار اجباری هستند
                        </p>
                    </div>
                </div>

                <div
                    className="relative rounded-2xl border backdrop-blur-xl 
            bg-white/60 dark:bg-white/[0.03]
            border-white/60 dark:border-white/[0.07]"
                    style={{
                        boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 8px 40px 0 rgba(0,0,0,0.08)",
                    }}
                >
                    <div
                        className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none"
                        style={{ background: "#6366f1" }}
                    />
                    <div
                        className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-8 pointer-events-none"
                        style={{ background: "#ec4899" }}
                    />

                    <AnimatePresence>
                        {submitted && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-xl rounded-2xl"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 16 }}
                                    className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-500/25 flex items-center justify-center"
                                >
                                    <CheckCircle2 size={32} className="text-green-500" />
                                </motion.div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    مشتری با موفقیت ثبت شد
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="relative z-10 p-6 md:p-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {FIELDS.map((field, i) => (
                                <motion.div
                                    key={field.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={
                                        shakeFields[field.id]
                                            ? {
                                                opacity: 1,
                                                y: 0,
                                                x: [0, -8, 8, -6, 6, -3, 3, 0],
                                            }
                                            : { opacity: 1, y: 0, x: 0 }
                                    }
                                    transition={
                                        shakeFields[field.id]
                                            ? { duration: 0.45, x: { duration: 0.45 } }
                                            : {
                                                duration: 0.4,
                                                delay: i * 0.06,
                                                ease: [0.23, 1, 0.32, 1],
                                            }
                                    }
                                    className={field.colSpan ? "sm:col-span-2" : ""}
                                >
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                        {field.label}
                                        {field.required && (
                                            <span className="text-red-400 mr-0.5">*</span>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <span
                                            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${errors[field.id]
                                                    ? "text-red-400"
                                                    : "text-gray-400 dark:text-gray-500"
                                                }`}
                                        >
                                            {field.icon}
                                        </span>
                                        <input
                                            type={field.type ?? "text"}
                                            placeholder={field.placeholder}
                                            value={values[field.id] ?? ""}
                                            onChange={(e) => handleChange(field.id, e.target.value)}
                                            className={`w-full pr-9 pl-4 py-2.5 text-sm rounded-xl border transition-all duration-200
                        bg-white/50 dark:bg-white/[0.04]
                        text-gray-900 dark:text-white
                        placeholder:text-gray-300 dark:placeholder:text-gray-600
                        focus:outline-none focus:ring-2
                        ${errors[field.id]
                                                    ? "border-red-400/60 dark:border-red-500/40 focus:ring-red-400/20 bg-red-50/50 dark:bg-red-500/[0.04]"
                                                    : "border-gray-200 dark:border-white/[0.07] focus:ring-indigo-500/25 focus:border-indigo-400/50 dark:focus:border-indigo-500/40"
                                                }
                      `}
                                        />
                                    </div>
                                    {errors[field.id] && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-[11px] text-red-400 mt-1 mr-1"
                                        >
                                            این فیلد اجباری است
                                        </motion.p>
                                    )}
                                </motion.div>
                            ))}

                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.4,
                                    delay: FIELDS.length * 0.06,
                                    ease: [0.23, 1, 0.32, 1],
                                }}
                                className="sm:col-span-2"
                            >
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                    منبع آشنایی
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {MOCK_SOURCES.map((source) => (
                                        <button
                                            key={source.id}
                                            type="button"
                                            onClick={() =>
                                                setSelectedSource((prev) =>
                                                    prev === source.id ? "" : source.id
                                                )
                                            }
                                            className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200"
                                            style={
                                                selectedSource === source.id
                                                    ? {
                                                        background: `${source.color}22`,
                                                        borderColor: `${source.color}55`,
                                                        color: source.color,
                                                        boxShadow: `0 0 0 3px ${source.color}18`,
                                                    }
                                                    : {
                                                        background: "transparent",
                                                        borderColor: "rgba(156,163,175,0.25)",
                                                        color: "#9ca3af",
                                                    }
                                            }
                                        >
                                            {source.label}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.4,
                                    delay: (FIELDS.length + 1) * 0.06,
                                    ease: [0.23, 1, 0.32, 1],
                                }}
                                className="sm:col-span-2"
                            >
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                    توضیحات
                                </label>
                                <div className="relative">
                                    <FileText
                                        size={14}
                                        className="absolute right-3 top-3 text-gray-400 dark:text-gray-500"
                                    />
                                    <textarea
                                        placeholder="یادداشت یا توضیح اضافه..."
                                        value={values["description"] ?? ""}
                                        onChange={(e) => handleChange("description", e.target.value)}
                                        rows={3}
                                        className="w-full pr-9 pl-4 py-2.5 text-sm rounded-xl border resize-none transition-all duration-200
                      bg-white/50 dark:bg-white/[0.04]
                      text-gray-900 dark:text-white
                      placeholder:text-gray-300 dark:placeholder:text-gray-600
                      border-gray-200 dark:border-white/[0.07]
                      focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400/50 dark:focus:border-indigo-500/40"
                                    />
                                </div>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.4,
                                delay: (FIELDS.length + 2) * 0.06,
                                ease: [0.23, 1, 0.32, 1],
                            }}
                            className="flex gap-3 mt-6"
                        >
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                            >
                                انصراف
                            </button>
                            <motion.button
                                type="submit"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white transition-colors shadow-lg shadow-indigo-500/25"
                            >
                                <Zap size={14} />
                                ثبت مشتری
                            </motion.button>
                        </motion.div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
