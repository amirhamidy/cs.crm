import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
    return (
        <div
            aria-hidden="true"
            style={style}
            className={cn(
                "rounded-lg bg-gray-200/80 dark:bg-white/10",
                className,
            )}
        />
    );
}

export function SkeletonCircle({ className }: { className?: string }) {
    return <Skeleton className={cn("rounded-full", className)} />;
}

export function SkeletonBlock({ className }: { className?: string }) {
    return <Skeleton className={cn("h-24 w-full rounded-2xl", className)} />;
}

export function SkeletonAvatar({ size = 32, className }: { size?: number; className?: string }) {
    return (
        <Skeleton
            className={cn("shrink-0 rounded-full", className)}
            style={{ width: size, height: size }}
        />
    );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
    return (
        <div aria-hidden="true" className={cn("animate-pulse space-y-2 motion-reduce:animate-none", className)}>
            {Array.from({ length: lines }, (_, i) => (
                <Skeleton
                    key={i}
                    className={cn("h-3 rounded", i === lines - 1 && lines > 1 ? "w-3/5" : "w-full")}
                />
            ))}
        </div>
    );
}
