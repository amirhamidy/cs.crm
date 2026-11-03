import { Skeleton, SkeletonAvatar } from "@/components/ui/Skeleton";

export default function DepartmentScoreSkeleton() {
    return (
        <div aria-hidden="true" className="animate-pulse rounded-3xl border border-gray-100 bg-white p-4 dark:border-white/[0.07] dark:bg-[#111a2d] sm:p-5">
            <div className="flex items-center gap-3"><Skeleton className="h-11 w-11 rounded-2xl bg-indigo-500/10 dark:bg-indigo-400/10" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56" /></div><Skeleton className="h-9 w-24 rounded-xl" /></div>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <div key={i} className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3 dark:border-white/[0.06]"><SkeletonAvatar size={40} className="rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-2/3" /><Skeleton className="h-3 w-1/3" /></div><Skeleton className="h-7 w-14 rounded-xl bg-amber-500/10 dark:bg-amber-400/10" /></div>)}</div>
        </div>
    );
}
