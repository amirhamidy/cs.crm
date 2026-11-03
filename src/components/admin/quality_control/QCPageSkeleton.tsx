import { Skeleton } from "@/components/ui/Skeleton";
import QCItemCardSkeleton from "./QCItemCardSkeleton";

export default function QCPageSkeleton() {
    return (
        <div aria-hidden="true" className="animate-pulse space-y-5">
            <div className="space-y-3"><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-xl" /><Skeleton className="h-4 w-32" /></div><QCItemCardSkeleton count={6} /></div>
        </div>
    );
}
