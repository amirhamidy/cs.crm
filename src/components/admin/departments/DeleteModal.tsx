"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X } from "lucide-react";

interface DeleteModalProps {
    title: string;
    description: string;
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function DeleteModal({
    title,
    description,
    open,
    onConfirm,
    onCancel,
}: DeleteModalProps) {
    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        onClick={onCancel}
                        className="fixed inset-0 z-40 bg-black/30 dark:bg-black/60 backdrop-blur-sm"
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            key="modal"
                            initial={{ opacity: 0, scale: 0.93, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.93, y: 16 }}
                            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                            className="relative w-full max-w-sm
                                bg-white dark:bg-[#141414]
                                border border-gray-200 dark:border-white/[0.08]
                                rounded-2xl shadow-2xl p-6"
                            dir="rtl"
                        >
                            <button
                                onClick={onCancel}
                                className="absolute left-4 top-4 p-1.5 rounded-lg
                                    text-gray-400 hover:text-gray-600 dark:hover:text-white
                                    hover:bg-gray-100 dark:hover:bg-white/[0.06]
                                    transition-colors duration-200"
                            >
                                <X size={16} />
                            </button>
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center
                                    bg-red-500/10 border border-red-500/20"
                                >
                                    <Trash2 size={22} className="text-red-500" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                                        {title}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                                        {description}
                                    </p>
                                </div>
                                <div className="flex gap-2.5 w-full pt-1">
                                    <button
                                        onClick={onCancel}
                                        className="flex-1 py-2.5 rounded-xl text-sm font-medium
                                            text-gray-500 dark:text-gray-400
                                            bg-gray-100 dark:bg-white/[0.05]
                                            hover:bg-gray-200 dark:hover:bg-white/[0.09]
                                            transition-colors duration-200"
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        onClick={onConfirm}
                                        className="flex-1 py-2.5 rounded-xl text-sm font-medium
                                            bg-red-500 hover:bg-red-600 text-white
                                            transition-colors shadow-lg shadow-red-500/25"
                                    >
                                        حذف کن
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}