"use client";

import { useEffect, type ReactNode } from "react";
import { m, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalShellProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    // Blocks closing (backdrop, Escape, X) while a request is running
    busy?: boolean;
    // Tailwind max-width class for the panel
    maxWidth?: string;
    children: ReactNode;
}

// Shared modal shell copied from the AddCustomerModal pattern.
export function ModalShell({
    open,
    onClose,
    title,
    subtitle,
    icon,
    busy = false,
    maxWidth = "max-w-lg",
    children,
}: ModalShellProps) {
    // Escape closes the modal unless busy
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !busy) onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, busy, onClose]);

    const handleClose = () => {
        if (!busy) onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4"
                    style={{
                        background: "rgba(0,0,0,0.5)",
                        backdropFilter: "blur(4px)",
                    }}
                    onClick={handleClose}
                >
                    <m.div
                        initial={{ opacity: 0, y: 24, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className={`my-8 w-full ${maxWidth} overflow-visible rounded-[2.5rem] border border-gray-100 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#111827]`}
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                    >
                        <div className="flex items-center justify-between px-8 pb-6 pt-8">
                            <div className="flex items-center gap-3">
                                {icon && (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10">
                                        {icon}
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                                        {title}
                                    </h3>
                                    {subtitle && (
                                        <p className="mt-0.5 text-[11px] text-gray-400">
                                            {subtitle}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={busy}
                                aria-label="بستن"
                                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="px-8 pb-8">{children}</div>
                    </m.div>
                </m.div>
            )}
        </AnimatePresence>
    );
}
