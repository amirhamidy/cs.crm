"use client";

import { useState, useEffect, InputHTMLAttributes, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader, User } from "lucide-react";
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
                autoComplete="new-password"
                className={`
                    peer w-full border border-gray-200 rounded-4xl
                    px-5 py-3 text-sm text-black outline-none
                    transition-all duration-200
                    focus:border-gray-400
                    dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white
                    dark:focus:border-blue-500
                    ${className}
                `}
                {...props}
            />
            <label
                htmlFor={id}
                className="
                    absolute right-5 top-1/2 -translate-y-1/2
                    text-sm text-gray-400 pointer-events-none
                    transition-all duration-200
                    bg-white dark:bg-[#0f172a] px-1.5 rounded
                    peer-focus:top-0 peer-focus:text-xs peer-focus:text-gray-500
                    peer-[:not(:placeholder-shown)]:top-0
                    peer-[:not(:placeholder-shown)]:text-xs
                    peer-[:not(:placeholder-shown)]:text-gray-500
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
    const keys = ["detail", "full_name", "user", "message", "error", "non_field_errors"];
    for (const key of keys) {
        const val = data[key];
        if (typeof val === "string") return val;
        if (Array.isArray(val) && typeof val[0] === "string") return val[0];
    }
    return fallback;
}

export default function EditUserModal({
    isOpen,
    onClose,
    employee,
    onUpdated,
}: EditUserModalProps) {
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setFullName(employee.full_name || "");
            setError("");
        }
    }, [isOpen, employee]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!fullName.trim()) {
            setError("نام و نام خانوادگی الزامی است");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await axiosInstance.put<{ full_name?: string }>(
                `/accounts/api/v1/employee/${employee.id}/update/`,
                { full_name: fullName.trim(), user: employee.user }
            );
            onUpdated({ ...employee, full_name: res.data?.full_name || fullName.trim() });
            onClose();
        } catch (err) {
            setError(getErrorMessage(err, "خطا در ویرایش اطلاعات"));
        } finally {
            setLoading(false);
        }
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
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="bg-white dark:bg-[#0f172a] rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/[0.06] p-8 w-full max-w-sm"
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                    <User size={15} className="text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        ویرایش کارمند
                                    </h3>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        ویرایش نام و نام خانوادگی
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-40 bg-gray-100 dark:bg-white/[0.05]"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-6">
                            <FloatingInput
                                label="نام و نام خانوادگی"
                                id="edit_full_name"
                                type="text"
                                value={fullName}
                                onChange={(e) => {
                                    setFullName(e.target.value);
                                    setError("");
                                }}
                                dir="rtl"
                            />

                            {error && (
                                <p className="text-[11.5px] text-red-500 font-semibold text-center -mt-2">
                                    {error}
                                </p>
                            )}

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileTap={{ scale: 0.97 }}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-full py-3 text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                {loading && <Loader size={15} className="animate-spin" />}
                                ذخیره تغییرات
                            </motion.button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
