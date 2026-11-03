import { Skeleton } from "@/components/ui/Skeleton";

export default function CustomerPortalAccountsSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div aria-hidden="true" className="grid animate-pulse grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: count }, (_, i) => <article key={i} className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/[0.07] dark:bg-[#111a2d]"><div className="flex items-start justify-between gap-3"><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /></div><Skeleton className="h-6 w-16 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10" /></div><div className="mt-4 space-y-2"><Skeleton className="h-3 w-4/5" /><Skeleton className="h-3 w-3/5" /></div><div className="mt-4 flex flex-wrap gap-2"><Skeleton className="h-8 w-20 rounded-lg" /><Skeleton className="h-8 w-24 rounded-lg bg-indigo-500/10 dark:bg-indigo-400/10" /><Skeleton className="h-8 w-16 rounded-lg bg-rose-500/10 dark:bg-rose-400/10" /></div></article>)}
        </div>
    );
}
