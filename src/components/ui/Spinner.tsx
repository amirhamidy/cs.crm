"use client";

import { Loader2 } from "lucide-react";
import { ListSkeleton } from "./skeletons";
import { SkeletonText } from "./Skeleton";
import { cn } from "@/lib/utils";

const SIZES = { xs: 12, sm: 16, md: 20, lg: 28 } as const;

interface SpinnerProps {
    size?: keyof typeof SIZES;
    className?: string;
}

/** @deprecated Use skeletons (ui/skeletons) or Button `loading`. */
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

export function PageLoader({ rows = 5 }: { label?: string; rows?: number }) {
    return <ListSkeleton rows={rows} />;
}

export function InlineLoader({
    className,
}: {
    label?: string;
    className?: string;
}) {
    return <SkeletonText lines={1} className={cn("w-24", className)} />;
}
