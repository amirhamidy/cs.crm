"use client";

import {
    forwardRef,
    type FormEvent,
    type InputHTMLAttributes,
    useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Check,
    ChevronLeft,
    ChevronRight,
    Eye,
    EyeOff,
    Loader,
    Shield,
    UserPlus,
    X,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { parseApiErrors, type FieldErrors } from "@/lib/parseApiErrors";

type Step1Form = {
    username: string;
    phone_number: string;
    password: string;
    type: 1 | 2;
};

type Step2Form = {
    full_name: string;
};

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

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

interface UserListItem {
    id: number;
    username: string;
    phone_number?: string | null;
}

const PHONE_REGEX = /^09\d{9}$/;

const INITIAL_STEP1: Step1Form = {
    username: "",
    phone_number: "",
    password: "",
    type: 2,
};

const INITIAL_STEP2: Step2Form = {
    full_name: "",
};

function Notification({ message, type, onClose }: NotificationProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`fixed left-0 right-0 top-6 z-[60] mx-auto flex w-fit items-center gap-3 rounded-2xl border px-4 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl ${
                type === "error"
                    ? "border-red-100 bg-white/90 text-red-900"
                    : "border-green-100 bg-white/90 text-green-900"
            }`}
            dir="rtl"
        >
            <div
                className={`h-2 w-2 rounded-full ${
                    type === "error" ? "bg-red-500" : "bg-green-500"
                }`}
            />
            <span className="pr-1 text-sm font-medium tracking-tight">{message}</span>
            <button
                type="button"
                onClick={onClose}
                className="mr-2 flex items-center justify-center rounded-full p-1 transition-colors hover:bg-black/5"
            >
                <X size={14} />
            </button>
        </motion.div>
    );
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
    ({ label, id, className = "", ...props }, ref) => {
        return (
            <div className="relative">
                <input
                    ref={ref}
                    id={id}
                    placeholder=" "
                    autoComplete="off"
                    className={`peer w-full rounded-4xl border border-gray-200 px-5 py-3 text-sm text-black outline-none transition-all duration-200 focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-blue-500 ${className}`}
                    {...props}
                />
                <label
                    htmlFor={id}
                    className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 rounded bg-white px-1.5 text-sm text-gray-400 transition-all duration-200 peer-focus:top-0 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-500 dark:bg-[#0f172a]"
                >
                    {label}
                </label>
            </div>
        );
    }
);

FloatingInput.displayName = "FloatingInput";

