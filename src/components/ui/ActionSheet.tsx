"use client";

import { useRef, type ReactNode } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fade, panelMotion } from "@/lib/motion";
import { Portal, useIsMobile, useModalBehavior } from "./Portal";

export interface ActionSheetItem {
    key: string;
    label: string;
    icon?: ReactNode;
    danger?: boolean;
    disabled?: boolean;
    onSelect: () => void;
}

interface ActionSheetProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    items: ActionSheetItem[];
}

/** Menu of actions: bottom sheet on mobile, small centered card on desktop. */
export function ActionSheet({ open, onClose, title, items }: ActionSheetProps) {
    const mobile = useIsMobile();
    const reduced = !!useReducedMotion();
    const ref = useRef<HTMLDivElement>(null);
    useModalBehavior({ open, onClose, containerRef: ref });

    return (
        <AnimatePresence>
            {open && (
                <Portal>
                    <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center md:p-4">
                        <m.div
                            {...fade}
                            aria-hidden="true"
                            onClick={onClose}
                            className="absolute inset-0 bg-black/40"
                        />
                        <m.div
                            ref={ref}
                            role="dialog"
                            aria-modal="true"
                            aria-label={title ?? "عملیات"}
                            tabIndex={-1}
                            {...panelMotion(mobile, reduced)}
                            className="relative w-full overflow-hidden rounded-t-3xl bg-white p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] outline-none md:max-w-xs md:rounded-3xl md:shadow-xl dark:bg-surface-dark"
                        >
                            {title && (
                                <p className="px-3 py-2 text-[12px] font-bold text-gray-500">
                                    {title}
                                </p>
                            )}
                            {items.map((it) => (
                                <button
                                    key={it.key}
                                    type="button"
                                    disabled={it.disabled}
                                    onClick={() => {
                                        onClose();
                                        it.onSelect();
                                    }}
                                    className={cn(
                                        "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-start text-[13px] font-medium transition-colors hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-white/10",
                                        it.danger
                                            ? "text-red-600"
                                            : "text-gray-800 dark:text-gray-100",
                                    )}
                                >
                                    {it.icon}
                                    {it.label}
                                </button>
                            ))}
                        </m.div>
                    </div>
                </Portal>
            )}
        </AnimatePresence>
    );
}
