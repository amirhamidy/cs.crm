"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
    ArrowDownLeft,
    ArrowUpRight,
    Boxes,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    FileText,
    Filter,
    History,
    Rocket,
    Search,
    TrendingDown,
    TrendingUp,
    User,
} from "lucide-react";

import { formatDate, formatNumber, paginate, PAGE_SIZE } from "@/utils/warehouseEmployee";

const AVATAR_GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#ec4899", "#8b5cf6"],
    ["#06b6d4", "#3b82f6"],
    ["#10b981", "#14b8a6"],
    ["#f59e0b", "#ef4444"],
];

function getPerformedByName(stock) {
    if (!stock) return null;
    const performedBy = stock.performed_by;
    if (performedBy && typeof performedBy === "object") {
        return performedBy.full_name ?? null;
    }
    return stock.performed_by_name ?? null;
}

function getStockCreatedAt(stock) {
    if (!stock) return null;
    return stock.created_at ?? null;
}

function KindBadge({ kind }) {
    if (kind === "initial") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-bold text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-400">
                <Rocket size={12} />
                موجودی اولیه
            </span>
        );
    }
    if (kind === "in") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400">
                <ArrowDownLeft size={12} />
                ورود
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-500 dark:bg-rose-500/15 dark:text-rose-400">
            <ArrowUpRight size={12} />
            خروج
        </span>
    );
}

