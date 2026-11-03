import { Skeleton, SkeletonAvatar } from "@/components/ui/Skeleton";

export default function WarehouseSelectorSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div aria-hidden="true" className="grid animate-pulse grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: count }, (_, i) => <article key={i} className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/[0.07] dark:bg-[#111a2d]"><div className="flex items-center gap-3"><SkeletonAvatar size={42} className="rounded-2xl" /><div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-2/3" /><Skeleton className="h-3 w-1/3" /></div></div><div className="mt-4 grid grid-cols-2 gap-2"><Skeleton className="h-9 rounded-xl" /><Skeleton className="h-9 rounded-xl" /></div><Skeleton className="mt-3 h-9 w-full rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10" /></article>)}
        </div>
    );
}
