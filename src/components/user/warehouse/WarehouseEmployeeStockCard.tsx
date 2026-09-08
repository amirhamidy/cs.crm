"use client";

import {
    Boxes,
    Package,
} from "lucide-react";
import {
    ApiStockInfo,
} from "@/types/warehouse";
import {
    formatNumber,
    getProductName,
    getQuantityFromStock,
    getStockProductName,
    getStockStatus,
} from "@/utils/warehouseEmployee";

interface Props {
    stock: ApiStockInfo;
}

export default function WarehouseEmployeeStockCard({
    stock,
}: Props) {
    const data = stock as unknown as Record<string, unknown>;
    const status = getStockStatus(stock);

    const current = Number(getQuantityFromStock(stock));

    const maximum = Number(
        data.maximum_quantity ??
        data.max_quantity ??
        data.max_stock ??
        0
    );

    const percentage =
        maximum > 0
            ? Math.min(Math.max((current / maximum) * 100, 0), 100)
            : 0;

    return (
        <div className="rounded-2xl border border-white/[0.07] bg-[#101114] p-4">
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
                    <Boxes className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-white">
                                {getStockProductName(stock)}
                            </p>
                            {data.code != null && (
                                <p className="mt-1 text-[10px] text-white/25">
                                    {String(data.code)}
                                </p>
                            )}
                        </div>

                        <span
                            className={`shrink-0 rounded-full border px-2 py-1 text-[10px] ${status.tone === "danger"
                                ? "border-red-400/15 bg-red-400/10 text-red-300"
                                : status.tone === "warning"
                                    ? "border-amber-400/15 bg-amber-400/10 text-amber-300"
                                    : "border-emerald-400/15 bg-emerald-400/10 text-emerald-300"
                                }`}
                        >
                            {status.label}
                        </span>
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                        <div>
                            <p className="text-[10px] text-white/30">
                                موجودی فعلی
                            </p>
                            <p className="mt-1 text-xl font-bold text-white">
                                {formatNumber(current)}
                            </p>
                        </div>

                        <div className="text-left">
                            <p className="text-[10px] text-white/30">
                                ظرفیت
                            </p>
                            <p className="mt-1 text-xs text-white/55">
                                {maximum > 0
                                    ? formatNumber(maximum)
                                    : "نامشخص"}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                            className="h-full rounded-full bg-white/50 transition-all"
                            style={{
                                width: `${percentage}%`,
                            }}
                        />
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs text-white/30">
                        <Package className="h-3.5 w-3.5" />
                        <span>
                            واحد:{" "}
                            {String(
                                data.unit ??
                                data.unit_name ??
                                "عدد"
                            )}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}