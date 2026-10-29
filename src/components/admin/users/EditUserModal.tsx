"use client";

import { useState, useEffect, InputHTMLAttributes, forwardRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { X, Loader, User } from "lucide-react";
import { accountsApi } from "@/lib/api";
import type { ApiEmployee, ApiUser } from "@/types/users";

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
    const error = err as { response?: { data?: Record<string, unknown> } };
    const data = error.response?.data;
    if (!data) return fallback;
    const keys = ["detail", "phone_number", "full_name", "user", "username", "message", "error", "non_field_errors"];
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
    const [phoneNumber, setPhoneNumber] = useState("");
    const [matchedUser, setMatchedUser] = useState<ApiUser | null>(null);
    const [fetchingUser, setFetchingUser] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;

        setFullName(employee.full_name || "");
        setPhoneNumber("");
        setError("");
        setMatchedUser(null);

        let mounted = true;
        setFetchingUser(true);

        const fetchUserData = async () => {
            try {
                const users = await accountsApi.users.lookup(employee.username?.trim() ?? "");
                if (!mounted) return;

                const targetUsername = employee.username?.trim().toLowerCase();
                const found = users.find(
                    (u) => u.username?.trim().toLowerCase() === targetUsername
                );

                if (found) {
                    setMatchedUser(found);
                    setPhoneNumber(found.phone_number || "");
                }
            } catch {
                if (mounted) {
                    setError("خطا در دریافت اطلاعات کاربر");
                }
            } finally {
                if (mounted) {
                    setFetchingUser(false);
                }
            }
        };

        fetchUserData();

        return () => {
            mounted = false;
        };
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
            const employeePayload: Record<string, unknown> = {
                full_name: fullName.trim(),
            };
            if ("user" in employee && employee.user !== undefined) {
                employeePayload.user = employee.user;
            }

            const employeePromise = accountsApi.employees.update(employee.id, employeePayload);

            let userPromise: Promise<unknown> = Promise.resolve();

            if (matchedUser?.id) {
                const userPayload = {
                    username: matchedUser.username,
                    phone_number: phoneNumber.trim(),
                    type: matchedUser.type,
                    is_active: matchedUser.is_active,
                };
                userPromise = accountsApi.users.update(matchedUser.id, userPayload);
            }

            const [updatedData] = await Promise.all([employeePromise, userPromise]);

            onUpdated({
                ...employee,
                ...updatedData,
                full_name: updatedData?.full_name ?? fullName.trim(),
            });
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
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
                    onClick={onClose}
                >
                    <m.div
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
                                    <User size={15} className="text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        ویرایش کارمند
                                    </h3>
                                    <p className="mt-0.5 text-[11px] text-gray-400">
                                        ویرایش نام و شماره موبایل
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading || fetchingUser}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
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

                            <FloatingInput
                                label="شماره موبایل"
                                id="edit_phone_number"
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => {
                                    setPhoneNumber(e.target.value);
                                    setError("");
                                }}
                                dir="ltr"
                            />

                            {error && (
                                <p className="text-center text-[11.5px] font-semibold text-red-500 -mt-2">
                                    {error}
                                </p>
                            )}

                            <m.button
                                type="submit"
                                disabled={loading || fetchingUser}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center justify-center rounded-full bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                            >
                                {loading || fetchingUser ? (
                                    <Loader size={18} className="animate-spin" />
                                ) : (
                                    "ذخیره تغییرات"
                                )}
                            </m.button>
                        </form>
                    </m.div>
                </m.div>
            )}
        </AnimatePresence>
    );
}
