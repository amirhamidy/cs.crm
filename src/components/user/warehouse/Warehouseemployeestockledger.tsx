"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
    Boxes,
    CalendarDays,
    Check,
    ChevronLeft,
    ChevronRight,
    FileText,
    History,
    Search,
    User,
} from "lucide-react";

import {
    formatDate,
    formatNumber,
    paginate,
    PAGE_SIZE,
} from "@/utils/warehouseEmployee";

interface Product {
    id: number;
    name?: string;
}

interface StockInfo {
    id: number;
    product: number;
    initial_quantity?: number | string | null;
    current_quantity?: number | string | null;
    created_at?: string | null;
    performed_by?: { full_name?: string | null } | null;
    performed_by_name?: string | null;
}

interface Transaction {
    id: number;
    product: number;
    transaction_date?: string | null;
    transaction_type: "initial" | "stock_in" | "stock_out" | string;
    quantity_changed?: number | string | null;
    quantity_before?: number | string | null;
    quantity_after?: number | string | null;
    stock_out_reason_display?: string | null;
    note?: string | null;
    performed_by_name?: string | null;
    customer_name?: string | null;
    customer?: string | { full_name?: string | null; name?: string | null } | null;
    buyer_name?: string | null;
    recipient_name?: string | null;
}

type EventKind = "initial" | "in" | "out";

interface LedgerEvent {
    id: string;
    date: string | null;
    kind: EventKind;
    quantityChanged: number | null;
    quantityBefore: number | null;
    quantityAfter: number;
    performedByName: string | null;
    reasonLabel?: string | null;
    note?: string | null;
    customerName?: string | null;
}

interface WarehouseEmployeeStockLedgerProps {
    products: Product[];
    stockInfos: StockInfo[];
    transactions: Transaction[];
    defaultProductId?: number | null;
}

const AVATAR_GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#ec4899", "#8b5cf6"],
    ["#06b6d4", "#3b82f6"],
    ["#10b981", "#14b8a6"],
    ["#f59e0b", "#ef4444"],
];

function getCustomerName(t: Transaction): string | null {
    const directFields = ["customer_name", "buyer_name", "recipient_name"] as const;

    for (const field of directFields) {
        const value = (t as any)[field];
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }

    const customer = t.customer;

    if (customer) {
        if (typeof customer === "string" && customer.trim()) {
            return customer.trim();
        }

        if (
            typeof customer === "object" &&
            typeof customer.full_name === "string" &&
            customer.full_name.trim()
        ) {
            return customer.full_name.trim();
        }

        if (
            typeof customer === "object" &&
            typeof customer.name === "string" &&
            customer.name.trim()
        ) {
            return customer.name.trim();
        }
    }

    const keywords = [
        "customer",
        "buyer",
        "client",
        "recipient",
        "consumer",
        "مشتری",
        "خریدار",
        "گیرنده",
    ];

    for (const key of Object.keys(t)) {
        const lower = key.toLowerCase();

        if (keywords.some((k) => lower.includes(k))) {
            const value = (t as any)[key];

            if (typeof value === "string" && value.trim()) {
                return value.trim();
            }

            if (
                value &&
                typeof value === "object" &&
                typeof value.full_name === "string" &&
                value.full_name.trim()
            ) {
                return value.full_name.trim();
            }

            if (
                value &&
                typeof value === "object" &&
                typeof value.name === "string" &&
                value.name.trim()
            ) {
                return value.name.trim();
            }
        }
    }

    return null;
}

function buildDescription(event: LedgerEvent): string {
    if (event.kind === "initial") {
        return "موجودی اول دوره";
    }

    const reason = event.reasonLabel?.trim();
    const customer = event.customerName?.trim();

    if (event.kind === "out") {
        if (reason && customer) return `${reason} - ${customer}`;
        if (reason) return reason;
        if (customer) return customer;
        return "خروج";
    }

    if (reason) return reason;
    return "ورود";
}

