"use client";

import {
    forwardRef,
    type InputHTMLAttributes,
    type SelectHTMLAttributes,
    type TextareaHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";

const FIELD_SHELL =
    "peer w-full rounded-2xl border border-gray-200 bg-white text-[11.5px] font-bold text-gray-800 outline-none transition-all placeholder:text-transparent focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/[0.08] dark:bg-[#111a2d] dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400/10";

const FIELD_LABEL =
    "pointer-events-none absolute right-4 top-0 -translate-y-1/2 bg-white px-1 text-[9px] font-bold text-gray-400 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-[10.5px] peer-focus:top-0 peer-focus:text-[9px] peer-focus:text-indigo-500 dark:bg-[#111a2d] dark:text-gray-500 dark:peer-focus:text-indigo-300";

export const OPTION_CLASS = "bg-white text-gray-800 dark:bg-[#111a2d] dark:text-gray-100";

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(function FloatingInput(
    { label, className = "", ...rest },
    ref
) {
    return (
        <div className="relative">
            <input ref={ref} {...rest} placeholder={rest.placeholder ?? " "} className={`${FIELD_SHELL} px-4 py-3.5 ${className}`} />
            <label className={FIELD_LABEL}>{label}</label>
        </div>
    );
});
FloatingInput.displayName = "FloatingInput";

interface FloatingSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
}

export const FloatingSelect = forwardRef<HTMLSelectElement, FloatingSelectProps>(function FloatingSelect(
    { label, className = "", children, ...rest },
    ref
) {
    return (
        <div className="relative">
            <select
                ref={ref}
                {...rest}
                style={{ colorScheme: "light", ...rest.style }}
                className={`${FIELD_SHELL} appearance-none px-4 py-3.5 pl-10 disabled:opacity-60 dark:[color-scheme:dark] ${className}`}
            >
                {children}
            </select>
            <label className={`${FIELD_LABEL} peer-placeholder-shown:top-0 peer-placeholder-shown:text-[9px]`}>{label}</label>
            <ChevronDown size={14} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 dark:text-indigo-300" />
        </div>
    );
});
FloatingSelect.displayName = "FloatingSelect";

interface FloatingTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
}

export const FloatingTextarea = forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(function FloatingTextarea(
    { label, className = "", ...rest },
    ref
) {
    return (
        <div className="relative">
            <textarea
                ref={ref}
                {...rest}
                placeholder={rest.placeholder ?? " "}
                className={`min-h-[110px] resize-none leading-6 ${FIELD_SHELL} px-4 pb-3 pt-4 ${className}`}
            />
            <label className={FIELD_LABEL}>{label}</label>
        </div>
    );
});
FloatingTextarea.displayName = "FloatingTextarea";