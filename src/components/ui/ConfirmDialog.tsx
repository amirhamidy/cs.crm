"use client";

import { useId, useRef, type ReactNode } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { panelMotion } from "@/lib/motion";
import { Backdrop } from "./Backdrop";
import { Portal, useIsMobile, useModalBehavior } from "./Portal";
import { cn } from "@/lib/utils";
import { BusyContent } from "./Button";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    loading?: boolean;
    error?: string | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = "تایید",
    cancelLabel = "انصراف",
    danger = false,
    loading = false,
    error = null,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const mobile = useIsMobile();
    const reduced = !!useReducedMotion();
    const ref = useRef<HTMLDivElement>(null);
    const titleId = useId();

    useModalBehavior({ open, onClose: onCancel, containerRef: ref, busy: loading });

    return (
        <AnimatePresence>
            {open && (
                <Portal>
                    <div className="fixed inset-0 z-[110] flex items-end justify-center md:items-center md:p-4">
                        <Backdrop onClick={() => !loading && onCancel()} />
                        <m.div
                            ref={ref}
                            role="alertdialog"
                            aria-modal="true"
                            aria-labelledby={titleId}
                            tabIndex={-1}
                            {...panelMotion(mobile, reduced)}
                            className="relative w-full overflow-hidden rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] outline-none md:max-w-sm md:rounded-3xl md:pb-5 md:shadow-xl dark:bg-surface-dark"
                        >
                            <div className="flex items-start gap-3">
                                <span
                                    className={cn(
                                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                                        danger
                                            ? "bg-red-50 text-red-600 dark:bg-red-500/15"
                                            : "bg-brand-soft text-brand",
                                    )}
                                >
                                    <AlertTriangle size={20} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <h2
                                        id={titleId}
                                        className="text-[15px] font-bold text-gray-900 dark:text-white"
                                    >
                                        {title}
                                    </h2>
                                    {message && (
                                        <div className="mt-1 text-[13px] leading-6 text-gray-500 dark:text-gray-400">
                                            {message}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {error && (
                                <p role="alert" className="mt-3 rounded-2xl bg-red-50 px-4 py-2.5 text-[12px] font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
                                    {error}
                                </p>
                            )}
                            <div className="mt-5 grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    disabled={loading}
                                    className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    type="button"
                                    data-autofocus
                                    onClick={onConfirm}
                                    disabled={loading}
                                    className={cn(
                                        "relative flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-60",
                                        danger ? "bg-red-600 hover:bg-red-700" : "bg-brand hover:bg-brand-hover",
                                    )}
                                >
                                    <BusyContent busy={loading}>{confirmLabel}</BusyContent>
                                </button>
                            </div>
                                                    </m.div>
                    </div>
                </Portal>
            )}
        </AnimatePresence>
    );
}
