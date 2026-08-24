"use client";

import { useState, forwardRef, InputHTMLAttributes } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader, UserPlus, Shield, Eye, EyeOff, Check, ChevronLeft, ChevronRight } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { parseApiErrors, type FieldErrors } from "@/lib/parseApiErrors";

type Step1Form = { username: string; phone_number: string; password: string; type: 1 | 2 };
type Step2Form = { full_name: string };
type Step1Errors = Partial<Record<keyof Step1Form, string>>;
type Step2Errors = Partial<Record<keyof Step2Form, string>>;

interface Props {
    onClose: () => void;
    onSuccess: () => void;
    onNotify?: (message: string, type: "success" | "error") => void;
    isOpen?: boolean;
}

interface NotificationProps {
    message: string;
    type: "success" | "error";
    onClose: () => void;
}

function Notification({ message, type, onClose }: NotificationProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`fixed top-6 left-0 right-0 mx-auto w-fit z-[60] px-4 py-3 rounded-2xl border shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl flex items-center gap-3 ${type === "error"
                ? "bg-white/90 border-red-100 text-red-900"
                : "bg-white/90 border-green-100 text-green-900"
                }`}
        >
            <div className={`w-2 h-2 rounded-full ${type === "error" ? "bg-red-500" : "bg-green-500"}`} />
            <span className="text-sm font-medium tracking-tight pr-1">{message}</span>
            <button
                onClick={onClose}
                className="mr-2 p-1 rounded-full hover:bg-black/5 transition-colors flex items-center justify-center"
            >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 1L13 13M13 1L1 13" />
                </svg>
            </button>
        </motion.div>
    );
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
                className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none transition-all duration-200 bg-white dark:bg-[#0f172a] px-1.5 rounded peer-focus:top-0 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-500"
            >
                {label}
            </label>
        </div>
    )
);
FloatingInput.displayName = "FloatingInput";

const PHONE_REGEX = /^09\d{9}$/;
const INITIAL_STEP1: Step1Form = { username: "", phone_number: "", password: "", type: 2 };
const INITIAL_STEP2: Step2Form = { full_name: "" };

