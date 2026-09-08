"use client";

import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
    ({ label, id, className = "", ...props }, ref) => {
        const { resolvedTheme } = useTheme();
        const isDark = resolvedTheme === "dark";

        return (
            <div className="relative">
                <input
                    ref={ref}
                    id={id}
                    placeholder=" "
                    autoComplete="off"
                    className={`
                        peer w-full rounded-4xl border px-5 py-3 text-[13px] font-medium outline-none
                        transition-all duration-200
                        focus:border-indigo-500
                        dark:focus:border-indigo-500/50
                        ${isDark
                            ? "border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/20"
                            : "border-gray-200 bg-white text-gray-900 placeholder:text-gray-400"
                        }
                        ${className}
                    `}
                    {...props}
                />
                <label
                    htmlFor={id}
                    className={`
                        pointer-events-none absolute right-5 top-1/2 -translate-y-1/2
                        rounded px-1.5 text-[12px] font-semibold
                        transition-all duration-200
                        peer-focus:top-0 peer-focus:text-[11px] peer-focus:text-indigo-500
                        peer-[:not(:placeholder-shown)]:top-0
                        peer-[:not(:placeholder-shown)]:text-[11px]
                        peer-[:not(:placeholder-shown)]:text-indigo-500
                        ${isDark
                            ? "bg-[#0f172a] text-gray-400"
                            : "bg-white text-gray-400"
                        }
                    `}
                >
                    {label}
                </label>
            </div>
        );
    }
);
FloatingInput.displayName = "FloatingInput";

interface FloatingSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    id: string;
}

export const FloatingSelect = forwardRef<HTMLSelectElement, FloatingSelectProps>(
    ({ label, id, className = "", children, ...props }, ref) => {
        const { resolvedTheme } = useTheme();
        const isDark = resolvedTheme === "dark";

        return (
            <div className="relative">
                <select
                    ref={ref}
                    id={id}
                    className={`
                        peer w-full appearance-none rounded-4xl border px-5 py-3 text-[13px] font-medium outline-none
                        transition-all duration-200
                        focus:border-indigo-500
                        dark:focus:border-indigo-500/50
                        ${isDark
                            ? "border-white/[0.08] bg-white/[0.04] text-white"
                            : "border-gray-200 bg-white text-gray-900"
                        }
                        ${className}
                    `}
                    {...props}
                >
                    {children}
                </select>
                <ChevronDown
                    size={15}
                    className={`
                        pointer-events-none absolute left-5 top-1/2 -translate-y-1/2
                        transition-transform duration-200
                        peer-focus:rotate-180
                        ${isDark ? "text-gray-500" : "text-gray-400"}
                    `}
                />
                <label
                    htmlFor={id}
                    className={`
                        absolute -top-2 right-5
                        rounded px-1.5 text-[11px] font-semibold text-indigo-500
                        ${isDark ? "bg-[#0f172a]" : "bg-white"}
                    `}
                >
                    {label}
                </label>
            </div>
        );
    }
);
FloatingSelect.displayName = "FloatingSelect";

interface FloatingTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    id: string;
}

export const FloatingTextarea = forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
    ({ label, id, className = "", ...props }, ref) => {
        const { resolvedTheme } = useTheme();
        const isDark = resolvedTheme === "dark";

        return (
            <div className="relative">
                <textarea
                    ref={ref}
                    id={id}
                    placeholder=" "
                    rows={3}
                    className={`
                        peer w-full resize-none rounded-3xl border px-5 py-3 text-[13px] font-medium outline-none
                        transition-all duration-200
                        focus:border-indigo-500
                        dark:focus:border-indigo-500/50
                        ${isDark
                            ? "border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/20"
                            : "border-gray-200 bg-white text-gray-900 placeholder:text-gray-400"
                        }
                        ${className}
                    `}
                    {...props}
                />
                <label
                    htmlFor={id}
                    className={`
                        absolute right-5 top-3
                        rounded px-1.5 text-[12px] font-semibold
                        transition-all duration-200
                        peer-focus:-top-2 peer-focus:text-[11px] peer-focus:text-indigo-500
                        peer-[:not(:placeholder-shown)]:-top-2
                        peer-[:not(:placeholder-shown)]:text-[11px]
                        peer-[:not(:placeholder-shown)]:text-indigo-500
                        ${isDark
                            ? "bg-[#0f172a] text-gray-400"
                            : "bg-white text-gray-400"
                        }
                    `}
                >
                    {label}
                </label>
            </div>
        );
    }
);
FloatingTextarea.displayName = "FloatingTextarea";