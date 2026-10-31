"use client";

import { cn } from "@/lib/utils";

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    "aria-label"?: string;
    "aria-labelledby"?: string;
    className?: string;
}

/**
 * Visual size 44x24; the ::before pseudo-element extends the hit area to
 * 64x44 without changing layout or appearance.
 */
export function Switch({
    checked,
    onChange,
    disabled,
    className,
    ...aria
}: SwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                "before:absolute before:-inset-x-2.5 before:-inset-y-2.5 before:content-['']",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                "disabled:cursor-not-allowed disabled:opacity-50",
                checked ? "bg-brand" : "bg-gray-300 dark:bg-white/20",
                className,
            )}
            {...aria}
        >
            <span
                aria-hidden="true"
                className={cn(
                    "pointer-events-none absolute start-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 motion-reduce:transition-none",
                    checked && "ltr:translate-x-5 rtl:-translate-x-5",
                )}
            />
        </button>
    );
}
