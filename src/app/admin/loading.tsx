export default function Loading() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded-lg bg-gray-200 dark:bg-white/10" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-28 rounded-xl bg-gray-200 dark:bg-white/10"
                    />
                ))}
            </div>

            <div className="h-96 rounded-xl bg-gray-200 dark:bg-white/10" />
        </div>
    );
}