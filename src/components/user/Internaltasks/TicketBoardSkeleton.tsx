import { Skeleton, SkeletonAvatar } from "@/components/ui/Skeleton";

export default function TicketBoardSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div aria-hidden="true" className="animate-pulse space-y-3">
            {Array.from({ length: count }, (_, index) => (
                <div key={index} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/[0.07] dark:bg-[#111a2d]">
                    <SkeletonAvatar size={36} className="rounded-xl" />
                    <div className="min-w-0 flex-1 space-y-2"><div className="flex items-center justify-between gap-3"><Skeleton className="h-3.5 w-2/5" /><Skeleton className="h-5 w-20 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10" /></div><Skeleton className="h-3 w-4/5" /><div className="flex gap-2 pt-1"><Skeleton className="h-5 w-16 rounded-full bg-sky-500/10 dark:bg-sky-400/10" /><Skeleton className="h-5 w-20 rounded-full" /></div></div>
                </div>
            ))}
        </div>
    );
}
