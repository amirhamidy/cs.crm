import { Skeleton, SkeletonAvatar } from "@/components/ui/Skeleton";

export default function CustomerCardSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div aria-hidden="true" className="grid animate-pulse grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: count }, (_, index) => (
                <div key={index} className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/[0.07] dark:bg-[#111a2d]">
                    <div className="flex items-center gap-3 pt-1">
                        <SkeletonAvatar size={44} className="rounded-2xl" />
                        <div className="min-w-0 flex-1 space-y-2">
                            <Skeleton className="h-3.5 w-2/3" />
                            <Skeleton className="h-3 w-1/4" />
                        </div>
                        <Skeleton className="h-7 w-7 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10" />
                    </div>
                    <div className="flex flex-col gap-2 border-t border-gray-100 pt-2.5 dark:border-white/[0.06]">
                        <div className="flex items-center gap-2"><Skeleton className="h-3.5 w-3.5 rounded" /><Skeleton className="h-3 w-2/5" /></div>
                        <div className="flex items-center gap-2"><Skeleton className="h-3.5 w-3.5 rounded" /><Skeleton className="h-3 w-3/5" /></div>
                        <div className="flex items-center justify-between"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-3 w-1/4" /></div>
                        <Skeleton className="h-5 w-20 rounded-lg bg-blue-500/10 dark:bg-blue-400/10" />
                    </div>
                </div>
            ))}
        </div>
    );
}
