import { Skeleton } from "@/components/ui/Skeleton";

export default function MachineReportSkeleton() {
    return (
        <div aria-hidden="true" className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{Array.from({ length: 6 }, (_, i) => <div key={i} className="rounded-2xl border border-gray-100 bg-white p-3 dark:border-white/[0.07] dark:bg-[#111a2d]"><Skeleton className="h-3 w-20" /><Skeleton className="mt-3 h-6 w-16" /><Skeleton className="mt-2 h-3 w-10" /></div>)}</div>
            <Skeleton className="h-64 w-full rounded-2xl border border-gray-100 bg-gray-50 dark:border-white/[0.07] dark:bg-white/[0.03]" />
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-white/[0.07] dark:bg-[#111a2d]"><div className="flex gap-4 border-b border-gray-100 bg-gray-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-3.5 flex-1" />)}</div>{Array.from({ length: 4 }, (_, i) => <div key={i} className="flex gap-4 border-b border-gray-100 p-4 last:border-0 dark:border-white/[0.05]">{Array.from({ length: 5 }, (_, j) => <Skeleton key={j} className="h-3 flex-1" />)}</div>)}</div>
        </div>
    );
}
