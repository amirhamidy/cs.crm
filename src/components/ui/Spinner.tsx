"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = { xs: 12, sm: 16, md: 20, lg: 28 } as const;

interface SpinnerProps {
    size?: keyof typeof SIZES;
    className?: string;
}

/** The one loading icon used across the app. */
export function Spinner({ size = "sm", className }: SpinnerProps) {
    return (
        <Loader2
            size={SIZES[size]}
            aria-hidden="true"
            className={cn(
                "shrink-0 animate-spin motion-reduce:[animation-duration:2.5s]",
                className,
            )}
        />
    );
}

export function PageLoader({ label = "در حال بارگذاری..." }: { label?: string }) {
    return (
        <div
            role="status"
            className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-gray-400"
        >
            <Spinner size="lg" className="text-brand" />
            <span className="text-[13px]">{label}</span>
        </div>
    );
}

export function InlineLoader({
    label,
    className,
}: {
    label?: string;
    className?: string;
}) {
    return (
        <span
            role="status"
            className={cn(
                "inline-flex items-center gap-2 text-[13px] text-gray-400",
                className,
            )}
        >
            <Spinner />
            {label}
        </span>
    );
}
