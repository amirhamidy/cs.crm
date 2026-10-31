"use client";

import { Check, Loader2, Power } from "lucide-react";

export function StatusSwitch({
    isActive,
    loading,
    disabled,
    title,
    onToggle,
}: {
    isActive: boolean;
    loading: boolean;
    disabled: boolean;
    title?: string;
    onToggle: () => void;
}) {
    const trackClass = isActive
        ? "border-emerald-500/30 bg-emerald-500/[0.14] dark:border-emerald-500/40 dark:bg-emerald-500/20"
        : "border-gray-400/35 bg-[#e9ecf1] dark:border-gray-400/30 dark:bg-gray-400/[0.16]";

    const knobClass = isActive
        ? "translate-x-0 bg-emerald-500"
        : "translate-x-6 bg-gray-400 dark:bg-gray-500";

    return (
        <button
            type="button"
            role="switch"
            aria-checked={isActive}
            dir="ltr"
            title={title}
            disabled={disabled || loading}
            onClick={(e) => {
                e.stopPropagation();
                if (!disabled && !loading) onToggle();
            }}
            className={`relative inline-flex h-7 w-[52px] shrink-0 items-center rounded-full border-[1.5px] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 ${trackClass} ${disabled
                ? "cursor-not-allowed opacity-55"
                : loading
                    ? "cursor-wait"
                    : "cursor-pointer"
                }`}
        >
            <span
                className={`absolute left-[1.5px] top-[1.5px] flex h-6 w-6 items-center justify-center rounded-full text-white shadow-[0_2px_6px_rgba(15,23,42,0.22)] transition-[transform,background-color] duration-200 ${knobClass}`}
            >
                {loading ? (
                    <Loader2 size={12} className="animate-spin" />
                ) : isActive ? (
                    <Check size={13} strokeWidth={3.2} />
                ) : (
                    <Power size={12} strokeWidth={2.6} />
                )}
            </span>
        </button>
    );
}
