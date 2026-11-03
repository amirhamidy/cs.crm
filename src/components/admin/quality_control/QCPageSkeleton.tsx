import { Skeleton } from "@/components/ui/Skeleton";
import QCItemCardSkeleton from "./QCItemCardSkeleton";

export default function QCPageSkeleton() {
    return (
        <div aria-hidden="true" className="animate-pulse space-y-5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-3 py-3 dark:bg-white/[0.03]"><Skeleton className="h-8 w-8 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-2/3" /><Skeleton className="h-4 w-1/3" /></div></div>)}</div>
            <div className="space-y-3"><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-xl" /><Skeleton className="h-4 w-32" /></div><QCItemCardSkeleton count={6} /></div>
        </div>
    );
}
