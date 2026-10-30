"use client";

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

const FIELD_BASE =
    "w-full rounded-2xl border border-gray-200 bg-white text-[11.5px] font-semibold text-gray-800 outline-none transition-all placeholder:text-transparent focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/[.08] dark:bg-[#101827] dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400/10";

const LABEL_BASE =
    "pointer-events-none absolute right-4 bg-white px-1 font-semibold text-gray-400 dark:bg-[#101827] dark:text-gray-500";

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
    function FloatingInput({ label, className = "", ...props }, ref) {
        return (
            <div className="relative">
                <input
                    ref={ref}
                    {...props}
                    placeholder={props.placeholder ?? " "}
                    className={`peer ${FIELD_BASE} px-4 py-3.5 ${className}`}
                />
                <label
                    className={`${LABEL_BASE} top-0 -translate-y-1/2 text-[9px] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-[10.5px] peer-focus:top-0 peer-focus:text-[9px] peer-focus:text-indigo-500 dark:peer-focus:text-indigo-400`}
                >
                    {label}
                </label>
            </div>
        );
    }
);

FloatingInput.displayName = "FloatingInput";


interface FloatingTextareaProps
    extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
}

export const FloatingTextarea = forwardRef<
    HTMLTextAreaElement,
    FloatingTextareaProps
>(function FloatingTextarea({ label, className = "", ...props }, ref) {
    return (
        <div className="relative">
            <textarea
                ref={ref}
                {...props}
                placeholder={props.placeholder ?? " "}
                className={`peer min-h-[110px] resize-none leading-6 ${FIELD_BASE} px-4 pb-3 pt-4 ${className}`}
            />

            <label
                className={`${LABEL_BASE} top-0 -translate-y-1/2 text-[9px] peer-focus:text-indigo-500 dark:peer-focus:text-indigo-400`}
            >
                {label}
            </label>
        </div>
    );
});

FloatingTextarea.displayName = "FloatingTextarea";