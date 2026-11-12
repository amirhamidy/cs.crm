import { Skeleton } from "@/components/ui/Skeleton";

export default function UserTasksKanbanSkeleton({ columns = 3 }: { columns?: number }) {
    return (
        <div aria-hidden="true" className="animate-pulse flex gap-3 overflow-hidden">
            {Array.from({ length: columns }, (_, i) => <section key={i} className="w-72 shrink-0 space-y-3 rounded-2xl bg-gray-100/70 p-3 dark:bg-white/[0.04]"><div className="flex items-center justify-between"><Skeleton className="h-4 w-28" /><Skeleton className="h-5 w-7 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10" /></div>{Array.from({ length: 3 }, (_, j) => <article key={j} className="space-y-2 rounded-2xl border border-gray-100 bg-white p-3 dark:border-white/[0.07] dark:bg-[#111a2d]"><div className="flex items-center justify-between"><Skeleton className="h-3.5 w-3/5" /><Skeleton className="h-5 w-12 rounded-full bg-amber-500/10 dark:bg-amber-400/10" /></div><Skeleton className="h-3 w-4/5" /><div className="flex gap-2"><Skeleton className="h-5 w-16 rounded-full bg-sky-500/10 dark:bg-sky-400/10" /><Skeleton className="h-5 w-12 rounded-full" /></div></article>)}</section>)}
        </div>
    );
}
