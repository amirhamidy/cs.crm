import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
    return (
        <div
            aria-hidden="true"
            className={cn(
                "animate-pulse rounded-lg bg-gray-200/80 motion-reduce:animate-none dark:bg-white/10",
                className,
            )}
        />
    );
}

export function SkeletonCircle({ className }: { className?: string }) {
    return <Skeleton className={cn("rounded-full", className)} />;
}
