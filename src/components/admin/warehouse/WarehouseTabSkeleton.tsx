"use client";

import type { ComponentType } from "react";

import type { WarehouseTab } from "../../../hooks/useWarehouseTab";
import { Skeleton } from "../../ui/Skeleton";

const card = "rounded-3xl border border-gray-100 bg-white p-4 dark:border-white/[0.07] dark:bg-[#111a2d]";
const panel = "rounded-2xl bg-gray-50 dark:bg-white/[0.025]";

/** هدر کارت: آیکن + عنوان + زیرعنوان */
function Head({ size = 48, badge = true }: { size?: number; badge?: boolean }) {
    return (
        <div className="flex items-start gap-3">
            <Skeleton className="shrink-0 rounded-2xl" style={{ width: size, height: size }} />
            <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3.5 w-2/3 rounded-md" />
                <Skeleton className="h-3 w-1/3 rounded-md" />
            </div>
            {badge && <Skeleton className="h-6 w-16 shrink-0 rounded-xl" />}
        </div>
    );
}

function Stats({ n = 3 }: { n?: number }) {
    return (
        <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
            {Array.from({ length: n }, (_, i) => (
                <div key={i} className={`flex flex-col items-center gap-1.5 py-2 ${panel}`}>
                    <Skeleton className="h-2.5 w-10 rounded-md" />
                    <Skeleton className="h-3.5 w-8 rounded-md" />
                </div>
            ))}
        </div>
    );
}

function Actions({ n = 2 }: { n?: number }) {
    return (
        <div className="mt-3 flex gap-2">
            {Array.from({ length: n }, (_, i) => (
                <Skeleton key={i} className="h-9 flex-1 rounded-xl" />
            ))}
        </div>
    );
}

function ProductCard() {
    return (
        <div className={`${card} min-h-[260px]`}>
            <div className="flex gap-1.5">
                <Skeleton className="h-7 w-14 rounded-xl" />
                <Skeleton className="h-7 w-7 rounded-xl" />
                <Skeleton className="h-7 w-7 rounded-xl" />
            </div>
            <div className="mt-4"><Head badge={false} /></div>
            <Skeleton className="mt-3 h-3 w-1/2 rounded-md" />
            <Stats n={3} />
            <Actions />
        </div>
    );
}

function TransactionCard() {
    return (
        <div className={`${card} min-h-[148px]`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-1 items-center gap-3">
                    <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-2/3 rounded-md" />
                        <Skeleton className="h-5 w-24 rounded-xl" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Skeleton className="h-4 w-10 rounded-md" />
                    <Skeleton className="h-2.5 w-8 rounded-md" />
                </div>
            </div>
            <div className={`mt-4 flex items-center justify-around px-3 py-3 ${panel}`}>
                {[0, 1, 2].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                        <Skeleton className="h-2.5 w-12 rounded-md" />
                        <Skeleton className="h-3.5 w-8 rounded-md" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function InvoiceCard() {
    return (
        <div className={card}>
            <Head />
            <div className="mt-3 flex gap-3">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
            </div>
            <Skeleton className="mt-3 h-8 w-full rounded-2xl" />
            <Stats n={3} />
        </div>
    );
}

function TaskCard() {
    return (
        <div className={card}>
            <Head size={48} />
            <div className="mt-4 grid grid-cols-3 gap-1.5">
                <Skeleton className="h-11 rounded-2xl" />
                <Skeleton className="h-11 rounded-2xl" />
                <Skeleton className="h-11 rounded-2xl" />
            </div>
            <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
            <div className="mt-3 grid grid-cols-2 gap-2">
                <Skeleton className="h-10 rounded-2xl" />
                <Skeleton className="h-10 rounded-2xl" />
            </div>
        </div>
    );
}

function StockCard() {
    return (
        <div className={card}>
            <Head size={44} badge={false} />
            <Stats n={2} />
        </div>
    );
}

function PersonCard() {
    return (
        <div className={card}>
            <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-1/2 rounded-md" />
                    <Skeleton className="h-3 w-1/3 rounded-md" />
                </div>
                <Skeleton className="h-8 w-8 shrink-0 rounded-xl" />
            </div>
            <Actions />
        </div>
    );
}

function CategoryCard() {
    return (
        <div className={card}>
            <Head size={44} badge={false} />
            <Skeleton className="mt-3 h-3 w-4/5 rounded-md" />
            <Stats n={2} />
        </div>
    );
}

function ArchiveCard() {
    return (
        <div className={card}>
            <Head size={40} />
            <Skeleton className="mt-3 h-3 w-3/4 rounded-md" />
        </div>
    );
}

const CARDS: Record<string, ComponentType> = {
    products: ProductCard,
    tasks: TaskCard,
    orders: TaskCard,
    deadlines: TaskCard,
    stock: StockCard,
    ledger: StockCard,
    transactions: TransactionCard,
    invoices: InvoiceCard,
    categories: CategoryCard,
    staff: PersonCard,
    "task-archive": ArchiveCard,
};

const WIDE = ["stock", "categories", "staff"];

export default function WarehouseTabSkeleton({ tab, count = 6 }: { tab: WarehouseTab; count?: number }) {
    const n = Math.min(count, 12);
    const Card = CARDS[tab] ?? TaskCard;
    const grid = WIDE.includes(tab)
        ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";

    return (
        <div className="animate-pulse space-y-4" aria-busy="true" aria-hidden="true">
            <div className={grid}>
                {Array.from({ length: n }, (_, i) => (
                    <div key={i} className={i >= 4 ? "hidden sm:block" : undefined}>
                        <Card />
                    </div>
                ))}
            </div>
        </div>
    );
}
