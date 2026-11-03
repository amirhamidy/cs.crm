"use client";

import type { WarehouseTab } from "../../../hooks/useWarehouseTab";
import { Skeleton } from "../../ui/Skeleton";

const border = "border border-gray-100 dark:border-white/5 bg-white dark:bg-gray-900";

function Header({ withButton = true }: { withButton?: boolean }) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-56 rounded-md" />
            </div>
            {withButton && <Skeleton className="h-11 w-36 rounded-full" />}
        </div>
    );
}

function ProductCard() {
    return (
        <div className={`rounded-2xl p-4 space-y-3 ${border}`}>
            <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-2/3 rounded-md" />
                    <Skeleton className="h-3 w-1/3 rounded-md" />
                </div>
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex gap-2 pt-1">
                <Skeleton className="h-9 flex-1 rounded-xl" />
                <Skeleton className="h-9 w-9 rounded-xl" />
            </div>
        </div>
    );
}

function TaskCard() {
    return (
        <div className={`rounded-2xl p-4 space-y-3 ${border}`}>
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-1/2 rounded-md" />
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full rounded-md" />
            <Skeleton className="h-3 w-4/5 rounded-md" />
            <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-3 w-24 rounded-md" />
                <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
        </div>
    );
}

function Row() {
    return (
        <div className={`flex items-center gap-3 rounded-xl p-3 ${border}`}>
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-3.5 flex-1 rounded-md" />
            <Skeleton className="h-3.5 w-16 rounded-md" />
            <Skeleton className="hidden h-3.5 w-20 rounded-md sm:block" />
        </div>
    );
}

function StaffCard() {
    return (
        <div className={`flex items-center gap-3 rounded-2xl p-4 ${border}`}>
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-1/2 rounded-md" />
                <Skeleton className="h-3 w-1/3 rounded-md" />
            </div>
            <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
    );
}

export default function WarehouseTabSkeleton({ tab, count = 6 }: { tab: WarehouseTab; count?: number }) {
    const n = Math.min(count, 12);
    const items = Array.from({ length: n });
    const rows = ["stock", "transactions", "ledger", "deadlines"].includes(tab);
    const grid = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";

    return (
        <div className="space-y-5 animate-pulse" aria-busy="true">
            <Header withButton={tab !== "stock" && tab !== "transactions" && tab !== "ledger"} />
            {tab === "products" && <Skeleton className="h-10 w-full rounded-xl" />}
            {rows ? (
                <div className="space-y-2">{items.map((_, i) => <Row key={i} />)}</div>
            ) : (
                <div className={grid}>
                    {items.map((_, i) =>
                        tab === "products" ? <ProductCard key={i} />
                        : tab === "staff" || tab === "categories" ? <StaffCard key={i} />
                        : <TaskCard key={i} />,
                    )}
                </div>
            )}
        </div>
    );
}
