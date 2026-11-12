import { Skeleton } from "@/components/ui/Skeleton";

export default function CustomerCardSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div
            aria-hidden="true"
            className="grid animate-pulse grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 motion-reduce:animate-none"
        >
            {Array.from({ length: count }, (_, index) => (
                <article
                    key={index}
                    className="relative flex min-h-[190px] flex-col gap-3 overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/[0.07] dark:bg-[#111a2d]"
                >
                    <div className="absolute left-3 top-3">
                        <Skeleton className="h-6 w-12 rounded-full" />
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                        <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                            <Skeleton className="h-3.5 w-3/4" />
                            <Skeleton className="h-2.5 w-1/3" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-gray-100 pt-3 dark:border-white/[0.06]">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-3.5 w-3.5 rounded" />
                            <Skeleton className="h-3 w-2/3" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-3.5 w-3.5 rounded" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <Skeleton className="h-3 w-1/3" />
                            <Skeleton className="h-3 w-1/4" />
                        </div>
                    </div>

                    <div className="mt-auto flex gap-2 border-t border-gray-100 pt-3 dark:border-white/[0.06]">
                        <Skeleton className="h-8 flex-1 rounded-xl" />
                        <Skeleton className="h-8 w-10 rounded-xl" />
                    </div>
                </article>
            ))}
        </div>
    );
}
