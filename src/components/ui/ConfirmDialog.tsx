"use client";

import { useId, useRef, type ReactNode } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { fade, panelMotion } from "@/lib/motion";
import { Portal, useIsMobile, useModalBehavior } from "./Portal";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    loading?: boolean;
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
                        <m.div
                            {...fade}
                            aria-hidden="true"
                            onClick={() => !loading && onCancel()}
                            className="absolute inset-0 bg-black/50"
                        />
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
                            <div className="mt-5 grid grid-cols-2 gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={onCancel}
                                    disabled={loading}
                                >
                                    {cancelLabel}
                                </Button>
                                <Button
                                    data-autofocus
                                    variant={danger ? "danger" : "primary"}
                                    loading={loading}
                                    onClick={onConfirm}
                                >
                                    {confirmLabel}
                                </Button>
                            </div>
                        </m.div>
                    </div>
                </Portal>
            )}
        </AnimatePresence>
    );
}
