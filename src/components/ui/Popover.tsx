"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { popoverMotion } from "@/lib/motion";

type PopoverProps = {
    open: boolean;
    onClose: () => void;
    trigger: ReactNode;
    label: string;
    children: ReactNode;
    /** Panel classes; must include positioning (absolute/fixed), width and surface. */
    panelClassName?: string;
    className?: string;
};

export default function Popover({
    open,
    onClose,
    trigger,
    label,
    children,
    panelClassName = "",
    className = "",
}: PopoverProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const returnRef = useRef<HTMLElement | null>(null);
    const reduced = useReducedMotion() ?? false;

    useEffect(() => {
        if (!open) return;
        returnRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const onPointerDown = (e: PointerEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) onClose();
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
            returnRef.current?.focus?.();
        };
    }, [open, onClose]);

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            {trigger}
            <AnimatePresence>
                {open && (
                    <m.div
                        role="dialog"
                        aria-label={label}
                        dir="rtl"
                        {...popoverMotion(reduced)}
                        className={`z-50 ${panelClassName}`}
                    >
                        {children}
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}
