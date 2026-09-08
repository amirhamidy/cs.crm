"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader, Tag, X } from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import type { ApiCategory } from "@/types/warehouse";
import { FloatingInput } from "./FormControls";

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    category?: ApiCategory | null;
    onSaved: (category: ApiCategory) => void;
}

function getErrorMessage(err: unknown, fallback: string) {
    const error = err as AxiosError<Record<string, unknown>>;
    const data = error.response?.data;
    if (!data) return fallback;
    const keys = ["detail", "name", "message", "error", "non_field_errors"];
    for (const key of keys) {
        const val = data[key];
        if (typeof val === "string") return val;
        if (Array.isArray(val) && typeof val[0] === "string") return val[0];
    }
    return fallback;
}

export default function CategoryModal({ isOpen, onClose, category, onSaved }: CategoryModalProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const isEdit = Boolean(category);

    useEffect(() => {
        if (!isOpen) return;
        setName(category?.name ?? "");
        setError("");
    }, [isOpen, category]);

    function handleClose() {
        if (loading) return;
        onClose();
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) {
            setError("نام دسته‌بندی الزامی است");
            return;
        }

        setLoading(true);
        setError("");

        try {
            if (isEdit && category) {
                const { data } = await axiosInstance.put<ApiCategory>(
                    `/warehouse/api/v1/products/categories/${category.id}/update/`,
                    { name: name.trim() }
                );
                onSaved(data);
            } else {
                const { data } = await axiosInstance.post<ApiCategory>(
                    "/warehouse/api/v1/products/categories/create/",
                    { name: name.trim() }
                );
                onSaved(data);
            }
            onClose();
        } catch (err) {
            setError(getErrorMessage(err, "خطا در ثبت دسته‌بندی"));
        } finally {
            setLoading(false);
        }
    }

    const cardBg = isDark ? "#0f172a" : "#ffffff";
    const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)";
    const textColor = isDark ? "#f1f5f9" : "#1e293b";
    const mutedText = isDark ? "#94a3b8" : "#64748b";

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{
                        background: "rgba(15,23,42,0.5)",
                        backdropFilter: "blur(4px)",
                    }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="w-full max-w-sm overflow-hidden rounded-[2rem] p-0"
                        style={{
                            background: cardBg,
                            border: `1px solid ${borderColor}`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                    >
                        <div className="flex items-center justify-between px-8 pb-6 pt-8">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                                    style={{
                                        background: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
                                    }}
                                >
                                    <Tag size={15} className="text-indigo-500" />
                                </div>
                                <div>
                                    <h3
                                        className="text-[14px] font-extrabold"
                                        style={{ color: textColor }}
                                    >
                                        {isEdit ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}
                                    </h3>
                                    <p className="mt-0.5 text-[12px]" style={{ color: mutedText }}>
                                        برای دسته‌بندی محصولات انبار
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors disabled:opacity-40"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)",
                                    color: mutedText,
                                }}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-5 px-8 pb-8">
                            <FloatingInput
                                label="نام دسته‌بندی"
                                id="category_name"
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setError("");
                                }}
                                dir="rtl"
                            />

                            {error && (
                                <p className="-mt-1 text-center text-[12px] font-semibold text-red-500">
                                    {error}
                                </p>
                            )}

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center justify-center rounded-full py-3 text-[13px] font-bold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                                style={{
                                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                }}
                            >
                                {loading ? (
                                    <Loader size={18} className="animate-spin" />
                                ) : isEdit ? (
                                    "ذخیره تغییرات"
                                ) : (
                                    "ثبت دسته‌بندی"
                                )}
                            </motion.button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}