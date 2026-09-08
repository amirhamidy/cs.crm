"use client";

import { ArrowDownLeft, ArrowUpRight, ReceiptText } from "lucide-react";
import { useTheme } from "next-themes";
import { ApiStockTransaction } from "@/types/warehouse";
import { formatDate, formatNumber, getTransactionProductName, getTransactionQuantity, getTransactionTypeLabel } from "@/utils/warehouseEmployee";

interface Props {
    transaction: ApiStockTransaction;
}

export default function WarehouseEmployeeTransactionCard({ transaction }: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const data = transaction as unknown as Record<string, unknown>;

    const type = String(data.type ?? data.transaction_type ?? data.operation_type ?? "").toLowerCase();
    const incoming = ["in", "inbound", "receive", "received"].includes(type);
    const quantity = Number(getTransactionQuantity(transaction));

    const textColor = isDark ? "#ffffff" : "#1e293b";
    const mutedText = isDark ? "rgba(255,255,255,0.4)" : "#94a3b8";

    return (
        <div
            className="rounded-2xl border p-4"
            style={{
                borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)",
                background: isDark ? "#101114" : "#f8fafc",
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
                                {getTransactionProductName(transaction)}
                            </p>
                            <p className="mt-1 text-xs" style={{ color: mutedText }}>
                                {getTransactionTypeLabel(type)}
                            </p>
                        </div>

                        <div className={`text-left text-base font-bold ${incoming ? "text-emerald-400" : "text-red-400"}`}>
                            {incoming ? "+" : "-"}
                            {formatNumber(quantity)}
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-xl p-2.5" style={{ background: isDark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.025)" }}>
                            <p className="text-[10px]" style={{ color: mutedText }}>
                                تاریخ
                            </p>
                            <p className="mt-1 text-[11px]" style={{ color: isDark ? "rgba(255,255,255,0.55)" : "#64748b" }}>
                                {formatDate(data.created_at ?? data.performed_at ?? data.date)}
                            </p>
                        </div>

                        <div className="rounded-xl p-2.5" style={{ background: isDark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.025)" }}>
                            <p className="text-[10px]" style={{ color: mutedText }}>
                                انجام‌دهنده
                            </p>
                            <p className="mt-1 truncate text-[11px]" style={{ color: isDark ? "rgba(255,255,255,0.55)" : "#64748b" }}>
                                {String(data.performed_by_name ?? data.performed_by ?? data.employee_name ?? "—")}
                            </p>
                        </div>
                    </div>

                    {data.reason || data.note ? (
                        <div className="mt-2 flex items-start gap-2 rounded-xl p-2.5" style={{ background: isDark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.025)" }}>
                            <ReceiptText className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: mutedText }} />
                            <p className="text-[11px] leading-5" style={{ color: isDark ? "rgba(255,255,255,0.45)" : "#94a3b8" }}>
                                {String(data.reason ?? data.note ?? "")}
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}