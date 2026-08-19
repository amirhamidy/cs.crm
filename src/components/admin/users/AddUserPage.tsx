"use client";

import { useState, forwardRef, InputHTMLAttributes } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader, UserPlus, Shield, Eye, EyeOff, Check, ChevronLeft, ChevronRight } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";

type Step1Form = { username: string; phone_number: string; password: string; type: 1 | 2 };
type Step2Form = { full_name: string };
type Step1Errors = Partial<Record<keyof Step1Form, string>>;
type Step2Errors = Partial<Record<keyof Step2Form, string>>;

interface Props {
    onClose: () => void;
    onSuccess: () => void;
    isOpen?: boolean;
}

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
    ({ label, id, className = "", ...props }, ref) => (
        <div className="relative">
            <input
                ref={ref}
                id={id}
                placeholder=" "
                autoComplete="new-password"
                className={`peer w-full border border-gray-200 rounded-4xl px-5 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-gray-400 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:focus:border-blue-500 ${className}`}
                {...props}
            />
            <label
                htmlFor={id}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none transition-all duration-200 bg-white dark:bg-[#0f172a] px-1.5 rounded peer-focus:top-0 peer-focus:text-xs peer-focus:text-gray-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-500"
            >
                {label}
            </label>
        </div>
    )
);
FloatingInput.displayName = "FloatingInput";

function getApiErrorMessage(err: unknown, fallback: string) {
    const data = (err as AxiosError<Record<string, unknown>>).response?.data;
    if (!data) return fallback;
    for (const key of ["detail", "username", "phone_number", "password", "full_name", "non_field_errors", "message", "error"]) {
        const val = data[key];
        if (typeof val === "string") return val;
        if (Array.isArray(val) && typeof val[0] === "string") return val[0];
    }
    return fallback;
}

const PHONE_REGEX = /^09\d{9}$/;

const INITIAL_STEP1: Step1Form = { username: "", phone_number: "", password: "", type: 2 };
const INITIAL_STEP2: Step2Form = { full_name: "" };

