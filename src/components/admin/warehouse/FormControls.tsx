"use client";

import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
    ({ label, id, className = "", ...props }, ref) => (
        <div className="relative">
            <input
                ref={ref}
                id={id}
                placeholder=" "
                autoComplete="new-password"
                className={`
                    peer w-full border border-gray-200 rounded-4xl
                    px-5 py-3 text-sm text-black outline-none
                    transition-all duration-200
                    focus:border-gray-400
                    dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white
                    dark:focus:border-blue-500
                    ${className}
                `}
                {...props}
            />
            <label
                htmlFor={id}
                className="
                    absolute right-5 top-1/2 -translate-y-1/2
                    text-sm text-gray-400 pointer-events-none
                    transition-all duration-200
                    bg-white dark:bg-[#0f172a] px-1.5 rounded
                    peer-focus:top-0 peer-focus:text-xs peer-focus:text-gray-500
                    peer-[:not(:placeholder-shown)]:top-0
                    peer-[:not(:placeholder-shown)]:text-xs
                    peer-[:not(:placeholder-shown)]:text-gray-500
                "
            >
                {label}
            </label>
        </div>
    )
);
FloatingInput.displayName = "FloatingInput";

interface FloatingSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    id: string;
}

export const FloatingSelect = forwardRef<HTMLSelectElement, FloatingSelectProps>(
    ({ label, id, className = "", children, ...props }, ref) => (
        <div className="relative">
            <select
                ref={ref}
                id={id}
                className={`
                    peer w-full appearance-none border border-gray-200 rounded-4xl
                    px-5 py-3 text-sm text-black outline-none
                    transition-all duration-200
                    focus:border-gray-400
                    dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white
                    dark:focus:border-blue-500
                    ${className}
                `}
                {...props}
            >
                {children}
            </select>
            <ChevronDown
                size={15}
                className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <label
                htmlFor={id}
                className="
                    absolute right-5 -top-2
                    text-xs text-gray-500 pointer-events-none
                    bg-white dark:bg-[#0f172a] px-1.5 rounded
                "
            >
                {label}
            </label>
        </div>
    )
);
FloatingSelect.displayName = "FloatingSelect";

interface FloatingTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    id: string;
}

export const FloatingTextarea = forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
    ({ label, id, className = "", ...props }, ref) => (
        <div className="relative">
            <textarea
                ref={ref}
                id={id}
                placeholder=" "
                rows={3}
                className={`
                    peer w-full resize-none border border-gray-200 rounded-3xl
                    px-5 py-3 text-sm text-black outline-none
                    transition-all duration-200
                    focus:border-gray-400
                    dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white
                    dark:focus:border-blue-500
                    ${className}
                `}
                {...props}
            />
            <label
                htmlFor={id}
                className="
                    absolute right-5 top-3
                    text-sm text-gray-400 pointer-events-none
                    transition-all duration-200
                    bg-white dark:bg-[#0f172a] px-1.5 rounded
                    peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-500
                    peer-[:not(:placeholder-shown)]:-top-2
                    peer-[:not(:placeholder-shown)]:text-xs
                    peer-[:not(:placeholder-shown)]:text-gray-500
                "
            >
                {label}
            </label>
        </div>
    )
);
FloatingTextarea.displayName = "FloatingTextarea";