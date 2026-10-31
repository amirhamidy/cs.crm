"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "soft" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
    primary: "bg-brand text-white hover:bg-brand-hover",
    secondary:
        "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10",
    soft: "bg-brand-soft text-brand hover:bg-brand/20",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost:
        "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10",
};

// md/lg keep a >=44px touch height on mobile.
const SIZES: Record<ButtonSize, string> = {
    sm: "h-9 px-3 text-[12.5px]",
    md: "h-11 px-5 text-[13px] md:h-10",
    lg: "h-12 px-6 text-sm",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    icon?: ReactNode;
    fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
        variant = "primary",
        size = "md",
        loading = false,
        icon,
        fullWidth,
        className,
        children,
        disabled,
        type = "button",
        ...rest
    },
    ref,
) {
    return (
        <button
            ref={ref}
            type={type}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={cn(
                "inline-flex select-none items-center justify-center gap-2 rounded-2xl font-bold transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                "disabled:cursor-not-allowed disabled:opacity-60",
                VARIANTS[variant],
                SIZES[size],
                fullWidth && "w-full",
                className,
            )}
            {...rest}
        >
            {loading ? <Spinner size="sm" /> : icon}
            {children}
        </button>
    );
});

export interface IconButtonProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
    "aria-label": string;
    variant?: "ghost" | "soft" | "secondary" | "danger";
    loading?: boolean;
}

/** Square icon button; 44px on mobile, 36px on desktop. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    function IconButton(
        { variant = "ghost", loading, className, children, disabled, type = "button", ...rest },
        ref,
    ) {
        return (
            <button
                ref={ref}
                type={type}
                disabled={disabled || loading}
                className={cn(
                    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors md:h-9 md:w-9",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    VARIANTS[variant],
                    className,
                )}
                {...rest}
            >
                {loading ? <Spinner size="sm" /> : children}
            </button>
        );
    },
);
