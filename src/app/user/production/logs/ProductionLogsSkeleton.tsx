import { Skeleton } from "@/components/ui/Skeleton";

export default function ProductionLogsSkeleton({ rows = 6 }: { rows?: number }) {
    return (
        <div aria-hidden="true" className="animate-pulse overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#111827]">
            <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3.5 dark:border-white/[0.06]"><Skeleton className="h-10 w-64 rounded-2xl" /><Skeleton className="h-3 w-20" /></div>
            <div className="overflow-hidden">
                <div className="flex gap-4 border-b border-gray-100 bg-gray-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">{Array.from({ length: 9 }, (_, i) => <Skeleton key={i} className="h-3.5 min-w-16 flex-1" />)}</div>
                {Array.from({ length: rows }, (_, i) => <div key={i} className="flex gap-4 border-b border-gray-100 p-4 last:border-0 dark:border-white/[0.05]">{Array.from({ length: 9 }, (_, j) => <Skeleton key={j} className="h-3 min-w-16 flex-1" />)}</div>)}
            </div>
        </div>
    );
}
