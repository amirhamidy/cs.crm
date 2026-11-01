import { cn } from "@/lib/utils";
import { Skeleton, SkeletonAvatar, SkeletonBlock, SkeletonText } from "./Skeleton";

const CARD =
    "rounded-[1.8rem] border border-gray-100 bg-white p-4 dark:border-white/[0.07] dark:bg-[#111a2d]";

export function CardGridSkeleton({
    count = 6,
    className = "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3",
}: {
    count?: number;
    className?: string;
}) {
    return (
        <div className={className} aria-busy="true" aria-live="polite">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className={CARD}>
                    <div className="flex items-center justify-between gap-3">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <SkeletonText lines={2} className="mt-4" />
                    <div className="mt-5 flex items-center justify-between">
                        <SkeletonAvatar size={24} />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ListSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
    return (
        <div className={cn("space-y-2.5", className)} aria-busy="true" aria-live="polite">
            {Array.from({ length: rows }, (_, i) => (
                <div key={i} className={cn(CARD, "flex items-center gap-3 !rounded-2xl !p-3")}>
                    <SkeletonAvatar size={36} />
                    <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-2/5" />
                        <Skeleton className="h-3 w-3/5" />
                    </div>
                    <Skeleton className="h-5 w-14 rounded-full" />
                </div>
            ))}
        </div>
    );
}

export function TableSkeleton({
    rows = 6,
    cols = 4,
    className,
}: {
    rows?: number;
    cols?: number;
    className?: string;
}) {
    return (
        <div
            className={cn("overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-white/[0.07] dark:bg-[#111a2d]", className)}
            aria-busy="true"
            aria-live="polite"
        >
            <div className="flex gap-4 border-b border-gray-100 p-3 dark:border-white/[0.07]">
                {Array.from({ length: cols }, (_, c) => (
                    <Skeleton key={c} className="h-3.5 flex-1" />
                ))}
            </div>
            {Array.from({ length: rows }, (_, r) => (
                <div key={r} className="flex gap-4 p-3">
                    {Array.from({ length: cols }, (_, c) => (
                        <Skeleton key={c} className="h-3 flex-1 bg-gray-100 dark:bg-white/[0.06]" />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function FormSkeleton({ fields = 4, className }: { fields?: number; className?: string }) {
    return (
        <div className={cn("space-y-4", className)} aria-busy="true" aria-live="polite">
            {Array.from({ length: fields }, (_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-11 w-full rounded-2xl" />
                </div>
            ))}
            <Skeleton className="h-11 w-full rounded-2xl" />
        </div>
    );
}

export function StatCardsSkeleton({ count = 4, className }: { count?: number; className?: string }) {
    return (
        <div
            className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}
            aria-busy="true"
            aria-live="polite"
        >
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className={cn(CARD, "space-y-3")}>
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-3 w-24" />
                </div>
            ))}
        </div>
    );
}

export function BoardSkeleton({ columns = 3, className }: { columns?: number; className?: string }) {
    return (
        <div className={cn("flex gap-3 overflow-hidden", className)} aria-busy="true" aria-live="polite">
            {Array.from({ length: columns }, (_, c) => (
                <div
                    key={c}
                    className="w-72 shrink-0 space-y-2.5 rounded-2xl bg-gray-100/70 p-3 dark:bg-white/[0.04]"
                >
                    <Skeleton className="h-4 w-1/2" />
                    {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className={cn(CARD, "space-y-2 !rounded-2xl !p-3")}>
                            <Skeleton className="h-3.5 w-4/5" />
                            <Skeleton className="h-3 w-2/5" />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

export function DetailSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("space-y-4", className)} aria-busy="true" aria-live="polite">
            <div className="flex items-center gap-3">
                <SkeletonAvatar size={48} />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                </div>
            </div>
            <SkeletonBlock className="h-32" />
            <SkeletonText lines={4} />
            <SkeletonBlock className="h-40" />
        </div>
    );
}
