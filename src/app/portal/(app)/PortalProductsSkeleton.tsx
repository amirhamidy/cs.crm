import { Skeleton } from "@/components/ui/Skeleton";

export default function PortalProductsSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div aria-hidden="true" className="grid animate-pulse grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: count }, (_, index) => (
                <article key={index} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
                    <div className="flex items-start justify-between gap-3"><div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-2/3" /><Skeleton className="h-3 w-1/3" /></div><Skeleton className="h-6 w-20 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10" /></div>
                    <Skeleton className="mt-5 h-5 w-1/2 bg-indigo-500/10 dark:bg-indigo-400/10" />
                    <Skeleton className="mt-4 h-10 w-full rounded-2xl bg-indigo-500/10 dark:bg-indigo-400/10" />
                </article>
            ))}
        </div>
    );
}
