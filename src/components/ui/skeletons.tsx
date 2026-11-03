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
        <div className={cn("animate-pulse motion-reduce:animate-none", className)} aria-busy="true" aria-live="polite">
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
        <div className={cn("animate-pulse motion-reduce:animate-none space-y-2.5", className)} aria-busy="true" aria-live="polite">
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
            className={cn("animate-pulse motion-reduce:animate-none overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-white/[0.07] dark:bg-[#111a2d]", className)}
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
        <div className={cn("animate-pulse motion-reduce:animate-none space-y-4", className)} aria-busy="true" aria-live="polite">
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
            className={cn("animate-pulse motion-reduce:animate-none grid grid-cols-2 gap-3 lg:grid-cols-4", className)}
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
        <div className={cn("animate-pulse motion-reduce:animate-none flex gap-3 overflow-hidden", className)} aria-busy="true" aria-live="polite">
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
        <div className={cn("animate-pulse motion-reduce:animate-none space-y-4", className)} aria-busy="true" aria-live="polite">
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

export function CaseCardSkeleton({ count = 6, className = "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" }: { count?: number; className?: string }) {
    return (
        <div className={cn("animate-pulse motion-reduce:animate-none", className)} aria-busy="true" aria-live="polite">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className={CARD}>
                    <div className="flex items-center justify-between gap-3">
                        <Skeleton className="h-4 w-2/5" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                    <Skeleton className="mt-3 h-3 w-1/3" />
                    <SkeletonText lines={2} className="mt-4" />
                    <div className="mt-5 flex items-center justify-between">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
            ))}
        </div>
    );
}

const PULSE = "animate-pulse motion-reduce:animate-none";

/** Small inline placeholder next to header counters (replaces "در حال بارگذاری..."). */
export function CountSkeleton({ className }: { className?: string }) {
    return <Skeleton className={cn("inline-block h-3 w-16 align-middle", PULSE, className)} />;
}

const TASK_CARD =
    "flex min-h-[130px] flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]";

/** Matches tasks/TaskCard: status pill + action buttons, title, description, chips footer. */
export function TaskCardSkeleton({ count = 6, className = "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" }: { count?: number; className?: string }) {
    return (
        <div className={cn(PULSE, className)} aria-busy="true" aria-live="polite">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className={TASK_CARD}>
                    <div className="flex items-start justify-between gap-3">
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <div className="flex gap-1.5">
                            <Skeleton className="h-7 w-7 rounded-xl" />
                            <Skeleton className="h-7 w-7 rounded-xl" />
                            <Skeleton className="h-7 w-7 rounded-xl" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-3/5" />
                        <SkeletonText lines={2} />
                    </div>
                    <div className="mt-auto flex gap-2 border-t border-gray-100 pt-2.5 dark:border-white/[0.05]">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/** Matches admin dashboard StatsCard row. */
export function DashboardStatsSkeleton({ count = 3, className }: { count?: number; className?: string }) {
    return (
        <div className={cn(PULSE, "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3", className)} aria-busy="true" aria-live="polite">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="flex items-start justify-between gap-2 rounded-2xl border border-black/5 bg-black/[0.02] p-4 dark:border-white/5 dark:bg-white/[0.02]">
                    <div className="flex-1 space-y-3">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-xl" />
                </div>
            ))}
        </div>
    );
}

export function ChartSkeleton({ className }: { className?: string }) {
    return (
        <Skeleton
            className={cn("h-[300px] rounded-2xl border border-gray-100 bg-gray-50 dark:border-white/5 dark:bg-gray-900/40", PULSE, className)}
        />
    );
}

/** Whole admin dashboard: stats row + two rows of two charts. */
export function DashboardSkeleton() {
    return (
        <div className="space-y-5" aria-busy="true" aria-live="polite">
            <DashboardStatsSkeleton />
            {[0, 1].map((r) => (
                <div key={r} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <ChartSkeleton />
                    <ChartSkeleton />
                </div>
            ))}
        </div>
    );
}

