"use client";

import {
    useState,
    useEffect,
    forwardRef,
    InputHTMLAttributes,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Loader2,
    UserPlus,
    User,
    Lock,
    Shield,
    Eye,
    EyeOff,
    Check,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import type { ApiUser, CreateUserResponse } from "@/types/users";

type Step1Form = {
    username: string;
    password: string;
    type: 1 | 2;
};

type Step2Form = {
    full_name: string;
};

type Step1Errors = Partial<Record<keyof Step1Form, string>>;
type Step2Errors = Partial<Record<keyof Step2Form, string>>;

type UserListResponse =
    | ApiUser[]
    | {
        results?: ApiUser[];
        data?: ApiUser[];
        users?: ApiUser[];
    };

interface Props {
    onClose: () => void;
    onSuccess: () => void;
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
                className={`
          peer w-full rounded-2xl border
          bg-white px-4 py-3 text-sm text-black outline-none
          transition-all duration-200
          focus:border-indigo-500
          [&:not(:placeholder-shown)]:border-indigo-500
          dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white
          dark:focus:border-violet-500
          dark:[&:not(:placeholder-shown)]:border-violet-500
          ${className}
        `}
                {...props}
            />
            <label
                htmlFor={id}
                className="
          absolute right-4 top-1/2 -translate-y-1/2
          text-sm text-gray-400 pointer-events-none
          transition-all duration-200
          bg-white dark:bg-[#0f172a] px-1 rounded
          peer-focus:top-0 peer-focus:text-[11px] peer-focus:text-indigo-500
          peer-[:not(:placeholder-shown)]:top-0
          peer-[:not(:placeholder-shown)]:text-[11px]
          peer-[:not(:placeholder-shown)]:text-indigo-500
          dark:peer-focus:text-violet-400
          dark:peer-[:not(:placeholder-shown)]:text-violet-400
        "
            >
                {label}
            </label>
        </div>
    )
);
FloatingInput.displayName = "FloatingInput";

function extractCreatedUserId(data: CreateUserResponse): number | null {
    if (typeof data?.id === "number") return data.id;
    if (typeof data?.user?.id === "number") return data.user.id;
    if (typeof data?.data?.id === "number") return data.data.id;
    if (typeof data?.data?.user?.id === "number") return data.data.user.id;
    return null;
}

function extractUserList(data: UserListResponse): ApiUser[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
        if (Array.isArray(data.results)) return data.results;
        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data.users)) return data.users;
    }
    return [];
}

function getApiErrorMessage(err: unknown, fallback: string) {
    const error = err as AxiosError<Record<string, unknown>>;
    const data = error.response?.data;
    if (!data) return fallback;

    const possibleKeys = [
        "detail",
        "username",
        "password",
        "type",
        "full_name",
        "user",
        "non_field_errors",
        "message",
        "error",
    ];

    for (const key of possibleKeys) {
        const value = data[key];
        if (typeof value === "string") return value;
        if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }

    return fallback;
}

