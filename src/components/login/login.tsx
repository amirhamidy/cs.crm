"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
    ({ label, id, className = "", ...props }, ref) => {
        return (
            <div className="relative mx-0">
                <input
                    ref={ref}
                    id={id}
                    placeholder=" "
                    autoComplete="new-password"
                    className={`
            peer w-full  border border-gray-200 rounded-4xl
            px-5 py-3 text-sm text-black outline-none
            transition-all duration-200
            focus:border-gray-400
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
            bg-white px-1.5 rounded
            peer-focus:top-0 peer-focus:text-xs peer-focus:text-gray-500
            peer-[:not(:placeholder-shown)]:top-0
            peer-[:not(:placeholder-shown)]:text-xs
            peer-[:not(:placeholder-shown)]:text-gray-500
          "
                >
                    {label}
                </label>
            </div>
        );
    }
);

FloatingInput.displayName = "FloatingInput";