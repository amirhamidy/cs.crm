import { Skeleton } from "@/components/ui/Skeleton";

export default function CustomerOrdersSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div aria-hidden="true" className="animate-pulse space-y-3">
            {Array.from({ length: count }, (_, i) => <article key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/[0.07] dark:bg-[#111a2d]"><div className="min-w-0 flex-1 space-y-2"><div className="flex items-center gap-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-5 w-16 rounded-full bg-amber-500/10 dark:bg-amber-400/10" /></div><Skeleton className="h-3 w-2/3" /><Skeleton className="h-3 w-1/3" /></div><div className="flex gap-2"><Skeleton className="h-9 w-20 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/10" /><Skeleton className="h-9 w-20 rounded-lg bg-rose-500/10 dark:bg-rose-400/10" /></div></article>)}
        </div>
    );
}
