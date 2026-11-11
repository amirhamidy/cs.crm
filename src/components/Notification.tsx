"use client";

import { motion } from "framer-motion";

interface NotificationProps {
    message: string;
    type: "success" | "error";
    onClose: () => void;
}

export function Notification({ message, type, onClose }: NotificationProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`fixed top-6 left-0 right-0 mx-auto w-fit z-50 px-4 py-3 rounded-2xl border shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl flex items-center gap-3 ${type === "error"
                    ? "bg-white/90 border-red-100 text-red-900"
                    : "bg-white/90 border-green-100 text-green-900"
                }`}
        >
            <div className={`w-2 h-2 rounded-full ${type === "error" ? "bg-red-500" : "bg-green-500"}`} />
            <span className="text-sm font-medium tracking-tight pr-1">{message}</span>
            <button
                onClick={onClose}
                className="mr-2 p-1 rounded-full hover:bg-black/5 transition-colors flex items-center justify-center"
            >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 1L13 13M13 1L1 13" />
                </svg>
            </button>
        </motion.div>
    );
}
