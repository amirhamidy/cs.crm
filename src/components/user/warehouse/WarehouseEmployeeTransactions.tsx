"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ReceiptText, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { ApiStockTransaction } from "@/types/warehouse";
import { formatDate, formatNumber, matchesSearch } from "@/utils/warehouseEmployee";

interface WarehouseEmployeeTransactionsProps {
    transactions: ApiStockTransaction[];
}

export default function WarehouseEmployeeTransactions({
    transactions,
}: WarehouseEmployeeTransactionsProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [search, setSearch] = useState("");

    const filtered = useMemo(
        () =>
            transactions.filter((tx) =>
                matchesSearch(
                    [
                        tx.id,
                        tx.product_name,
                        tx.performed_by_name,
                        tx.transaction_type,
                        tx.transaction_type_display,
                        tx.note,
                        tx.stock_out_reason,
                    ],
                    search
                )
            ),
        [transactions, search]
    );

    const textColor = isDark ? "#ffffff" : "#1e293b";
    const mutedText = isDark ? "rgba(255,255,255,0.4)" : "#94a3b8";

    return (
        <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="flex items-center gap-2 text-base font-bold" style={{ color: textColor }}>
                        <ReceiptText className="h-5 w-5 text-emerald-400" />
                        تراکنش‌های انبار
                    </h2>
                    <p className="mt-1 text-xs" style={{ color: mutedText }}>
                        آخرین ورود، خروج و اصلاحات موجودی
                    </p>
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: mutedText }} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="جستجو در تراکنش‌ها..."
                        className="h-11 w-full rounded-xl border pr-10 pl-3 text-sm outline-none"
                        style={{
                            borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)",
                            background: isDark ? "rgba(255,255,255,0.03)" : "rgba(15,23,42,0.03)",
                            color: textColor,
                        }}
                    />
                </div>
            </div>

            {filtered.length ? (
                <div className="grid gap-3">
                    {filtered.map((tx, index) => {
                        const incoming = tx.transaction_type === "stock_in";

                        return (
                            <motion.div
                                key={tx.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.04 }}
                                className="rounded-2xl border p-4 transition hover:border-indigo-200/50"
                                style={{
                                    borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)",
                                    background: isDark ? "#0f172a" : "#f8fafc",
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${incoming ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"
                                            }`}
                                    >
                                        {incoming ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-bold" style={{ color: textColor }}>
                                                    {tx.product_name}
                                                </p>
                                                <p className="mt-1 text-xs" style={{ color: mutedText }}>
                                                    {tx.transaction_type_display}
                                                </p>
                                            </div>

                                            <div className={`text-left text-base font-bold ${incoming ? "text-emerald-400" : "text-red-400"}`}>
                                                {incoming ? "+" : "-"}
                                                {formatNumber(tx.quantity_changed)}
                                            </div>
                                        </div>

                                        <div className="mt-4 grid grid-cols-3 gap-2">
                                            <div className="rounded-xl p-2" style={{ background: isDark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.025)" }}>
                                                <p className="text-[9px]" style={{ color: mutedText }}>قبل</p>
                                                <p className="text-[11px] font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.6)" : "#64748b" }}>
                                                    {formatNumber(tx.quantity_before)}
                                                </p>
                                            </div>
                                            <div className="rounded-xl p-2" style={{ background: isDark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.025)" }}>
                                                <p className="text-[9px]" style={{ color: mutedText }}>بعد</p>
                                                <p className="text-[11px] font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.6)" : "#64748b" }}>
                                                    {formatNumber(tx.quantity_after)}
                                                </p>
                                            </div>
                                            <div className="rounded-xl p-2" style={{ background: isDark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.025)" }}>
                                                <p className="text-[9px]" style={{ color: mutedText }}>حد مجاز</p>
                                                <p className="text-[11px] font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.6)" : "#64748b" }}>
                                                    {formatNumber(tx.minimum_stock)} / {formatNumber(tx.maximum_stock)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]" style={{ color: mutedText }}>
                                            <span>انجام‌دهنده: {tx.performed_by_name}</span>
                                            <span className="h-1 w-1 rounded-full" style={{ background: mutedText }} />
                                            <span>{formatDate(tx.transaction_date)}</span>
                                            {tx.stock_out_reason_display && (
                                                <>
                                                    <span className="h-1 w-1 rounded-full" style={{ background: mutedText }} />
                                                    <span>دلیل: {tx.stock_out_reason_display}</span>
                                                </>
                                            )}
                                            {tx.note && (
                                                <>
                                                    <span className="h-1 w-1 rounded-full" style={{ background: mutedText }} />
                                                    <span className="line-clamp-1">{tx.note}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div
                    className="rounded-2xl border border-dashed px-6 py-14 text-center"
                    style={{
                        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
                        background: isDark ? "#0f172a" : "#f8fafc",
                    }}
                >
                    <ReceiptText className="mx-auto h-9 w-9" style={{ color: mutedText }} />
                    <p className="mt-3 text-sm" style={{ color: isDark ? "rgba(255,255,255,0.45)" : "#94a3b8" }}>
                        تراکنشی پیدا نشد
                    </p>
                </div>
            )}
        </section>
    );
}