import { Skeleton } from "@/components/ui/Skeleton";

export default function ArchivedTaskCardSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div aria-hidden="true" className="grid animate-pulse grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: count }, (_, index) => (
                <article key={index} className="relative overflow-hidden rounded-[1.8rem] border border-gray-100 bg-white p-4 dark:border-white/[0.07] dark:bg-[#111a2d]">
                    <div className="absolute inset-y-0 right-0 w-1 bg-gray-200 dark:bg-white/10" />
                    <div className="mb-3 flex items-start justify-between gap-3 pl-1"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-6 w-16 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10" /></div>
                    <Skeleton className="mt-2 h-6 w-1/2 rounded-xl bg-violet-500/10 dark:bg-violet-400/10" />
                    <div className="mt-4 flex flex-wrap gap-1.5"><Skeleton className="h-7 w-24 rounded-xl" /><Skeleton className="h-7 w-28 rounded-xl bg-sky-500/10 dark:bg-sky-400/10" /></div>
                    <div className="mt-3 space-y-3 rounded-2xl bg-gray-50 px-3 py-3 dark:bg-white/[0.035]"><div className="flex justify-between"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-3 w-1/4" /></div><Skeleton className="h-px w-full" /><div className="flex justify-between"><Skeleton className="h-3 w-2/5" /><Skeleton className="h-3 w-1/4" /></div></div>
                    <div className="mt-3 rounded-2xl bg-indigo-500/[.035] px-3 py-2.5 dark:bg-indigo-500/[.04]"><Skeleton className="h-3 w-3/4" /></div>
                    <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3.5 dark:border-white/[0.06]"><Skeleton className="h-9 flex-1 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10" /><Skeleton className="h-9 flex-1 rounded-xl" /></div>
                </article>
            ))}
        </div>
    );
}
