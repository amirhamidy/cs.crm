"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Trash2 } from "lucide-react";

interface Props {
    customerName: string;
    isOpen: boolean;
    isDeleting: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export default function CustomerDeleteModal({
    customerName,
    isOpen,
    isDeleting,
    onConfirm,
    onClose,
}: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => !isDeleting && onClose()}
                    />
                    <motion.div
                        className={`relative z-10 w-full max-w-sm rounded-2xl p-6 shadow-2xl ${isDark ? "bg-[#13151f]" : "bg-white"
                            }`}
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center">
                                <Trash2 className="w-7 h-7 text-red-400" />
                            </div>
                            <div>
                                <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                                    حذف مشتری
                                </p>
                                <p className={`text-xs mt-1 ${isDark ? "text-white/50" : "text-gray-500"}`}>
                                    مشتری «{customerName}» حذف بشه؟ این عملیات برگشت‌پذیر نیست.
                                </p>
                            </div>
                            <div className="flex gap-3 w-full">
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    onClick={onClose}
                                    disabled={isDeleting}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isDark
                                            ? "bg-white/8 hover:bg-white/12 text-white/70"
                                            : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                                        }`}
                                >
                                    انصراف
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    onClick={onConfirm}
                                    disabled={isDeleting}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-60"
                                >
                                    {isDeleting ? "در حال حذف..." : "بله، حذف شود"}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
