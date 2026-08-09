"use client";

import {
    useState,
    useEffect,
    forwardRef,
    InputHTMLAttributes,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, User, Check } from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import type { ApiEmployee } from "@/types/users";

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: ApiEmployee;
    onUpdated: (updatedEmployee: ApiEmployee) => void;
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

function getErrorMessage(err: unknown, fallback: string) {
    const error = err as AxiosError<Record<string, unknown>>;
    const data = error.response?.data;
    if (!data) return fallback;

    const possibleKeys = ["detail", "full_name", "user", "message", "error", "non_field_errors"];
    for (const key of possibleKeys) {
        const value = data[key];
        if (typeof value === "string") return value;
        if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }

    return fallback;
}

export default function EditUserModal({
    isOpen,
    onClose,
    employee,
    onUpdated,
}: EditUserModalProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [validationError, setValidationError] = useState("");

    useEffect(() => {
        if (isOpen && employee) {
            setFullName(employee.full_name || "");
            setError("");
            setValidationError("");
        }
    }, [isOpen, employee]);

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!fullName.trim()) {
            setValidationError("نام و نام خانوادگی الزامی است");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await axiosInstance.put<{ id?: number; full_name?: string; user?: number }>(
                `/accounts/api/v1/employee/${employee.id}/update/`,
                {
                    full_name: fullName.trim(),
                    user: employee.user,
                }
            );

            const updatedEmployee: ApiEmployee = {
                ...employee,
                full_name: res.data?.full_name || fullName.trim(),
            };

            onUpdated(updatedEmployee);
            onClose();
        } catch (err) {
            setError(getErrorMessage(err, "خطا در ویرایش اطلاعات"));
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
                style={{
                    background: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(2px)",
                }}
                onClick={onClose}
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
                                <User size={15} className="text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    ویرایش کارمند
                                </h3>
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                    ویرایش نام و نام خانوادگی کارمند
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
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

                    <form onSubmit={handleSubmit} noValidate className="p-5 space-y-4">
                        <div>
                            <FloatingInput
                                label="نام و نام خانوادگی"
                                id="edit_full_name"
                                type="text"
                                value={fullName}
                                onChange={(e) => {
                                    setFullName(e.target.value);
                                    setValidationError("");
                                    setError("");
                                }}
                                dir="rtl"
                                autoComplete="off"
                            />
                            {validationError && (
                                <p className="text-[11px] text-red-500 mt-1 font-semibold">
                                    {validationError}
                                </p>
                            )}
                        </div>

                        {error && (
                            <p className="text-[11.5px] text-red-500 dark:text-red-400 font-semibold text-center leading-relaxed">
                                {error}
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
                                    در حال ثبت تغییرات...
                                </>
                            ) : (
                                <>
                                    <Check size={14} />
                                    ذخیره تغییرات
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