export default function WarehouseEmployeeStockLedger({
    products,
    stockInfos,
    transactions,
    defaultProductId = null,
}: WarehouseEmployeeStockLedgerProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [query, setQuery] = useState("");
    const [selectedProductId, setSelectedProductId] = useState<number | null>(
        defaultProductId
    );
    const [kindFilter, setKindFilter] = useState<"all" | EventKind>("all");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (defaultProductId != null) {
            setSelectedProductId(defaultProductId);
        }
    }, [defaultProductId]);

    useEffect(() => {
        if (selectedProductId == null && products.length > 0) {
            setSelectedProductId(products[0].id);
        }
    }, [products, selectedProductId]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedProductId, kindFilter]);

    const stockByProduct = useMemo(
        () => new Map<number, StockInfo>(stockInfos.map((s) => [s.product, s])),
        [stockInfos]
    );

    const filteredProducts = useMemo(() => {
        const q = query.trim();
        if (!q) return products;
        return products.filter((p) => p.name?.includes(q));
    }, [products, query]);

    const selectedProduct = useMemo(
        () => products.find((p) => p.id === selectedProductId) ?? null,
        [products, selectedProductId]
    );

    const selectedStock =
        selectedProductId != null
            ? stockByProduct.get(selectedProductId) ?? null
            : null;

    const allEvents = useMemo<LedgerEvent[]>(() => {
        if (selectedProductId == null) return [];

        return transactions
            .filter((t) => t.product === selectedProductId)
            .map((t) => {
                const kind: EventKind =
                    t.transaction_type === "initial"
                        ? "initial"
                        : t.transaction_type === "stock_in"
                            ? "in"
                            : "out";

                return {
                    id: `tx-${t.id}`,
                    date: t.transaction_date ?? null,
                    kind,
                    quantityChanged: Number(t.quantity_changed ?? 0),
                    quantityBefore: Number(t.quantity_before ?? 0),
                    quantityAfter: Number(t.quantity_after ?? 0),
                    reasonLabel: t.stock_out_reason_display,
                    note: t.note,
                    performedByName: t.performed_by_name ?? null,
                    customerName: getCustomerName(t),
                };
            })
            .sort((a, b) => {
                const da = a.date ? new Date(a.date).getTime() : 0;
                const db = b.date ? new Date(b.date).getTime() : 0;
                return db - da;
            });
    }, [selectedProductId, transactions]);

    const filteredEvents = useMemo(() => {
        if (kindFilter === "all") return allEvents;
        return allEvents.filter((e) => e.kind === kindFilter);
    }, [allEvents, kindFilter]);

    const paginatedEvents = useMemo(
        () => paginate(filteredEvents, currentPage, PAGE_SIZE),
        [filteredEvents, currentPage]
    );

    return (
        <div
            dir="rtl"
            className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]"
        >
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
                <div className="relative">
                    <Search
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="جستجوی محصول..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-9 pl-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:focus:border-indigo-500"
                    />
                </div>

                <div className="flex max-h-[600px] flex-col gap-1.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                    {filteredProducts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                            <Boxes size={24} className="mb-2 opacity-50" />
                            <span className="text-xs font-medium">
                                محصولی یافت نشد
                            </span>
                        </div>
                    )}

                    {filteredProducts.map((product) => {
                        const active = product.id === selectedProductId;
                        const stock = stockByProduct.get(product.id);
                        const [start, end] =
                            AVATAR_GRADIENTS[product.id % AVATAR_GRADIENTS.length];

                        return (
                            <button
                                key={product.id}
                                type="button"
                                onClick={() => setSelectedProductId(product.id)}
                                className={`group flex items-center gap-3 rounded-xl p-3 text-right transition-all duration-200 ${active
                                        ? "bg-indigo-50 shadow-sm dark:bg-indigo-500/10"
                                        : "hover:bg-slate-50 dark:hover:bg-white/5"
                                    }`}
                            >
                                <div
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white shadow-sm transition-transform group-hover:scale-105"
                                    style={{
                                        background: `linear-gradient(135deg, ${start}, ${end})`,
                                    }}
                                >
                                    {product.name?.trim().charAt(0) || "؟"}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p
                                        className={`truncate text-sm font-bold ${active
                                                ? "text-indigo-600 dark:text-indigo-400"
                                                : "text-slate-900 dark:text-slate-100"
                                            }`}
                                    >
                                        {product.name}
                                    </p>

                                    <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                        موجودی:{" "}
                                        {formatNumber(
                                            Number(stock?.current_quantity ?? 0)
                                        )}
                                    </p>
                                </div>

                                {active && (
                                    <motion.div
                                        layoutId="activeIndicator"
                                        className="h-1.5 w-1.5 rounded-full bg-indigo-500"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col gap-5">
                {!selectedProduct ? (
                    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 dark:border-white/10 dark:bg-white/[0.02]">
                        <History
                            size={32}
                            className="mb-3 text-slate-300 dark:text-slate-600"
                        />
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            یک محصول را برای مشاهده گردش کالا انتخاب کنید
                        </p>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-4 dark:border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
                                    <History
                                        size={18}
                                        className="text-indigo-600 dark:text-indigo-400"
                                    />
                                </div>

                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                        گردش کالا · {selectedProduct.name}
                                    </h3>

                                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                        {allEvents.length} رویداد ثبت شده
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 p-1 dark:bg-white/5">
                                {(
                                    [
                                        ["all", "همه"],
                                        ["in", "ورودی"],
                                        ["out", "خروجی"],
                                    ] as const
                                ).map(([key, label]) => {
                                    const active = kindFilter === key;

                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setKindFilter(key)}
                                            className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all duration-200 ${active
                                                    ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400"
                                                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
                                        <th className="px-5 py-3.5">تاریخ</th>
                                        <th className="px-5 py-3.5">شرح</th>
                                        <th className="px-5 py-3.5 text-center">
                                            ورود
                                        </th>
                                        <th className="px-5 py-3.5 text-center">
                                            خروج
                                        </th>
                                        <th className="px-5 py-3.5 text-center">
                                            مانده
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                                    <AnimatePresence mode="popLayout">
                                        {paginatedEvents.items.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="py-12 text-center text-sm text-slate-400"
                                                >
                                                    رویدادی برای نمایش وجود ندارد
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedEvents.items.map(
                                                (
                                                    event: LedgerEvent,
                                                    index: number
                                                ) => {
                                                    const isIn =
                                                        event.kind === "in";
                                                    const isOut =
                                                        event.kind === "out";

                                                    const description =
                                                        buildDescription(event);

                                                    return (
                                                        <motion.tr
                                                            key={event.id}
                                                            initial={{
                                                                opacity: 0,
                                                                y: 8,
                                                            }}
                                                            animate={{
                                                                opacity: 1,
                                                                y: 0,
                                                            }}
                                                            exit={{
                                                                opacity: 0,
                                                                y: -8,
                                                            }}
                                                            transition={{
                                                                duration: 0.2,
                                                                delay: index * 0.03,
                                                            }}
                                                            className="group transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                                                        >
                                                            <td className="px-5 py-4">
                                                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                                    <CalendarDays
                                                                        size={13}
                                                                        className="text-slate-400"
                                                                    />
                                                                    {formatDate(
                                                                        event.date
                                                                    )}
                                                                </div>
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                <div className="flex items-start gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                                                                    <FileText
                                                                        size={13}
                                                                        className="mt-0.5 shrink-0 text-slate-400"
                                                                    />

                                                                    <div className="min-w-0">
                                                                        <span className="line-clamp-2">
                                                                            {description}
                                                                        </span>

                                                                        {event.performedByName && (
                                                                            <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                                                                                <User
                                                                                    size={
                                                                                        10
                                                                                    }
                                                                                />
                                                                                {
                                                                                    event.performedByName
                                                                                }
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td className="px-5 py-4 text-center">
                                                                {isIn ? (
                                                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-black text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                                                                        <Check
                                                                            size={
                                                                                12
                                                                            }
                                                                        />
                                                                        {formatNumber(
                                                                            event.quantityChanged ??
                                                                            0
                                                                        )}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-slate-300 dark:text-slate-600">
                                                                        -
                                                                    </span>
                                                                )}
                                                            </td>

                                                            <td className="px-5 py-4 text-center">
                                                                {isOut ? (
                                                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-2 py-1 text-xs font-black text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                                                                        <Check
                                                                            size={
                                                                                12
                                                                            }
                                                                        />
                                                                        {formatNumber(
                                                                            event.quantityChanged ??
                                                                            0
                                                                        )}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-slate-300 dark:text-slate-600">
                                                                        -
                                                                    </span>
                                                                )}
                                                            </td>

                                                            <td className="px-5 py-4 text-center">
                                                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                                                    {formatNumber(
                                                                        event.quantityAfter
                                                                    )}
                                                                </span>
                                                            </td>
                                                        </motion.tr>
                                                    );
                                                }
                                            )
                                        )}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>

                        {paginatedEvents.totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 dark:border-white/10">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    صفحه {formatNumber(currentPage)} از{" "}
                                    {formatNumber(paginatedEvents.totalPages)}
                                </span>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={currentPage === 1}
                                        onClick={() =>
                                            setCurrentPage((p) => p - 1)
                                        }
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                                    >
                                        <ChevronRight size={14} />
                                    </button>

                                    <button
                                        type="button"
                                        disabled={
                                            currentPage ===
                                            paginatedEvents.totalPages
                                        }
                                        onClick={() =>
                                            setCurrentPage((p) => p + 1)
                                        }
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}