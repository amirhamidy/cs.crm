import { Skeleton, SkeletonAvatar } from "@/components/ui/Skeleton";

export default function PurchasingPageSkeleton() {
    return (
        <div aria-hidden="true" className="animate-pulse space-y-5">
            <div className="flex flex-wrap gap-3">{Array.from({ length: 4 }, (_, i) => <div key={i} className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-gray-50 p-3 dark:bg-white/[0.03]"><Skeleton className="h-8 w-8 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-2/3" /><Skeleton className="h-4 w-1/3" /></div></div>)}</div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <section key={i} className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/[0.07] dark:bg-[#111a2d]"><div className="flex items-center justify-between"><div className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-20" /></div><Skeleton className="h-6 w-8 rounded-full" /></div>{Array.from({ length: 3 }, (_, j) => <div key={j} className="mt-3 flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-white/[0.03]"><SkeletonAvatar size={32} className="rounded-lg" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" /></div><Skeleton className="h-5 w-14 rounded-full bg-amber-500/10 dark:bg-amber-400/10" /></div>)}</section>)}</div>
        </div>
    );
}
