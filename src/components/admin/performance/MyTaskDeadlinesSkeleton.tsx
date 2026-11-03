import { Skeleton, SkeletonAvatar } from "@/components/ui/Skeleton";

export default function MyTaskDeadlinesSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div aria-hidden="true" className="animate-pulse grid gap-2.5">
            {Array.from({ length: count }, (_, i) => <div key={i} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 dark:border-white/[0.07] dark:bg-[#111a2d]"><SkeletonAvatar size={36} className="rounded-xl" /><div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-3.5 w-3/5" /><Skeleton className="h-3 w-2/5" /></div><Skeleton className="h-6 w-20 rounded-xl bg-red-500/10 dark:bg-red-400/10" /></div>)}
        </div>
    );
}