function toEnglishDigits(value: string) {
    return value
        .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
        .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function normalizePhoneNumber(value: string) {
    const digits = toEnglishDigits(value).replace(/\D/g, "");

    if (digits.startsWith("0098") && digits.length === 14) {
        return `0${digits.slice(4)}`;
    }

    if (digits.startsWith("98") && digits.length === 12) {
        return `0${digits.slice(2)}`;
    }

    if (digits.startsWith("9") && digits.length === 10) {
        return `0${digits}`;
    }

    return digits.slice(0, 11);
}

function normalizeUsername(value: string) {
    return value.trim().toLowerCase();
}

function extractUsers(data: unknown): UserListItem[] {
    if (Array.isArray(data)) {
        return data as UserListItem[];
    }

    if (data && typeof data === "object") {
        const response = data as Record<string, unknown>;

        if (Array.isArray(response.results)) {
            return response.results as UserListItem[];
        }

        if (Array.isArray(response.data)) {
            return response.data as UserListItem[];
        }

        if (Array.isArray(response.users)) {
            return response.users as UserListItem[];
        }
    }

    return [];
}

export default function AddUserModal({ onClose, onSuccess, onNotify }: Props) {
    const [step, setStep] = useState<1 | 2>(1);
    const [step1, setStep1] = useState<Step1Form>(INITIAL_STEP1);
    const [step2, setStep2] = useState<Step2Form>(INITIAL_STEP2);
    const [errors1, setErrors1] = useState<Step1Errors>({});
    const [errors2, setErrors2] = useState<Step2Errors>({});
    const [apiError, setApiError] = useState<FieldErrors>({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [notification, setNotification] = useState<{
        message: string;
        type: "success" | "error";
    } | null>(null);

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
        if (loading) {
            return;
        }

        resetAll();
        setNotification(null);
        onClose();
    }

    function clearUsernameError() {
        setErrors1((prev) => ({
            ...prev,
            username: undefined,
        }));

        setApiError((prev) => ({
            ...prev,
            username: undefined,
        }));
    }

    function clearPhoneError() {
        setErrors1((prev) => ({
            ...prev,
            phone_number: undefined,
        }));

        setApiError((prev) => ({
            ...prev,
            phone_number: undefined,
        }));
    }

    async function getUsers() {
        const { data } = await axiosInstance.get(
            "/accounts/api/v1/user/list/"
        );

        return extractUsers(data);
    }

    async function validateAvailability(
        username: string,
        phoneNumber: string
    ) {
        try {
            const users = await getUsers();
            const normalizedUsername = normalizeUsername(username);
            const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

            const nextErrors: Step1Errors = {};

            const usernameExists = users.some(
                (user) =>
                    normalizeUsername(user.username ?? "") ===
                    normalizedUsername
            );

            const phoneNumberExists = users.some(
                (user) =>
                    normalizePhoneNumber(user.phone_number ?? "") ===
                    normalizedPhoneNumber
            );

            if (usernameExists) {
                nextErrors.username = "این نام کاربری قبلاً ثبت شده است";
            }

            if (phoneNumberExists) {
                nextErrors.phone_number = "این شماره موبایل قبلاً ثبت شده است";
            }

            if (Object.keys(nextErrors).length > 0) {
                setErrors1((prev) => ({
                    ...prev,
                    ...nextErrors,
                }));

                showNotify(
                    nextErrors.username ??
                        nextErrors.phone_number ??
                        "اطلاعات واردشده تکراری است",
                    "error"
                );

                return false;
            }

            return true;
        } catch {
            showNotify(
                "خطا در بررسی نام کاربری و شماره موبایل",
                "error"
            );

            return false;
        }
    }

    function validateStep1() {
        const nextErrors: Step1Errors = {};
        const username = step1.username.trim();
        const phoneNumber = normalizePhoneNumber(step1.phone_number);

        if (!username) {
            nextErrors.username = "نام کاربری الزامی است";
        }

        if (!phoneNumber) {
            nextErrors.phone_number = "شماره موبایل الزامی است";
        } else if (!PHONE_REGEX.test(phoneNumber)) {
            nextErrors.phone_number = "شماره موبایل معتبر نیست";
        }

        if (!step1.password.trim()) {
            nextErrors.password = "رمز عبور الزامی است";
        } else if (step1.password.length < 3) {
            nextErrors.password = "رمز عبور باید حداقل ۳ کاراکتر باشد";
        }

        setErrors1(nextErrors);

        return {
            isValid: Object.keys(nextErrors).length === 0,
            username,
            phoneNumber,
        };
    }

    function validateStep2() {
        const nextErrors: Step2Errors = {};

        if (!step2.full_name.trim()) {
            nextErrors.full_name = "نام کامل الزامی است";
        }

        setErrors2(nextErrors);

        return Object.keys(nextErrors).length === 0;
    }

    async function getUserByUsername(username: string) {
        try {
            const users = await getUsers();

            return (
                users.find(
                    (user) =>
                        normalizeUsername(user.username) ===
                        normalizeUsername(username)
                ) ?? null
            );
        } catch {
            return null;
        }
    }

    async function deleteUserById(userId: number) {
        try {
            await axiosInstance.delete(`/accounts/api/v1/user/${userId}/delete/`);
        } catch {
            return;
        }
    }

    async function deleteUserByUsername(username: string) {
        const user = await getUserByUsername(username);

        if (user?.id) {
            await deleteUserById(user.id);
        }
    }

    async function resolveUserId(createData: unknown, username: string) {
        if (createData && typeof createData === "object") {
            const data = createData as Record<string, unknown>;

            if (typeof data.id === "number") {
                return data.id;
            }

            if (
                data.user &&
                typeof data.user === "object" &&
                typeof (data.user as Record<string, unknown>).id === "number"
            ) {
                return (data.user as Record<string, unknown>).id as number;
            }

            if (data.data && typeof data.data === "object") {
                const nestedData = data.data as Record<string, unknown>;

                if (typeof nestedData.id === "number") {
                    return nestedData.id;
                }

                if (
                    nestedData.user &&
                    typeof nestedData.user === "object" &&
                    typeof (nestedData.user as Record<string, unknown>).id ===
                        "number"
                ) {
                    return (nestedData.user as Record<string, unknown>)
                        .id as number;
                }
            }
        }

        const user = await getUserByUsername(username);

        return user?.id ?? null;
    }

    async function submitAdminOnly(username: string, phoneNumber: string) {
        setApiError({});

        try {
            await axiosInstance.post("/accounts/api/v1/user/create/", {
                username,
                phone_number: phoneNumber,
                password: step1.password,
                type: 1,
            });

            resetAll();
            showNotify("کاربر با موفقیت ثبت شد", "success");
            onSuccess();
            onClose();
        } catch (error) {
            const parsed = parseApiErrors(error, "خطا در ثبت اطلاعات");

            setApiError(parsed);

            showNotify(
                parsed.username ??
                    parsed.phone_number ??
                    parsed.password ??
                    parsed.general ??
                    "خطا در ثبت اطلاعات",
                "error"
            );
        }
    }

    async function submitEmployeeFull(username: string, phoneNumber: string) {
        setLoading(true);
        setApiError({});

        let userId: number | null = null;

        try {
            const isAvailable = await validateAvailability(username, phoneNumber);

            if (!isAvailable) {
                setStep(1);
                return;
            }

            const { data: createData } = await axiosInstance.post(
                "/accounts/api/v1/user/create/",
                {
                    username,
                    phone_number: phoneNumber,
                    password: step1.password,
                    type: 2,
                }
            );

            userId = await resolveUserId(createData, username);

            if (!userId) {
                await deleteUserByUsername(username);
                showNotify("شناسه کاربر پیدا نشد — کاربر حذف شد", "error");
                return;
            }

            await axiosInstance.post("/accounts/api/v1/employee/create/", {
                user: userId,
                full_name: step2.full_name.trim(),
            });

            resetAll();
            showNotify("کاربر با موفقیت ثبت شد", "success");
            onSuccess();
            onClose();
        } catch (error) {
            if (userId) {
                await deleteUserById(userId);
            }

            const parsed = parseApiErrors(error, "خطا در ثبت اطلاعات");

            setApiError(parsed);

            if (parsed.username || parsed.phone_number || parsed.password) {
                setStep(1);
            }

            showNotify(
                parsed.full_name ??
                    parsed.username ??
                    parsed.phone_number ??
                    parsed.password ??
                    parsed.general ??
                    "خطا در ثبت اطلاعات",
                "error"
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleStep1Next(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (loading) {
            return;
        }

        const validation = validateStep1();

        if (!validation.isValid) {
            return;
        }

        setLoading(true);

        try {
            const isAvailable = await validateAvailability(
                validation.username,
                validation.phoneNumber
            );

            if (!isAvailable) {
                return;
            }

            if (step1.type === 1) {
                await submitAdminOnly(
                    validation.username,
                    validation.phoneNumber
                );

                return;
            }

            setStep(2);
        } finally {
            setLoading(false);
        }
    }

    async function handleStep2Submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (loading) {
            return;
        }

        if (!validateStep2()) {
            return;
        }

        const validation = validateStep1();

        if (!validation.isValid) {
            setStep(1);
            return;
        }

        await submitEmployeeFull(validation.username, validation.phoneNumber);
    }

    return (
        <>
            <AnimatePresence>
                {notification && (
                    <Notification
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
                    style={{
                        background: "rgba(0,0,0,0.45)",
                        backdropFilter: "blur(3px)",
                    }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="w-full max-w-sm overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]"
                        onClick={(event) => event.stopPropagation()}
                        dir="rtl"
                    >
                        <div className="flex items-center justify-between px-8 pb-6 pt-8">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                                    <UserPlus size={15} className="text-blue-500" />
                                </div>

                                <div>
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        {step === 1 ? "افزودن کاربر" : "اطلاعات کارمند"}
                                    </h3>

                                    <p className="mt-0.5 text-[11px] text-gray-400">
                                        {step === 1
                                            ? "مرحله ۱ از ۲ — اطلاعات حساب"
                                            : "مرحله ۲ از ۲ — مشخصات کارمند"}
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

                        <div className="flex gap-1.5 px-8 pb-5">
                            {[1, 2].map((currentStep) => (
                                <div
                                    key={currentStep}
                                    className="h-1 flex-1 rounded-full transition-all duration-300"
                                    style={{
                                        background:
                                            step >= currentStep
                                                ? "linear-gradient(90deg,#3b82f6,#60a5fa)"
                                                : "rgba(0,0,0,0.07)",
                                    }}
                                />
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <motion.form
                                    key="step-1"
                                    initial={{ opacity: 0, x: 12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -12 }}
                                    transition={{ duration: 0.2 }}
                                    onSubmit={handleStep1Next}
                                    noValidate
                                    className="flex flex-col gap-4 px-8 pb-8"
                                >
                                    <div>
                                        <FloatingInput
                                            label="نام کاربری"
                                            id="add_username"
                                            type="text"
                                            value={step1.username}
                                            dir="ltr"
                                            onChange={(event) => {
                                                setStep1((prev) => ({
                                                    ...prev,
                                                    username: event.target.value,
                                                }));
                                                clearUsernameError();
                                            }}
                                        />

                                        {(errors1.username ||
                                            apiError.username) && (
                                            <p className="mt-1 text-[11px] font-semibold text-red-500">
                                                {errors1.username ?? apiError.username}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <FloatingInput
                                            label="شماره موبایل"
                                            id="add_phone_number"
                                            type="tel"
                                            inputMode="numeric"
                                            maxLength={11}
                                            value={step1.phone_number}
                                            dir="ltr"
                                            onChange={(event) => {
                                                const phoneNumber = normalizePhoneNumber(
                                                    event.target.value
                                                );

                                                setStep1((prev) => ({
                                                    ...prev,
                                                    phone_number: phoneNumber,
                                                }));

                                                clearPhoneError();
                                            }}
                                        />

                                        {(errors1.phone_number ||
                                            apiError.phone_number) && (
                                            <p className="mt-1 text-[11px] font-semibold text-red-500">
                                                {errors1.phone_number ??
                                                    apiError.phone_number}
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
                                                dir="ltr"
                                                autoComplete="new-password"
                                                className="pl-12"
                                                onChange={(event) => {
                                                    setStep1((prev) => ({
                                                        ...prev,
                                                        password: event.target.value,
                                                    }));

                                                    setErrors1((prev) => ({
                                                        ...prev,
                                                        password: undefined,
                                                    }));

                                                    setApiError((prev) => ({
                                                        ...prev,
                                                        password: undefined,
                                                    }));
                                                }}
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword((prev) => !prev)
                                                }
                                                className="absolute left-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                                            >
                                                {showPassword ? (
                                                    <EyeOff size={16} />
                                                ) : (
                                                    <Eye size={16} />
                                                )}
                                            </button>
                                        </div>

                                        {(errors1.password || apiError.password) && (
                                            <p className="mt-1 text-[11px] font-semibold text-red-500">
                                                {errors1.password ?? apiError.password}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-[11.5px] font-bold text-gray-400">
                                            نوع کاربر
                                        </label>

                                        <div className="flex gap-2">
                                            {[
                                                { value: 2 as const, label: "کارمند" },
                                                { value: 1 as const, label: "ادمین" },
                                            ].map(({ value, label }) => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => {
                                                        setStep1((prev) => ({
                                                            ...prev,
                                                            type: value,
                                                        }));
                                                        setApiError({});
                                                    }}
                                                    className="flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-[12.5px] font-bold transition-all duration-150"
                                                    style={{
                                                        borderColor:
                                                            step1.type === value
                                                                ? "#3b82f6"
                                                                : "rgba(0,0,0,0.07)",
                                                        background:
                                                            step1.type === value
                                                                ? "rgba(59,130,246,0.07)"
                                                                : "rgba(0,0,0,0.02)",
                                                        color:
                                                            step1.type === value
                                                                ? "#3b82f6"
                                                                : "#94a3b8",
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
                                        className="flex items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <Loader size={15} className="animate-spin" />
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
                                    </motion.button>
                                </motion.form>
                            ) : (
                                <motion.form
                                    key="step-2"
                                    initial={{ opacity: 0, x: 12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -12 }}
                                    transition={{ duration: 0.2 }}
                                    onSubmit={handleStep2Submit}
                                    noValidate
                                    className="flex flex-col gap-4 px-8 pb-8"
                                >
                                    <div>
                                        <FloatingInput
                                            label="نام و نام خانوادگی"
                                            id="add_full_name"
                                            type="text"
                                            value={step2.full_name}
                                            dir="rtl"
                                            onChange={(event) => {
                                                setStep2({
                                                    full_name: event.target.value,
                                                });

                                                setErrors2({});

                                                setApiError((prev) => ({
                                                    ...prev,
                                                    full_name: undefined,
                                                }));
                                            }}
                                        />

                                        {(errors2.full_name || apiError.full_name) && (
                                            <p className="mt-1 text-[11px] font-semibold text-red-500">
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
                                            className="flex w-24 items-center justify-center gap-1 rounded-full bg-gray-100 py-3 text-[12.5px] font-bold text-gray-500 transition-colors hover:bg-gray-200 disabled:opacity-40 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.08]"
                                        >
                                            <ChevronRight size={14} />
                                            برگشت
                                        </button>

                                        <motion.button
                                            type="submit"
                                            disabled={loading}
                                            whileTap={{ scale: 0.97 }}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <Loader size={18} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <Check size={14} />
                                                    ثبت کارمند
                                                </>
                                            )}
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
