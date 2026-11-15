"use client";

import { TaskCardSkeleton } from "@/components/ui/skeletons";

export default function TicketBoardSkeleton({ count = 5 }: { count?: number }) {
    return <TaskCardSkeleton count={count} />;
}