export default function AddUserModal({ onClose, onSuccess }: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [step, setStep] = useState<1 | 2>(1);
    const [createdUserId, setCreatedUserId] = useState<number | null>(null);
    const [step1, setStep1] = useState<Step1Form>({
        username: "",
        password: "",
        type: 2,
    });
    const [step2, setStep2] = useState<Step2Form>({
        full_name: "",
    });
    const [errors1, setErrors1] = useState<Step1Errors>({});
    const [errors2, setErrors2] = useState<Step2Errors>({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    function validateStep1(): boolean {
        const e: Step1Errors = {};
        if (!step1.username.trim()) e.username = "نام کاربری الزامی است";
        if (!step1.password.trim()) {
            e.password = "رمز عبور الزامی است";
        } else if (step1.password.length < 3) {
            e.password = "رمز عبور باید حداقل ۳ کاراکتر باشد";
        }
        setErrors1(e);
        return Object.keys(e).length === 0;
    }

    function validateStep2(): boolean {
        const e: Step2Errors = {};
        if (!step2.full_name.trim()) e.full_name = "نام کامل الزامی است";
        setErrors2(e);
        return Object.keys(e).length === 0;
    }

    async function findUserIdByUsername(username: string): Promise<number | null> {
        const res = await axiosInstance.get<UserListResponse>(
            "/accounts/api/v1/user/list/"
        );
        const users = extractUserList(res.data);
        const foundUser = users.find((u) => u.username === username);
        return foundUser?.id ?? null;
    }

    async function handleStep1Submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!validateStep1()) return;

        setLoading(true);
        setApiError("");

        try {
            const payload = {
                username: step1.username.trim(),
                password: step1.password,
                type: step1.type,
            };

            const { data } = await axiosInstance.post<CreateUserResponse>(
                "/accounts/api/v1/user/create/",
                payload
            );

            let userId = extractCreatedUserId(data);
            if (!userId) {
                userId = await findUserIdByUsername(payload.username);
            }

            if (!userId) {
                setApiError("کاربر ساخته شد، اما شناسه کاربر پیدا نشد");
                return;
            }

            setCreatedUserId(userId);

            if (step1.type === 1) {
                onSuccess();
                return;
            }

            setStep(2);
        } catch (err) {
            setApiError(getApiErrorMessage(err, "خطا در ثبت کاربر"));
        } finally {
            setLoading(false);
        }
    }

    async function handleStep2Submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!validateStep2()) return;

        if (!createdUserId) {
            setApiError("شناسه کاربر یافت نشد، لطفاً دوباره از مرحله اول شروع کنید");
            return;
        }

        setLoading(true);
        setApiError("");

        try {
            await axiosInstance.post("/accounts/api/v1/employee/create/", {
                user: createdUserId,
                full_name: step2.full_name.trim(),
            });
            onSuccess();
        } catch (err) {
            setApiError(getApiErrorMessage(err, "خطا در ثبت کارمند"));
        } finally {
            setLoading(false);
        }
    }

    function handleClose() {
        if (loading) return;
        onClose();
    }

    function goBackToStep1() {
        if (loading) return;
        setApiError("");
        setStep(1);
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(2px)",
            }}
            onClick={handleClose}
        >
            <motion.div
                initial={{ scale: 0.93, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.93, y: 16 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-full max-w-[400px] rounded-3xl overflow-hidden border"
                style={{
                    background: isDark ? "#0f172a" : "#ffffff",
                    borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
                }}
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
            >
                <div
                    className="px-5 py-4 border-b flex items-center justify-between"
                    style={{
                        borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                            <UserPlus size={15} className="text-indigo-500" />
                        </div>
                        <div>
                            <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                {step === 1 ? "افزودن کاربر" : "اطلاعات کارمند"}
                            </h3>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                {step === 1
                                    ? "مرحله ۱ از ۲ — اطلاعات حساب"
                                    : "مرحله ۲ از ۲ — مشخصات کارمند"}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-40"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                        }}
                        type="button"
                    >
                        <X size={15} />
                    </button>
                </div>

                <div className="px-5 pt-2 pb-1 flex gap-1.5">
                    {[1, 2].map((s) => (
                        <div
                            key={s}
                            className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{
                                background:
                                    step >= s
                                        ? "linear-gradient(90deg, #6366f1, #8b5cf6)"
                                        : isDark
                                            ? "rgba(255,255,255,0.07)"
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
                            onSubmit={handleStep1Submit}
                            noValidate
                            className="p-5 space-y-4"
                        >
                            <div>
                                <FloatingInput
                                    label="نام کاربری"
                                    id="username"
                                    type="text"
                                    value={step1.username}
                                    onChange={(e) => {
                                        setStep1((p) => ({ ...p, username: e.target.value }));
                                        setErrors1((p) => ({ ...p, username: undefined }));
                                        setApiError("");
                                    }}
                                    dir="ltr"
                                    autoComplete="off"
                                />
                                {errors1.username && (
                                    <p className="text-[11px] text-red-500 mt-1 font-semibold">
                                        {errors1.username}
                                    </p>
                                )}
                            </div>

                            <div>
                                <div className="relative">
                                    <FloatingInput
                                        label="رمز عبور"
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={step1.password}
                                        onChange={(e) => {
                                            setStep1((p) => ({ ...p, password: e.target.value }));
                                            setErrors1((p) => ({ ...p, password: undefined }));
                                            setApiError("");
                                        }}
                                        dir="ltr"
                                        autoComplete="new-password"
                                        className="pr-4 pl-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((p) => !p)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors1.password && (
                                    <p className="text-[11px] text-red-500 mt-1 font-semibold">
                                        {errors1.password}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-[11.5px] font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                                    نوع حساب
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { v: 2, label: "کارمند" },
                                        { v: 1, label: "ادمین" },
                                    ].map(({ v, label }) => (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() => {
                                                setStep1((p) => ({ ...p, type: v as 1 | 2 }));
                                                setApiError("");
                                            }}
                                            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-[12.5px] font-bold transition-all duration-150"
                                            style={{
                                                borderColor:
                                                    step1.type === v
                                                        ? "#6366f1"
                                                        : isDark
                                                            ? "rgba(255,255,255,0.07)"
                                                            : "rgba(0,0,0,0.07)",
                                                background:
                                                    step1.type === v
                                                        ? isDark
                                                            ? "rgba(99,102,241,0.15)"
                                                            : "rgba(99,102,241,0.07)"
                                                        : isDark
                                                            ? "rgba(255,255,255,0.03)"
                                                            : "rgba(0,0,0,0.02)",
                                                color:
                                                    step1.type === v
                                                        ? isDark
                                                            ? "#a5b4fc"
                                                            : "#6366f1"
                                                        : isDark
                                                            ? "#94a3b8"
                                                            : "#64748b",
                                            }}
                                        >
                                            <Shield size={12} />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {apiError && (
                                <p className="text-[11.5px] text-red-500 dark:text-red-400 font-semibold text-center leading-relaxed">
                                    {apiError}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                                style={{
                                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                    boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
                                }}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        در حال ثبت...
                                    </>
                                ) : step1.type === 1 ? (
                                    <>
                                        <Check size={14} />
                                        ثبت ادمین
                                    </>
                                ) : (
                                    <>
                                        ادامه
                                        <ChevronLeft size={14} />
                                    </>
                                )}
                            </button>
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
                            className="p-5 space-y-4"
                        >
                            <div>
                                <FloatingInput
                                    label="نام و نام خانوادگی"
                                    id="full_name"
                                    type="text"
                                    value={step2.full_name}
                                    onChange={(e) => {
                                        setStep2({ full_name: e.target.value });
                                        setErrors2({});
                                        setApiError("");
                                    }}
                                    dir="rtl"
                                    autoComplete="off"
                                />
                                {errors2.full_name && (
                                    <p className="text-[11px] text-red-500 mt-1 font-semibold">
                                        {errors2.full_name}
                                    </p>
                                )}
                            </div>

                            {apiError && (
                                <p className="text-[11.5px] text-red-500 dark:text-red-400 font-semibold text-center leading-relaxed">
                                    {apiError}
                                </p>
                            )}

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={goBackToStep1}
                                    disabled={loading}
                                    className="w-[92px] flex items-center justify-center gap-1 py-2.5 rounded-xl text-[12.5px] font-bold disabled:opacity-40 transition-colors"
                                    style={{
                                        background: isDark
                                            ? "rgba(255,255,255,0.05)"
                                            : "rgba(0,0,0,0.04)",
                                        color: isDark ? "#94a3b8" : "#64748b",
                                    }}
                                >
                                    <ChevronRight size={14} />
                                    برگشت
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{
                                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                        boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            در حال ثبت...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} />
                                            ثبت کارمند
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
