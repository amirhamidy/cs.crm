"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion as m } from "framer-motion";
import { useTheme } from "next-themes";
import {
    UserPlus, ArrowRight, User, Mail, Shield,
    Briefcase, ChevronDown, Check, Loader2
} from "lucide-react";
import type { User as UserType } from "@/types/users";
import { JOB_TYPE_LABELS, ROLE_LABELS } from "@/types/users";

type FormState = {
    name: string;
    email: string;
    role: UserType["role"] | "";
    jobType: UserType["jobType"] | "";
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const fieldVariants = {
    hidden: { opacity: 0, x: 8 },
    visible: (i: number) => ({
        opacity: 1,
        x: 0,
        transition: { delay: i * 0.06, duration: 0.25, ease: "easeOut" },
    }),
};

const shakeVariants = {
    shake: {
        x: [0, -6, 6, -4, 4, 0],
        transition: { duration: 0.35 },
    },
};

function FieldWrapper({
    index,
    children,
    hasError,
}: {
    index: number;
    children: React.ReactNode;
    hasError?: boolean;
}) {
    return (
        <m.div
            custom={index}
            variants={fieldVariants}
            initial="hidden"
            animate={hasError ? ["visible", "shake"] : "visible"}
            className="w-full"
        >
            {children}
        </m.div>
    );
}

export default function AddUserPage() {
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [mounted, setMounted] = useState(false);

    const [form, setForm] = useState<FormState>({
        name: "",
        email: "",
        role: "",
        jobType: "",
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    function validate(): boolean {
        const e: FormErrors = {};
        if (!form.name.trim()) e.name = "وارد کردن نام الزامی است";
        if (!form.email.trim()) {
            e.email = "وارد کردن ایمیل الزامی است";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            e.email = "فرمت ایمیل صحیح نیست";
        }
        if (!form.role) e.role = "انتخاب نقش سیستم الزامی است";
        if (!form.jobType) e.jobType = "انتخاب نوع همکاری الزامی است";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        await new Promise((r) => setTimeout(r, 900));
        setLoading(false);
        setSubmitted(true);
        await new Promise((r) => setTimeout(r, 300));
        router.push("/admin/users");
    }

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name as keyof FormState]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    }

    const inputBase =
        "w-full rounded-xl text-[13.5px] py-2.5 pl-4 pr-10 outline-none transition-all duration-200 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600";

    const inputClass = (key: keyof FormState) =>
        `${inputBase} border ${errors[key]
            ? "border-red-400 dark:border-red-500/50 bg-red-50/20 dark:bg-red-500/[0.02] focus:border-red-500"
            : form[key]
                ? "border-indigo-400 dark:border-indigo-500/70 bg-indigo-50/40 dark:bg-indigo-500/[0.06]"
                : "border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] focus:border-indigo-400 dark:focus:border-indigo-500/60 focus:bg-white dark:focus:bg-white/[0.06]"
        }`;

    return (
        <m.div
            className="min-h-screen px-4 py-12 flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950 transition-colors duration-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: submitted ? 0 : 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="w-full max-w-lg">
                {/* دکمه بازگشت */}
                <m.button
                    onClick={() => router.back()}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-1.5 text-[12px] font-bold text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 transition-colors mb-5 group focus:outline-none"
                >
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    بازگشت به کاربران
                </m.button>

                {/* کارت اصلی فرم */}
                <div
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/[0.06] overflow-hidden"
                    style={{
                        boxShadow: isDark
                            ? "0 0 0 1px rgba(99,102,241,0.08), 0 4px 24px rgba(99,102,241,0.06)"
                            : "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
                    }}
                >
                    {/* هدر کارت */}
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                            <UserPlus size={15} className="text-indigo-500" />
                        </div>
                        <div>
                            <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                افزودن کاربر جدید
                            </h3>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                مشخصات و دسترسی‌های کاربر جدید سیستم را ثبت کنید.
                            </p>
                        </div>
                    </div>

                    {/* بدنه فرم */}
                    <form onSubmit={handleSubmit} noValidate className="p-5 space-y-4">
                        {/* فیلد نام */}
                        <FieldWrapper index={0} hasError={!!errors.name}>
                            <div>
                                <label className="block text-[11.5px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 pr-1">
                                    نام و نام خانوادگی
                                </label>
                                <div className="relative">
                                    <User
                                        size={14}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
                                    />
                                    <input
                                        name="name"
                                        type="text"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="مثال: علی محمدی"
                                        dir="rtl"
                                        className={inputClass("name")}
                                        autoComplete="off"
                                    />
                                </div>
                                {errors.name && (
                                    <p className="text-[11px] text-red-500 dark:text-red-400 mt-1 pr-1 font-semibold">
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                        </FieldWrapper>

                        {/* فیلد ایمیل */}
                        <FieldWrapper index={1} hasError={!!errors.email}>
                            <div>
                                <label className="block text-[11.5px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 pr-1">
                                    آدرس ایمیل
                                </label>
                                <div className="relative">
                                    <Mail
                                        size={14}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
                                    />
                                    <input
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="email@example.com"
                                        dir="ltr"
                                        className={`${inputClass("email")} text-right`}
                                        autoComplete="off"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-[11px] text-red-500 dark:text-red-400 mt-1 pr-1 font-semibold">
                                        {errors.email}
                                    </p>
                                )}
                            </div>
                        </FieldWrapper>

                        {/* فیلدهای دونیمه (نقش و نوع کار) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* فیلد نقش */}
                            <FieldWrapper index={2} hasError={!!errors.role}>
                                <div>
                                    <label className="block text-[11.5px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 pr-1">
                                        نقش سیستم
                                    </label>
                                    <div className="relative">
                                        <Shield
                                            size={14}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
                                        />
                                        <select
                                            name="role"
                                            value={form.role}
                                            onChange={handleChange}
                                            className={`${inputClass("role")} appearance-none cursor-pointer pr-10`}
                                        >
                                            <option value="" disabled className="bg-white dark:bg-slate-900 text-gray-400">
                                                انتخاب نقش...
                                            </option>
                                            {Object.entries(ROLE_LABELS).map(([val, label]) => (
                                                <option key={val} value={val} className="bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200">
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-400">
                                            {form.role ? (
                                                <Check className="w-3.5 h-3.5 text-indigo-500" />
                                            ) : (
                                                <ChevronDown className="w-3.5 h-3.5" />
                                            )}
                                        </div>
                                    </div>
                                    {errors.role && (
                                        <p className="text-[11px] text-red-500 dark:text-red-400 mt-1 pr-1 font-semibold">
                                            {errors.role}
                                        </p>
                                    )}
                                </div>
                            </FieldWrapper>

                            {/* فیلد نوع کار */}
                            <FieldWrapper index={3} hasError={!!errors.jobType}>
                                <div>
                                    <label className="block text-[11.5px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 pr-1">
                                        نوع همکاری
                                    </label>
                                    <div className="relative">
                                        <Briefcase
                                            size={14}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
                                        />
                                        <select
                                            name="jobType"
                                            value={form.jobType}
                                            onChange={handleChange}
                                            className={`${inputClass("jobType")} appearance-none cursor-pointer pr-10`}
                                        >
                                            <option value="" disabled className="bg-white dark:bg-slate-900 text-gray-400">
                                                نوع کار...
                                            </option>
                                            {Object.entries(JOB_TYPE_LABELS).map(([val, label]) => (
                                                <option key={val} value={val} className="bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200">
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-400">
                                            {form.jobType ? (
                                                <Check className="w-3.5 h-3.5 text-indigo-500" />
                                            ) : (
                                                <ChevronDown className="w-3.5 h-3.5" />
                                            )}
                                        </div>
                                    </div>
                                    {errors.jobType && (
                                        <p className="text-[11px] text-red-500 dark:text-red-400 mt-1 pr-1 font-semibold">
                                            {errors.jobType}
                                        </p>
                                    )}
                                </div>
                            </FieldWrapper>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <m.button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed mr-auto"
                                style={{
                                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                    boxShadow: !loading
                                        ? "0 4px 14px rgba(99,102,241,0.35)"
                                        : "none",
                                }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                        در حال ثبت...
                                    </>
                                ) : (
                                    <>
                                        <Check size={14} />
                                        ثبت کاربر جدید
                                    </>
                                )}
                            </m.button>
                        </div>
                    </form>
                </div>
            </div>
        </m.div>
    );
}