export default function AddUserModal({ isOpen, onClose, onSuccess }: Props) {
    const [step, setStep] = useState<1 | 2>(1);
    const [step1, setStep1] = useState<Step1Form>(INITIAL_STEP1);
    const [step2, setStep2] = useState<Step2Form>(INITIAL_STEP2);
    const [errors1, setErrors1] = useState<Step1Errors>({});
    const [errors2, setErrors2] = useState<Step2Errors>({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    function resetAll() {
        setStep(1);
        setStep1(INITIAL_STEP1);
        setStep2(INITIAL_STEP2);
        setErrors1({});
        setErrors2({});
        setApiError("");
        setShowPassword(false);
        setLoading(false);
    }

    function handleClose() {
        if (loading) return;
        resetAll();
        onClose();
    }

    function validateStep1(): boolean {
        const e: Step1Errors = {};
        if (!step1.username.trim()) e.username = "نام کاربری الزامی است";
        if (!step1.phone_number.trim()) e.phone_number = "شماره موبایل الزامی است";
        else if (!PHONE_REGEX.test(step1.phone_number.trim())) e.phone_number = "شماره موبایل معتبر نیست";
        if (!step1.password.trim()) e.password = "رمز عبور الزامی است";
        else if (step1.password.length < 3) e.password = "رمز عبور باید حداقل ۳ کاراکتر باشد";
        setErrors1(e);
        return !Object.keys(e).length;
    }

    function validateStep2(): boolean {
        const e: Step2Errors = {};
        if (!step2.full_name.trim()) e.full_name = "نام کامل الزامی است";
        setErrors2(e);
        return !Object.keys(e).length;
    }

    async function handleStep1Next(e: React.FormEvent) {
        e.preventDefault();
        if (!validateStep1()) return;
        if (step1.type === 1) {
            await submitAll();
        } else {
            setStep(2);
        }
    }

    async function handleStep2Submit(e: React.FormEvent) {
        e.preventDefault();
        if (!validateStep2()) return;
        await submitAll();
    }

    async function deleteUserByUsername(username: string) {
        try {
            const { data: users } = await axiosInstance.get("/accounts/api/v1/user/list/");
            console.log("[rollback] user list:", JSON.stringify(users));
            const user = users.find((u: { id: number; username: string }) => u.username === username);
            if (!user) {
                console.warn("[rollback] user not found for deletion:", username);
                return;
            }
            await axiosInstance.delete(`/accounts/api/v1/user/${user.id}/delete/`);
            console.log("[rollback] user deleted successfully:", user.id);
        } catch (rollbackErr) {
            console.error("[rollback] failed to delete user:", rollbackErr);
        }
    }

    async function submitAll() {
        setLoading(true);
        setApiError("");
        const username = step1.username.trim();

        try {
            const { data: createData } = await axiosInstance.post("/accounts/api/v1/user/create/", {
                username,
                phone_number: step1.phone_number.trim(),
                password: step1.password,
                type: step1.type,
            });
            console.log("[user/create] response:", JSON.stringify(createData));

            if (step1.type === 2) {
                let userId: number | undefined =
                    createData?.id ?? createData?.user?.id ?? createData?.data?.id ?? createData?.data?.user?.id;

                if (!userId) {
                    console.warn("[user/create] id not in response, fetching user list...");
                    const { data: users } = await axiosInstance.get("/accounts/api/v1/user/list/");
                    console.log("[user/list] response:", JSON.stringify(users));
                    const found = users.find((u: { id: number; username: string }) => u.username === username);
                    console.log("[user/list] matched user:", JSON.stringify(found));
                    userId = found?.id;
                }

                if (!userId) {
                    await deleteUserByUsername(username);
                    throw new Error("شناسه کاربر پیدا نشد — کاربر حذف شد");
                }

                try {
                    const { data: empData } = await axiosInstance.post("/accounts/api/v1/employee/create/", {
                        user: userId,
                        full_name: step2.full_name.trim(),
                    });
                    console.log("[employee/create] response:", JSON.stringify(empData));
                } catch (empErr) {
                    console.error("[employee/create] failed:", empErr);
                    await deleteUserByUsername(username);
                    throw empErr;
                }
            }

            resetAll();
            onSuccess();
        } catch (err) {
            console.error("[submitAll] error:", err);
            setApiError(getApiErrorMessage(err, "خطا در ثبت اطلاعات"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <AnimatePresence>
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
                    className="bg-white dark:bg-[#0f172a] rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/[0.06] w-full max-w-sm overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                    dir="rtl"
                >
                    <div className="px-8 pt-8 pb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                <UserPlus size={15} className="text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    {step === 1 ? "افزودن کاربر" : "اطلاعات کارمند"}
                                </h3>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    {step === 1 ? "مرحله ۱ از ۲ — اطلاعات حساب" : "مرحله ۲ از ۲ — مشخصات کارمند"}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-40 bg-gray-100 dark:bg-white/[0.05]"
                        >
                            <X size={15} />
                        </button>
                    </div>

                    <div className="px-8 pb-5 flex gap-1.5">
                        {[1, 2].map((s) => (
                            <div
                                key={s}
                                className="h-1 flex-1 rounded-full transition-all duration-300"
                                style={{
                                    background: step >= s
                                        ? "linear-gradient(90deg,#3b82f6,#60a5fa)"
                                        : "rgba(0,0,0,0.07)",
                                }}
                            />
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.form
                                key="step1"
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.2 }}
                                onSubmit={handleStep1Next}
                                noValidate
                                className="px-8 pb-8 flex flex-col gap-4"
                            >
                                <div>
                                    <FloatingInput
                                        label="نام کاربری"
                                        id="add_username"
                                        type="text"
                                        value={step1.username}
                                        onChange={(e) => { setStep1((p) => ({ ...p, username: e.target.value })); setErrors1((p) => ({ ...p, username: undefined })); setApiError(""); }}
                                        dir="ltr"
                                    />
                                    {errors1.username && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors1.username}</p>}
                                </div>

                                <div>
                                    <FloatingInput
                                        label="شماره موبایل"
                                        id="add_phone_number"
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={11}
                                        value={step1.phone_number}
                                        onChange={(e) => {
                                            const digits = e.target.value.replace(/\D/g, "");
                                            setStep1((p) => ({ ...p, phone_number: digits }));
                                            setErrors1((p) => ({ ...p, phone_number: undefined }));
                                            setApiError("");
                                        }}
                                        dir="ltr"
                                    />
                                    {errors1.phone_number && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors1.phone_number}</p>}
                                </div>

                                <div>
                                    <div className="relative">
                                        <FloatingInput
                                            label="رمز عبور"
                                            id="add_password"
                                            type={showPassword ? "text" : "password"}
                                            value={step1.password}
                                            onChange={(e) => { setStep1((p) => ({ ...p, password: e.target.value })); setErrors1((p) => ({ ...p, password: undefined })); setApiError(""); }}
                                            dir="ltr"
                                            className="pl-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((p) => !p)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {errors1.password && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors1.password}</p>}
                                </div>

                                <div>
                                    <label className="block text-[11.5px] font-bold text-gray-400 mb-2">نوع حساب</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {([{ v: 2, label: "کارمند" }, { v: 1, label: "ادمین" }] as const).map(({ v, label }) => (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() => { setStep1((p) => ({ ...p, type: v })); setApiError(""); }}
                                                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl border text-[12.5px] font-bold transition-all duration-150"
                                                style={{
                                                    borderColor: step1.type === v ? "#3b82f6" : "rgba(0,0,0,0.07)",
                                                    background: step1.type === v ? "rgba(59,130,246,0.07)" : "rgba(0,0,0,0.02)",
                                                    color: step1.type === v ? "#3b82f6" : "#94a3b8",
                                                }}
                                            >
                                                <Shield size={12} />
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {apiError && <p className="text-[11.5px] text-red-500 font-semibold text-center">{apiError}</p>}

                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    whileTap={{ scale: 0.97 }}
                                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-full py-3 text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <Loader size={15} className="animate-spin" />
                                    ) : step1.type === 1 ? (
                                        <><Check size={14} />ثبت ادمین</>
                                    ) : (
                                        <>ادامه<ChevronLeft size={14} /></>
                                    )}
                                </motion.button>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="step2"
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.2 }}
                                onSubmit={handleStep2Submit}
                                noValidate
                                className="px-8 pb-8 flex flex-col gap-4"
                            >
                                <div>
                                    <FloatingInput
                                        label="نام و نام خانوادگی"
                                        id="add_full_name"
                                        type="text"
                                        value={step2.full_name}
                                        onChange={(e) => { setStep2({ full_name: e.target.value }); setErrors2({}); setApiError(""); }}
                                        dir="rtl"
                                    />
                                    {errors2.full_name && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors2.full_name}</p>}
                                </div>

                                {apiError && <p className="text-[11.5px] text-red-500 font-semibold text-center">{apiError}</p>}

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { if (!loading) { setApiError(""); setStep(1); } }}
                                        disabled={loading}
                                        className="w-24 flex items-center justify-center gap-1 py-3 rounded-full text-[12.5px] font-bold disabled:opacity-40 transition-colors bg-gray-100 dark:bg-white/[0.05] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.08]"
                                    >
                                        <ChevronRight size={14} />
                                        برگشت
                                    </button>
                                    <motion.button
                                        type="submit"
                                        disabled={loading}
                                        whileTap={{ scale: 0.97 }}
                                        className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-full py-3 text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader size={18} className="animate-spin" /> : <><Check size={14} />ثبت کارمند</>}
                                    </motion.button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
