"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import React from "react";

type FloatingInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
};

type FloatingTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label: string;
};

type PrimaryButtonProps = {
    children: React.ReactNode;
    onClick?: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: "primary" | "secondary" | "danger" | "ghost";
    type?: "button" | "submit" | "reset";
    className?: string;
};

type GlassModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    maxWidth?: string;
    children: React.ReactNode;
};

export function FloatingInput({ label, id, className = "", ...props }: FloatingInputProps) {
    return (
        <div className="relative mb-5 w-full">
            <input
                id={id}
                placeholder=" "
                {...props}
                className={`peer w-full rounded-2xl border border-white/10 bg-white/5 px-5 pb-3 pt-6 text-white outline-none transition-all placeholder-transparent focus:border-sky-500/50 focus:bg-white/10 ${className}`}
            />
            <label
                htmlFor={id}
                className="pointer-events-none absolute right-5 top-4 text-sm text-white/40 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-sky-400"
            >
                {label}
            </label>
        </div>
    );
}

export function FloatingTextarea({ label, id, className = "", ...props }: FloatingTextareaProps) {
    return (
        <div className="relative mb-5 w-full">
            <textarea
                id={id}
                placeholder=" "
                rows={4}
                {...props}
                className={`peer w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-5 pb-3 pt-6 text-white outline-none transition-all placeholder-transparent focus:border-sky-500/50 focus:bg-white/10 ${className}`}
            />
            <label
                htmlFor={id}
                className="pointer-events-none absolute right-5 top-4 text-sm text-white/40 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-sky-400"
            >
                {label}
            </label>
        </div>
    );
}

export function PrimaryButton({
    children,
    onClick,
    loading = false,
    disabled = false,
    variant = "primary",
    type = "button",
    className = "",
}: PrimaryButtonProps) {
    const styles = {
        primary: "bg-sky-600 text-white hover:bg-sky-500 shadow-sky-500/20",
        secondary: "bg-white/5 text-white border border-white/10 hover:bg-white/10",
        danger: "bg-rose-500/15 text-rose-300 border border-rose-500/20 hover:bg-rose-500/25",
        ghost: "bg-transparent text-white/80 hover:bg-white/5",
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
        >
            {loading ? <Loader2 className="animate-spin" size={18} /> : children}
        </button>
    );
}

export function GlassModal({ isOpen, onClose, title, maxWidth = "max-w-lg", children }: GlassModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => e.stopPropagation()}
                        className={`relative w-full ${maxWidth} rounded-[2rem] border border-white/10 bg-[#0b0d14] p-6 shadow-2xl backdrop-blur-xl`}
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">{title}</h2>
                            <button
                                type="button"
                                onClick={onClose}
                                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