/** Generic admin route fallback: title, stat cards, one large block. */
export function PageSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("space-y-4", className)} aria-busy="true" aria-live="polite">
            <Skeleton className={cn("h-8 w-48", PULSE)} />
            <StatCardsSkeleton />
            <SkeletonBlock className={cn("h-96", PULSE)} />
        </div>
    );
}

/** Calendar page: toolbar, weekday row and a month grid. */
export function CalendarSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn(PULSE, "space-y-3 p-3 sm:p-4", className)} aria-busy="true" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-9 w-40 rounded-xl" />
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <Skeleton className="h-9 w-24 rounded-xl" />
                </div>
            </div>
            <div className={cn(CARD, "space-y-2 !rounded-2xl !p-3")}>
                <div className="grid grid-cols-7 gap-1.5">
                    {Array.from({ length: 7 }, (_, i) => (
                        <Skeleton key={i} className="mx-auto h-3 w-8" />
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                    {Array.from({ length: 35 }, (_, i) => (
                        <Skeleton key={i} className="h-12 rounded-xl bg-gray-100 sm:h-16 dark:bg-white/[0.06]" />
                    ))}
                </div>
            </div>
        </div>
    );
}

/** Matches admin/departments/DepartmentCard: icon + name, step pills, member chips. */
export function DepartmentCardSkeleton({ count = 6, className = "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" }: { count?: number; className?: string }) {
    return (
        <div className={cn(PULSE, className)} aria-busy="true" aria-live="polite">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/[0.07] dark:bg-[#111a2d]">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-9 w-9 rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-3.5 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <Skeleton className="h-7 w-7 rounded-lg" />
                            <Skeleton className="h-7 w-7 rounded-lg" />
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5">
                        {Array.from({ length: 4 }, (_, s) => (
                            <Skeleton key={s} className="h-10 rounded-xl" />
                        ))}
                    </div>
                    <div className="mt-4 flex gap-2 border-t border-gray-100 pt-3 dark:border-white/[0.05]">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/** Two stacked task placeholders inside a department stage column. */
export function StageTasksSkeleton() {
    return (
        <div className={cn(PULSE, "space-y-2 p-3")} aria-busy="true" aria-live="polite">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
        </div>
    );
}

/** Department detail route: back/title row, members panel, stage board. */
export function DepartmentDetailSkeleton() {
    return (
        <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
            <div className={cn(PULSE, "flex items-center gap-2.5")}>
                <Skeleton className="h-8 w-8 rounded-xl" />
                <Skeleton className="h-8 w-8 rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
            <SkeletonBlock className={cn("h-24", PULSE)} />
            <BoardSkeleton />
        </div>
    );
}

/** Matches HumanResourceCard: avatar + title + actions, divider, stats. */
export function HumanResourceCardSkeleton({ count = 6, className = "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" }: { count?: number; className?: string }) {
    return (
        <div className={cn(PULSE, className)} aria-busy="true" aria-live="polite">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="rounded-[1.45rem] border border-gray-100 bg-white p-3 dark:border-white/[0.06] dark:bg-[#111827]">
                    <div className="flex items-start gap-3">
                        <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />
                        <div className="min-w-0 flex-1 space-y-2">
                            <Skeleton className="h-3.5 w-2/5" />
                            <Skeleton className="h-3 w-1/3" />
                        </div>
                        <div className="flex gap-1">
                            <Skeleton className="h-7 w-7 rounded-lg" />
                            <Skeleton className="h-7 w-7 rounded-lg" />
                        </div>
                    </div>
                    <div className="mt-3 h-px bg-gray-100 dark:bg-white/[0.06]" />
                    <div className="mt-3 flex gap-2">
                        <Skeleton className="h-9 flex-1 rounded-xl" />
                        <Skeleton className="h-9 flex-1 rounded-xl" />
                    </div>
                </div>
            ))}
        </div>
    );
}
