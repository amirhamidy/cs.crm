"use client";

import {
    forwardRef,
    type InputHTMLAttributes,
    type SelectHTMLAttributes,
    type TextareaHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";

interface FloatingInputProps
    extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

export const FloatingInput = forwardRef<
    HTMLInputElement,
    FloatingInputProps
>(function FloatingInput({ label, className = "", ...props }, ref) {
    return (
        <div className="relative">
            <input
                ref={ref}
                {...props}
                placeholder={props.placeholder ?? " "}
                className={`peer w-full rounded-[1.35rem] border border-gray-200 bg-white px-4 pb-2.5 pt-5 text-[11.5px] font-semibold text-gray-800 outline-none transition-all placeholder:text-transparent focus:border-indigo-500 dark:border-white/[0.08] dark:bg-[#0f172a] dark:text-white dark:focus:border-indigo-500 ${className}`}
            />
            <label className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 bg-white px-1 text-[10.5px] font-semibold text-gray-400 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[10.5px] peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[9px] peer-focus:text-indigo-500 dark:bg-[#0f172a]">
                {label}
            </label>
        </div>
    );
});

FloatingInput.displayName = "FloatingInput";

interface FloatingSelectProps
    extends SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
}

export const FloatingSelect = forwardRef<
    HTMLSelectElement,
    FloatingSelectProps
>(function FloatingSelect({ label, className = "", children, ...props }, ref) {
    return (
        <div className="relative">
            <select
                ref={ref}
                {...props}
                className={`w-full appearance-none rounded-[1.35rem] border border-gray-200 bg-white px-4 py-3.5 pl-10 text-[11.5px] font-semibold text-gray-800 outline-none transition-all focus:border-indigo-500 dark:border-white/[0.08] dark:bg-[#0f172a] dark:text-white dark:focus:border-indigo-500 ${className}`}
            >
                {children}
            </select>

            <label className="pointer-events-none absolute right-4 top-0 -translate-y-1/2 bg-white px-1 text-[9px] font-semibold text-gray-400 dark:bg-[#0f172a]">
                {label}
            </label>

            <ChevronDown
                size={14}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
        </div>
    );
});

FloatingSelect.displayName = "FloatingSelect";

interface FloatingTextareaProps
    extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
}

export const FloatingTextarea = forwardRef<
    HTMLTextAreaElement,
    FloatingTextareaProps
>(function FloatingTextarea(
    { label, className = "", ...props },
    ref
) {
    return (
        <div className="relative">
            <textarea
                ref={ref}
                {...props}
                placeholder={props.placeholder ?? " "}
                className={`peer min-h-[110px] w-full resize-none rounded-[1.35rem] border border-gray-200 bg-white px-4 pb-3 pt-6 text-[11.5px] font-semibold leading-6 text-gray-800 outline-none transition-all placeholder:text-transparent focus:border-indigo-500 dark:border-white/[0.08] dark:bg-[#0f172a] dark:text-white dark:focus:border-indigo-500 ${className}`}
            />

            <label className="pointer-events-none absolute right-4 top-0 -translate-y-1/2 bg-white px-1 text-[9px] font-semibold text-gray-400 peer-focus:text-indigo-500 dark:bg-[#0f172a]">
                {label}
            </label>
        </div>
    );
});

FloatingTextarea.displayName = "FloatingTextarea";