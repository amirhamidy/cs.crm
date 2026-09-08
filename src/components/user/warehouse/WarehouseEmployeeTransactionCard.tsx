"use client";

import {
    ArrowDownLeft,
    ArrowUpRight,
    ReceiptText,
} from "lucide-react";
import { ApiStockTransaction } from "@/types/warehouse";
import {
    formatDate,
    formatNumber,
    getTransactionProductName,
    getTransactionQuantity,
    getTransactionTypeLabel,
} from "@/utils/warehouseEmployee";

interface Props {
    transaction: ApiStockTransaction;
}

export default function WarehouseEmployeeTransactionCard({
    transaction,
}: Props) {
    const data =
        transaction as unknown as Record<string, unknown>;

    const type = String(
        data.type ??
        data.transaction_type ??
        data.operation_type ??
        ""
    ).toLowerCase();

    const incoming = [
        "in",
        "inbound",
        "receive",
        "received",
    ].includes(type);

    const quantity = Number(
        getTransactionQuantity(transaction)
    );

    return (
        <div className="rounded-2xl border border-white/[0.07] bg-[#101114] p-4">
            <div className="flex items-start gap-3">
                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${incoming
                            ? "bg-emerald-400/10 text-emerald-300"
                            : "bg-red-400/10 text-red-300"
                        }`}
                >
                    {incoming ? (
                        <ArrowDownLeft className="h-5 w-5" />
                    ) : (
                        <ArrowUpRight className="h-5 w-5" />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-sm font-bold text-white">
                                {getTransactionProductName(
                                    transaction
                                )}
                            </p>

                            <p className="mt-1 text-xs text-white/35">
                                {getTransactionTypeLabel(type)}
                            </p>
                        </div>

                        <div
                            className={`text-left text-base font-bold ${incoming
                                    ? "text-emerald-300"
                                    : "text-red-300"
                                }`}
                        >
                            {incoming ? "+" : "-"}
                            {formatNumber(quantity)}
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-white/[0.025] p-2.5">
                            <p className="text-[10px] text-white/25">
                                تاریخ
                            </p>
                            <p className="mt-1 text-[11px] text-white/55">
                                {formatDate(
                                    data.created_at ??
                                    data.performed_at ??
                                    data.date
                                )}
                            </p>
                        </div>

                        <div className="rounded-xl bg-white/[0.025] p-2.5">
                            <p className="text-[10px] text-white/25">
                                انجام‌دهنده
                            </p>
                            <p className="mt-1 truncate text-[11px] text-white/55">
                                {String(
                                    data.performed_by_name ??
                                    data.performed_by ??
                                    data.employee_name ??
                                    "—"
                                )}
                            </p>
                        </div>
                    </div>

                    {data.reason || data.note ? (
                        <div className="mt-2 flex items-start gap-2 rounded-xl bg-white/[0.025] p-2.5">
                            <ReceiptText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/20" />
                            <p className="text-[11px] leading-5 text-white/45">
                                {String(
                                    data.reason ??
                                    data.note ??
                                    ""
                                )}
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}