import { Skeleton, SkeletonAvatar } from "@/components/ui/Skeleton";

export default function MachineCardsSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div aria-hidden="true" className="grid animate-pulse grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }, (_, i) => <article key={i} className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/[0.07] dark:bg-[#111a2d]"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><SkeletonAvatar size={44} className="rounded-2xl" /><div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-3.5 w-28" /><Skeleton className="h-3 w-16" /></div></div><Skeleton className="h-9 w-9 rounded-full" /></div><div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-3 dark:border-white/[0.06]"><div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.03]"><Skeleton className="h-3 w-20" /><Skeleton className="mt-2 h-4 w-12" /></div><div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.03]"><Skeleton className="h-3 w-20" /><Skeleton className="mt-2 h-4 w-12 bg-red-500/10 dark:bg-red-400/10" /></div></div><div className="flex items-center justify-between"><Skeleton className="h-5 w-14 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/10" /><Skeleton className="h-6 w-10 rounded-full" /></div></article>)}
        </div>
    );
}
