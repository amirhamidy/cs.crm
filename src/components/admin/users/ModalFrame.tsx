"use client";

import { m } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { Portal, useModalBehavior } from "@/components/ui/Portal";

export function ModalFrame({
    onClose,
    locked = false,
    label,
    position = "center",
    className = "",
    children,
}: {
    onClose: () => void;
    locked?: boolean;
    label: string;
    position?: "center" | "bottom";
    className?: string;
    children: ReactNode;
}) {
    const ref = useRef<HTMLDivElement>(null);
    useModalBehavior({ open: true, onClose, containerRef: ref, busy: locked });

    return (
        <Portal>
            <m.div
                ref={ref}
                tabIndex={-1}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => {
                    if (!locked) onClose();
                }}
                role="dialog"
                aria-modal="true"
                aria-label={label}
                dir="rtl"
                className={`fixed inset-0 z-[100] flex justify-center bg-black/60 outline-none ${position === "bottom" ? "items-end" : "items-center p-4"
                    } ${className}`}
            >
                {children}
            </m.div>
        </Portal>
    );
}