export default function WarehouseEmployeeStockLedger({
    products,
    stockInfos,
    transactions,
    defaultProductId = null,
}) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [query, setQuery] = useState("");
    const [selectedProductId, setSelectedProductId] = useState(defaultProductId);
    const [kindFilter, setKindFilter] = useState("all");
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
        () => new Map(stockInfos.map((s) => [s.product, s])),
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

    const selectedStock = selectedProductId != null
        ? stockByProduct.get(selectedProductId) ?? null
        : null;

    const allEvents = useMemo(() => {
        if (selectedProductId == null) return [];

        const events = [];

        if (selectedStock) {
            events.push({
                id: `initial-${selectedStock.id}`,
                date: getStockCreatedAt(selectedStock),
                kind: "initial",
                quantityChanged: null,
                quantityBefore: null,
                quantityAfter: Number(selectedStock.initial_quantity ?? 0),
                performedByName: getPerformedByName(selectedStock),
            });
        }

        transactions
            .filter((t) => t.product === selectedProductId)
            .forEach((t) => {
                events.push({
                    id: `tx-${t.id}`,
                    date: t.transaction_date,
                    kind: t.transaction_type === "stock_in" ? "in" : "out",
                    quantityChanged: Number(t.quantity_changed ?? 0),
                    quantityBefore: Number(t.quantity_before ?? 0),
                    quantityAfter: Number(t.quantity_after ?? 0),
                    reasonLabel: t.stock_out_reason_display,
                    note: t.note,
                    performedByName: t.performed_by_name,
                });
            });

        return events.sort((a, b) => {
            const da = a.date ? new Date(a.date).getTime() : 0;
            const db = b.date ? new Date(b.date).getTime() : 0;
            return db - da;
        });
    }, [selectedProductId, selectedStock, transactions]);

    const filteredEvents = useMemo(() => {
        if (kindFilter === "all") return allEvents;
        return allEvents.filter((e) => e.kind === kindFilter);
    }, [allEvents, kindFilter]);

    const stats = useMemo(() => {
        let totalIn = 0;
        let totalOut = 0;
        allEvents.forEach((e) => {
            if (e.kind === "in") totalIn += e.quantityChanged ?? 0;
            if (e.kind === "out") totalOut += e.quantityChanged ?? 0;
        });
        return { totalIn, totalOut, count: allEvents.length };
    }, [allEvents]);

    const paginatedEvents = useMemo(
        () => paginate(filteredEvents, currentPage, PAGE_SIZE),
        [filteredEvents, currentPage]
    );

    return (
        <div dir="rtl" className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
                <div className="relative">
                    <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
                            <span className="text-xs font-medium">محصولی یافت نشد</span>
                        </div>
                    )}

                    {filteredProducts.map((product) => {
                        const active = product.id === selectedProductId;
                        const stock = stockByProduct.get(product.id);
                        const [start, end] = AVATAR_GRADIENTS[product.id % AVATAR_GRADIENTS.length];

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
                                    style={{ background: `linear-gradient(135deg, ${start}, ${end})` }}
                                >
                                    {product.name?.trim().charAt(0) || "؟"}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className={`truncate text-sm font-bold ${active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-slate-100"}`}>
                                        {product.name}
                                    </p>
                                    <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                        موجودی: {formatNumber(stock?.current_quantity ?? 0)}
                                    </p>
                                </div>
                                {active && (
                                    <motion.div layoutId="activeIndicator" className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col gap-5">
                {!selectedProduct ? (
                    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 dark:border-white/10 dark:bg-white/[0.02]">
                        <History size={32} className="mb-3 text-slate-300 dark:text-slate-600" />
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            یک محصول را برای مشاهده گردش کالا انتخاب کنید
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                    <Boxes size={16} />
                                    <span className="text-xs font-bold">موجودی فعلی</span>
                                </div>
                                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                                    {formatNumber(selectedStock?.current_quantity ?? 0)}
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                    <TrendingUp size={16} />
                                    <span className="text-xs font-bold">مجموع ورود</span>
                                </div>
                                <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                    {formatNumber(stats.totalIn)}
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
                                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                                    <TrendingDown size={16} />
                                    <span className="text-xs font-bold">مجموع خروج</span>
                                </div>
                                <p className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
                                    {formatNumber(stats.totalOut)}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-4 dark:border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
                                        <History size={18} className="text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                            گردش کالا · {selectedProduct.name}
                                        </h3>
                                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                            {stats.count} رویداد ثبت شده
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 p-1 dark:bg-white/5">
                                    {[
                                        ["all", "همه"],
                                        ["in", "ورودی"],
                                        ["out", "خروجی"],
                                    ].map(([key, label]) => {
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
                                            <th className="px-5 py-3.5">نوع رویداد</th>
                                            <th className="px-5 py-3.5">تعداد</th>
                                            <th className="px-5 py-3.5">مانده قبل</th>
                                            <th className="px-5 py-3.5">مانده بعد</th>
                                            <th className="px-5 py-3.5">کاربر</th>
                                            <th className="px-5 py-3.5">توضیحات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                                        <AnimatePresence mode="popLayout">
                                            {paginatedEvents.items.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                                                        رویدادی برای نمایش وجود ندارد
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedEvents.items.map((event, index) => {
                                                    const accentColor =
                                                        event.kind === "initial"
                                                            ? "text-indigo-600 dark:text-indigo-400"
                                                            : event.kind === "in"
                                                                ? "text-emerald-600 dark:text-emerald-400"
                                                                : "text-rose-600 dark:text-rose-400";

                                                    return (
                                                        <motion.tr
                                                            key={event.id}
                                                            initial={{ opacity: 0, y: 8 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -8 }}
                                                            transition={{ duration: 0.2, delay: index * 0.03 }}
                                                            className="group transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                                                        >
                                                            <td className="px-5 py-4">
                                                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                                    <CalendarDays size={13} className="text-slate-400" />
                                                                    {formatDate(event.date)}
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <KindBadge kind={event.kind} />
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className={`text-sm font-black ${accentColor}`}>
                                                                    {event.kind === "initial"
                                                                        ? formatNumber(event.quantityAfter)
                                                                        : `${event.kind === "in" ? "+" : "-"}${formatNumber(event.quantityChanged)}`
                                                                    }
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                                {event.kind === "initial" ? "-" : formatNumber(event.quantityBefore)}
                                                            </td>
                                                            <td className="px-5 py-4 text-xs font-black text-slate-900 dark:text-white">
                                                                {formatNumber(event.quantityAfter)}
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                {event.performedByName ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                                                                            {event.performedByName.charAt(0)}
                                                                        </div>
                                                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                                            {event.performedByName}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-slate-400">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                {event.note || event.reasonLabel ? (
                                                                    <div className="flex items-start gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                                                                        <FileText size={13} className="mt-0.5 shrink-0 text-slate-400" />
                                                                        <span className="line-clamp-2">
                                                                            {event.reasonLabel && <span className="font-bold text-slate-700 dark:text-slate-300">{event.reasonLabel}</span>}
                                                                            {event.reasonLabel && event.note && " - "}
                                                                            {event.note}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-slate-400">-</span>
                                                                )}
                                                            </td>
                                                        </motion.tr>
                                                    );
                                                })
                                            )}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>

                            {paginatedEvents.totalPages > 1 && (
                                <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 dark:border-white/10">
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        صفحه {formatNumber(currentPage)} از {formatNumber(paginatedEvents.totalPages)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage((p) => p - 1)}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={currentPage === paginatedEvents.totalPages}
                                            onClick={() => setCurrentPage((p) => p + 1)}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                                        >
                                            <ChevronLeft size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}