export default function AddUserModal({ onClose, onSuccess, onNotify }: Props) {
    const [step, setStep] = useState<1 | 2>(1);
    const [step1, setStep1] = useState<Step1Form>(INITIAL_STEP1);
    const [step2, setStep2] = useState<Step2Form>(INITIAL_STEP2);
    const [errors1, setErrors1] = useState<Step1Errors>({});
    const [errors2, setErrors2] = useState<Step2Errors>({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState<FieldErrors>({});
    const [showPassword, setShowPassword] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

    function showNotify(message: string, type: "success" | "error") {
        setNotification({ message, type });
        onNotify?.(message, type);
    }

    function resetAll() {
        setStep(1);
        setStep1(INITIAL_STEP1);
        setStep2(INITIAL_STEP2);
        setErrors1({});
        setErrors2({});
        setApiError({});
        setShowPassword(false);
        setLoading(false);
    }

    function handleClose() {
        if (loading) return;
        resetAll();
        setNotification(null);
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
            await submitAdminOnly();
        } else {
            setStep(2);
        }
    }

    async function handleStep2Submit(e: React.FormEvent) {
        e.preventDefault();
        if (!validateStep2()) return;
        await submitEmployeeFull();
    }

    async function deleteUserById(userId: number) {
        try {
            await axiosInstance.delete(`/accounts/api/v1/user/${userId}/delete/`);
        } catch { }
    }

    async function deleteUserByUsername(username: string) {
        try {
            const { data: users } = await axiosInstance.get("/accounts/api/v1/user/list/");
            const found = users.find((u: { id: number; username: string }) => u.username === username);
            if (found?.id) await axiosInstance.delete(`/accounts/api/v1/user/${found.id}/delete/`);
        } catch { }
    }

    async function resolveUserId(createData: Record<string, unknown>, username: string): Promise<number | null> {
        let userId: number | null =
            (createData?.id as number) ??
            (createData?.user as { id: number })?.id ??
            (createData?.data as { id: number })?.id ??
            ((createData?.data as { user: { id: number } })?.user?.id) ??
            null;

        if (!userId) {
            try {
                const { data: users } = await axiosInstance.get("/accounts/api/v1/user/list/");
                const found = users.find((u: { id: number; username: string }) => u.username === username);
                userId = found?.id ?? null;
            } catch { }
        }

        return userId;
    }

    async function submitAdminOnly() {
        setLoading(true);
        setApiError({});
        const username = step1.username.trim();

        try {
            await axiosInstance.post("/accounts/api/v1/user/create/", {
                username,
                phone_number: step1.phone_number.trim(),
                password: step1.password,
                type: 1,
            });

            resetAll();
            showNotify("کاربر با موفقیت ثبت شد", "success");
            onSuccess();
            onClose();
        } catch (err) {
            const parsed = parseApiErrors(err, "خطا در ثبت اطلاعات");
            if (parsed.username || parsed.phone_number || parsed.password) {
                setApiError(parsed);
                showNotify(
                    parsed.username ?? parsed.phone_number ?? parsed.password ?? "خطا در ثبت اطلاعات",
                    "error"
                );
            } else {
                showNotify(parsed.general ?? "خطا در ثبت اطلاعات", "error");
            }
        } finally {
            setLoading(false);
        }
    }

    async function submitEmployeeFull() {
        setLoading(true);
        setApiError({});
        const username = step1.username.trim();

        let userId: number | null = null;

        try {
            const { data: createData } = await axiosInstance.post("/accounts/api/v1/user/create/", {
                username,
                phone_number: step1.phone_number.trim(),
                password: step1.password,
                type: 2,
            });

            userId = await resolveUserId(createData, username);

            if (!userId) {
                await deleteUserByUsername(username);
                showNotify("شناسه کاربر پیدا نشد — کاربر حذف شد", "error");
                setLoading(false);
                return;
            }
        } catch (err) {
            const parsed = parseApiErrors(err, "خطا در ثبت اطلاعات");
            if (parsed.username || parsed.phone_number || parsed.password) {
                setStep(1);
                setApiError(parsed);
                showNotify(
                    parsed.username ?? parsed.phone_number ?? parsed.password ?? "خطا در ثبت اطلاعات",
                    "error"
                );
            } else {
                showNotify(parsed.general ?? "خطا در ثبت اطلاعات", "error");
            }
            setLoading(false);
            return;
        }

        try {
            await axiosInstance.post("/accounts/api/v1/employee/create/", {
                user: userId,
                full_name: step2.full_name.trim(),
            });
        } catch (err) {
            await deleteUserById(userId);
            const parsed = parseApiErrors(err, "خطا در ثبت اطلاعات کارمند");
            if (parsed.full_name) {
                setApiError(parsed);
                showNotify(parsed.full_name, "error");
            } else {
                showNotify(parsed.general ?? "خطا در ثبت اطلاعات کارمند", "error");
            }
            setLoading(false);
            return;
        }

        resetAll();
        showNotify("کاربر با موفقیت ثبت شد", "success");
        onSuccess();
        onClose();
        setLoading(false);
    }

    return (
        <>
            <AnimatePresence>
                {notification && (
                    <Notification
                        key="notification"
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                    />
                )}
            </AnimatePresence>

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
                                            onChange={(e) => {
                                                setStep1((p) => ({ ...p, username: e.target.value }));
                                                setErrors1((p) => ({ ...p, username: undefined }));
                                                setApiError((p) => ({ ...p, username: undefined }));
                                            }}
                                            dir="ltr"
                                        />

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
                                                setApiError((p) => ({ ...p, phone_number: undefined }));
                                            }}
                                            dir="ltr"
                                        />
                                        {(errors1.phone_number || apiError.phone_number) && (
                                            <p className="text-[11px] text-red-500 mt-1 font-semibold">
                                                {errors1.phone_number ?? apiError.phone_number}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <div className="relative">
                                            <FloatingInput
                                                label="رمز عبور"
                                                id="add_password"
                                                type={showPassword ? "text" : "password"}
                                                value={step1.password}
                                                onChange={(e) => {
                                                    setStep1((p) => ({ ...p, password: e.target.value }));
                                                    setErrors1((p) => ({ ...p, password: undefined }));
                                                    setApiError((p) => ({ ...p, password: undefined }));
                                                }}
                                                dir="ltr"
                                                className="pl-12"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((p) => !p)}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        {(errors1.password || apiError.password) && (
                                            <p className="text-[11px] text-red-500 mt-1 font-semibold">
                                                {errors1.password ?? apiError.password}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-[11.5px] font-bold text-gray-400 mb-2">نوع کاربر</label>
                                        <div className="flex gap-2">
                                            {([{ v: 2, label: "کارمند" }, { v: 1, label: "ادمین" }] as const).map(({ v, label }) => (
                                                <button
                                                    key={v}
                                                    type="button"
                                                    onClick={() => {
                                                        setStep1((p) => ({ ...p, type: v }));
                                                        setApiError({});
                                                    }}
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
                                            onChange={(e) => {
                                                setStep2({ full_name: e.target.value });
                                                setErrors2({});
                                                setApiError((p) => ({ ...p, full_name: undefined }));
                                            }}
                                            dir="rtl"
                                        />
                                        {(errors2.full_name || apiError.full_name) && (
                                            <p className="text-[11px] text-red-500 mt-1 font-semibold">
                                                {errors2.full_name ?? apiError.full_name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!loading) {
                                                    setApiError({});
                                                    setStep(1);
                                                }
                                            }}
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
        </>
    );
}
