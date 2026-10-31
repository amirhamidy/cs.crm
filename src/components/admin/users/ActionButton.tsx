"use client";

import type { ReactNode } from "react";
import { SWEEP_GRADIENTS } from "./userCardUtils";

export function ActionButton({
    sweepKey,
    icon,
    label,
    disabled,
    onClick,
}: {
    sweepKey: string;
    icon: ReactNode;
    label: string;
    disabled: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            aria-disabled={disabled}
            onClick={(e) => {
                e.stopPropagation();
                if (!disabled) onClick();
            }}
            className={`relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-black/[0.14] bg-[#e2e2e2] transition-[color,transform] duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 dark:border-white/[0.13] dark:bg-[#1e1e1e] ${disabled
                ? "cursor-not-allowed text-gray-400 opacity-45 dark:text-gray-500"
                : "cursor-pointer text-gray-700 active:scale-95 group-hover/btn:text-white dark:text-gray-200"
                }`}
        >
            {!disabled && (
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 origin-left scale-x-0 rounded-full transition-transform duration-300 ease-out group-hover/btn:scale-x-100"
                    style={{ background: SWEEP_GRADIENTS[sweepKey] ?? "#6366f1" }}
                />
            )}
            <span className="relative z-10 flex items-center justify-center">
                {icon}
            </span>
        </button>
    );
}
