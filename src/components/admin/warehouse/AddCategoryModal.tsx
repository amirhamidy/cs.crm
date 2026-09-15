"use client";
import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader, Package, X } from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";

interface AddCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddCategoryModal({
    isOpen,
    onClose,
    onSuccess,
}: AddCategoryModalProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("نام دسته‌بندی نمی‌تواند خالی باشد");
            return;
        }
        setLoading(true);
        setError("");
        try {
            await axiosInstance.post("/warehouse/api/v1/products/categories/create/", {
                name: name.trim(),
            });
            onSuccess();
            handleClose();
        } catch {
            setError("خطا در ثبت دسته‌بندی");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setName("");
        setError("");
        onClose();
    };

    if (!isOpen) return null;

    return (
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
                    onClick={(e) => e.stopPropagation()}
                    dir="rtl"
                >
                    <div className="flex items-center justify-between px-8 pb-6 pt-8">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                                <Package size={15} className="text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    افزودن دسته‌بندی
                                </h3>
                                <p className="mt-0.5 text-[11px] text-gray-400">
                                    ایجاد دسته‌بندی جدید محصولات
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

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-8 pb-8">
                        <div>
                            <label className="mb-2 block text-[11.5px] font-bold text-gray-400">
                                نام دسته‌بندی
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setError("");
                                }}
                                placeholder="مثال: آهن آلات"
                                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                                dir="rtl"
                            />
                            {error && <p className="mt-2 text-[11px] font-semibold text-red-500">{error}</p>}
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileTap={{ scale: 0.97 }}
                            className="flex items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader size={15} className="animate-spin" />
                            ) : (
                                <>
                                    <Check size={14} />
                                    ثبت دسته‌بندی
                                </>
                            )}
                        </motion.button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}