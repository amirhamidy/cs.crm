import { Skeleton } from "@/components/ui/Skeleton";

export default function QCItemCardSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div aria-hidden="true" className="grid animate-pulse grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: count }, (_, i) => <article key={i} className="overflow-hidden rounded-[1.45rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#111827]"><div className="p-3"><div className="flex items-start gap-3"><Skeleton className="h-11 w-11 shrink-0 rounded-2xl bg-indigo-500/10 dark:bg-indigo-400/10" /><div className="min-w-0 flex-1 space-y-2"><div className="flex justify-between gap-2"><Skeleton className="h-3.5 w-2/3" /><Skeleton className="h-5 w-16 rounded-full bg-amber-500/10 dark:bg-amber-400/10" /></div><Skeleton className="h-3 w-1/2" /></div></div><div className="mt-3 h-px bg-gray-100 dark:bg-white/[0.06]" /><div className="mt-3 grid grid-cols-2 gap-2"><Skeleton className="h-12 rounded-xl" /><Skeleton className="h-12 rounded-xl" /></div><Skeleton className="mt-2 h-14 rounded-xl" /><div className="mt-3 grid grid-cols-2 gap-2"><Skeleton className="h-9 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10" /><Skeleton className="h-9 rounded-full bg-red-500/10 dark:bg-red-400/10" /></div></div></article>)}
        </div>
    );
}
