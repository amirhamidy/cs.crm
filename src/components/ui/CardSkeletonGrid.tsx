"use client";


export default function CardSkeletonGrid({
    count = 6,
    className = "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3",
}: {
    count?: number;
    className?: string;
}) {
    return (
        <div className={className} aria-busy="true" aria-live="polite">
            {Array.from({ length: count }, (_, i) => (
                <div
                    key={i}
                    className="animate-pulse rounded-[1.8rem] border border-gray-100 bg-white p-4 dark:border-white/[0.07] dark:bg-[#111a2d]"
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="h-4 w-1/2 rounded-lg bg-gray-200/80 dark:bg-white/10" />
                        <div className="h-5 w-16 rounded-full bg-gray-200/80 dark:bg-white/10" />
                    </div>
                    <div className="mt-4 space-y-2">
                        <div className="h-3 w-full rounded bg-gray-100 dark:bg-white/[0.06]" />
                        <div className="h-3 w-4/5 rounded bg-gray-100 dark:bg-white/[0.06]" />
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                        <div className="h-6 w-6 rounded-full bg-gray-200/80 dark:bg-white/10" />
                        <div className="h-3 w-20 rounded bg-gray-100 dark:bg-white/[0.06]" />
                    </div>
                </div>
            ))}
        </div>
    );
}
