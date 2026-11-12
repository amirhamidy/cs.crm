export default function DashboardLoading() {
    return (
        <div className="space-y-5">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div
                        key={index}
                        className="rounded-2xl p-4 border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] animate-pulse"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-3">
                                <div className="h-3 w-24 rounded-full bg-black/10 dark:bg-white/10" />
                                <div className="h-7 w-32 rounded-full bg-black/10 dark:bg-white/10" />
                                <div className="h-5 w-20 rounded-full bg-black/10 dark:bg-white/10" />
                            </div>

                            <div className="w-10 h-10 rounded-xl bg-black/10 dark:bg-white/10" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="h-[360px] rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] animate-pulse" />
                <div className="h-[360px] rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] animate-pulse" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="h-[360px] rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] animate-pulse" />
                <div className="h-[360px] rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] animate-pulse" />
            </div>
        </div>
    );
}