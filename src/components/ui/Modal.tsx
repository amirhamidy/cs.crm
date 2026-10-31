"use client";

import { useId, useRef, type ReactNode } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fade, panelMotion } from "@/lib/motion";
import { Portal, useIsMobile, useModalBehavior } from "./Portal";
import { IconButton } from "./Button";

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    /** Blocks backdrop / Esc / X while a request runs */
    busy?: boolean;
    /** Tailwind max-width class for desktop, e.g. "max-w-lg" */
    maxWidth?: string;
    footer?: ReactNode;
    children: ReactNode;
}

/** Bottom sheet on mobile, centered card on desktop. Always fades the backdrop. */
export function Modal({
    open,
    onClose,
    title,
    subtitle,
    icon,
    busy = false,
    maxWidth = "max-w-lg",
    footer,
    children,
}: ModalProps) {
    const mobile = useIsMobile();
    const reduced = !!useReducedMotion();
    const ref = useRef<HTMLDivElement>(null);
    const titleId = useId();

    useModalBehavior({ open, onClose, containerRef: ref, busy });

    return (
        <AnimatePresence>
            {open && (
                <Portal>
                    <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center md:p-4">
                        <m.div
                            {...fade}
                            aria-hidden="true"
                            onClick={() => !busy && onClose()}
                            className="absolute inset-0 bg-black/50"
                        />
                        <m.div
                            ref={ref}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby={titleId}
                            tabIndex={-1}
                            {...panelMotion(mobile, reduced)}
                            className={cn(
                                "relative flex max-h-[92dvh] w-full flex-col overflow-hidden bg-white outline-none dark:bg-surface-dark",
                                "rounded-t-3xl md:max-h-[88dvh] md:rounded-3xl md:border md:border-gray-100 md:dark:border-white/10",
                                "md:shadow-xl",
                                maxWidth,
                            )}
                        >
                            <div
                                aria-hidden="true"
                                className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-gray-300 md:hidden dark:bg-white/20"
                            />
                            <header className="flex shrink-0 items-center gap-3 border-b border-gray-100 px-5 py-3 dark:border-white/10">
                                {icon && (
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                                        {icon}
                                    </span>
                                )}
                                <div className="min-w-0 flex-1">
                                    <h2
                                        id={titleId}
                                        className="truncate text-[15px] font-bold text-gray-900 dark:text-white"
                                    >
                                        {title}
                                    </h2>
                                    {subtitle && (
                                        <p className="truncate text-[12px] text-gray-500 dark:text-gray-400">
                                            {subtitle}
                                        </p>
                                    )}
                                </div>
                                <IconButton
                                    aria-label="بستن"
                                    onClick={onClose}
                                    disabled={busy}
                                >
                                    <X size={18} />
                                </IconButton>
                            </header>
                            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
                                {children}
                            </div>
                            {footer && (
                                <footer className="shrink-0 border-t border-gray-100 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-white/10">
                                    {footer}
                                </footer>
                            )}
                        </m.div>
                    </div>
                </Portal>
            )}
        </AnimatePresence>
    );
}
