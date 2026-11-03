import { Skeleton } from "@/components/ui/Skeleton";

export default function PortalOrdersSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div aria-hidden="true" className="animate-pulse space-y-3">
            {Array.from({ length: count }, (_, index) => (
                <div key={index} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/[0.07] dark:bg-[#111a2d]">
                    <div className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-36" /></div>
                    <div className="text-left space-y-2"><Skeleton className="h-6 w-24 rounded-full bg-amber-500/10 dark:bg-amber-400/10" /><Skeleton className="h-4 w-28" /></div>
                </div>
            ))}
        </div>
    );
}
