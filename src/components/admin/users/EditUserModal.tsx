"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axiosInstance";
import { ApiEmployee } from "@/types/users";

interface EditUserModalProps {
    employee: ApiEmployee;
    onClose: () => void;
    onUpdated: (updated: ApiEmployee) => void;
}

interface FormErrors {
    full_name?: string;
    username?: string;
    password?: string;
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

function getApiErrorMessage(error: any): FormErrors {
    const data = error?.response?.data;
    const errors: FormErrors = {};

    if (!data) return errors;

    if (data.full_name) errors.full_name = Array.isArray(data.full_name) ? data.full_name[0] : data.full_name;
    if (data.username) errors.username = Array.isArray(data.username) ? data.username[0] : data.username;
    if (data.password) errors.password = Array.isArray(data.password) ? data.password[0] : data.password;

    return errors;
}

function FloatingInput({
    label,
    value,
    onChange,
    type = "text",
    error,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    error?: string;
}) {
    return (
        <div className="relative">
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder=" "
                className={`peer w-full rounded-2xl border bg-transparent px-4 pt-5 pb-2 text-sm outline-none transition-colors dark:text-white ${error
                        ? "border-red-500 focus:border-red-500"
                        : "border-neutral-300 focus:border-blue-500 dark:border-neutral-700 dark:focus:border-blue-400"
                    }`}
            />
            <label className="pointer-events-none absolute right-4 top-3.5 origin-right text-sm text-neutral-500 transition-all duration-150 peer-focus:-translate-y-2.5 peer-focus:scale-75 peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:-translate-y-2.5 peer-[:not(:placeholder-shown)]:scale-75 dark:text-neutral-400">
                {label}
            </label>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

export default function EditUserModal({ employee, onClose, onUpdated }: EditUserModalProps) {
    const [fullName, setFullName] = useState(employee.full_name);
    const [username, setUsername] = useState(employee.username);
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);

    function validate(): boolean {
        const newErrors: FormErrors = {};

        if (!fullName.trim()) newErrors.full_name = "نام و نام خانوادگی الزامی است";
        if (!username.trim()) newErrors.username = "نام کاربری الزامی است";
        else if (!USERNAME_REGEX.test(username)) newErrors.username = "نام کاربری باید بین ۳ تا ۲۰ کاراکتر و شامل حروف، عدد و آندرلاین باشد";
        if (password && password.length < 6) newErrors.password = "رمز عبور باید حداقل ۶ کاراکتر باشد";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit() {
        if (!validate()) return;

        setLoading(true);

        const payload: Record<string, any> = {
            full_name: fullName,
            username,
        };

        if (password) payload.password = password;

        try {
            const res = await api.put(`/accounts/api/v1/user/${employee.id}/update/`, payload);
            onUpdated(res.data);
            onClose();
        } catch (err) {
            setErrors(getApiErrorMessage(err));
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
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md rounded-4xl bg-white p-6 shadow-2xl dark:bg-neutral-900"
                >
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-lg font-bold dark:text-white">ویرایش کاربر</h2>
                        <button
                            onClick={onClose}
                            className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <FloatingInput label="نام و نام خانوادگی" value={fullName} onChange={setFullName} error={errors.full_name} />
                        <FloatingInput label="نام کاربری" value={username} onChange={setUsername} error={errors.username} />
                        <FloatingInput label="رمز عبور جدید (اختیاری)" value={password} onChange={setPassword} type="password" error={errors.password} />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="mt-6 flex w-full items-center justify-center rounded-2xl bg-blue-600 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : "ذخیره تغییرات"}
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
