"use client";

import {
    ArrowLeft,
    Boxes,
    ClipboardList,
    PackageSearch,
    ReceiptText,
} from "lucide-react";
import { ApiStockInfo, ApiWarehouseTask } from "@/types/warehouse";
import {
    formatDate,
    formatNumber,
    getStockProductName,
    getTaskProductName,
} from "@/utils/warehouseEmployee";

interface Props {
    tasks: ApiWarehouseTask[];
    stockInfos: ApiStockInfo[];
    onSelectTask: (task: ApiWarehouseTask) => void;
    onNavigate: (
        tab:
            | "tasks"
            | "stock"
            | "transactions"
            | "orders"
            | "deadlines"
    ) => void;
}

export default function WarehouseEmployeeOverview({
    tasks,
    stockInfos,
    onSelectTask,
    onNavigate,
}: Props) {
    const recentTasks = tasks.slice(0, 5);
    const recentStock = stockInfos.slice(0, 4);

    return (
        <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-white/[0.07] bg-[#101114] p-4">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                            <ClipboardList className="h-4 w-4 text-orange-300" />
                            آخرین وظایف
                        </h2>
                        <p className="mt-1 text-[11px] text-white/30">
                            آخرین فعالیت‌های مرتبط با شما
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => onNavigate("tasks")}
                        className="flex items-center gap-1 text-xs text-white/35 transition hover:text-white"
                    >
                        همه
                        <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                </div>

                <div className="space-y-2">
                    {recentTasks.length ? (
                        recentTasks.map((task) => {
                            const data =
                                task as unknown as Record<string, unknown>;

                            return (
                                <button
                                    key={String(data.id)}
                                    type="button"
                                    onClick={() =>
                                        onSelectTask(task)
                                    }
                                    className="flex w-full items-center gap-3 rounded-xl bg-white/[0.025] p-3 text-right transition hover:bg-white/[0.05]"
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-400/10 text-orange-300">
                                        <ClipboardList className="h-4 w-4" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-semibold text-white/75">
                                            {getTaskProductName(task)}
                                        </p>
                                        <p className="mt-1 text-[10px] text-white/25">
                                            وظیفه #
                                            {String(
                                                data.id ?? "—"
                                            )}
                                        </p>
                                    </div>

                                    <span className="text-[10px] text-white/25">
                                        {formatDate(
                                            data.updated_at ??
                                                data.created_at
                                        )}
                                    </span>
                                </button>
                            );
                        })
                    ) : (
                        <div className="py-10 text-center text-xs text-white/25">
                            وظیفه‌ای وجود ندارد
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-[#101114] p-4">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                            <Boxes className="h-4 w-4 text-blue-300" />
                            وضعیت موجودی
                        </h2>
                        <p className="mt-1 text-[11px] text-white/30">
                            خلاصه موجودی فعلی
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => onNavigate("stock")}
                        className="flex items-center gap-1 text-xs text-white/35 transition hover:text-white"
                    >
                        همه
                        <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                </div>

                <div className="space-y-2">
                    {recentStock.length ? (
                        recentStock.map((stock) => {
                            const data =
                                stock as unknown as Record<string, unknown>;

                            return (
                                <div
                                    key={String(data.id)}
                                    className="rounded-xl bg-white/[0.025] p-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-400/10 text-blue-300">
                                            <PackageSearch className="h-4 w-4" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-semibold text-white/70">
                                                {getStockProductName(
                                                    stock
                                                )}
                                            </p>
                                            <p className="mt-1 text-[10px] text-white/25">
                                                موجودی
                                            </p>
                                        </div>

                                        <p className="text-sm font-bold text-white">
                                            {formatNumber(
                                                data.current_quantity ??
                                                    data.quantity ??
                                                    data.stock ??
                                                    0
                                            )}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-10 text-center text-xs text-white/25">
                            موجودی‌ای وجود ندارد
                        </div>
                    )}
                </div>
            </div>

            <button
                type="button"
                onClick={() => onNavigate("transactions")}
                className="group flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-[#101114] p-4 text-right transition hover:border-white/[0.12] hover:bg-[#131417]"
            >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                    <ReceiptText className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-bold text-white">
                        تراکنش‌های انبار
                    </p>
                    <p className="mt-1 text-xs text-white/30">
                        ورود و خروج کالا را مشاهده کنید
                    </p>
                </div>
                <ArrowLeft className="h-4 w-4 text-white/20 transition group-hover:-translate-x-1 group-hover:text-white/60" />
            </button>

            <button
                type="button"
                onClick={() => onNavigate("orders")}
                className="group flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-[#101114] p-4 text-right transition hover:border-white/[0.12] hover:bg-[#131417]"
            >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                    <PackageSearch className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-bold text-white">
                        سفارش‌های انبار
                    </p>
                    <p className="mt-1 text-xs text-white/30">
                        سفارش‌های در گردش انبار
                    </p>
                </div>
                <ArrowLeft className="h-4 w-4 text-white/20 transition group-hover:-translate-x-1 group-hover:text-white/60" />
            </button>

            <button
                type="button"
                onClick={() => onNavigate("deadlines")}
                className="group flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-[#101114] p-4 text-right transition hover:border-white/[0.12] hover:bg-[#131417]"
            >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                    <PackageSearch className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-bold text-white">
                        مهلت‌های عملیاتی
                    </p>
                    <p className="mt-1 text-xs text-white/30">
                        زمان‌بندی سفارش‌ها
                    </p>
                </div>
                <ArrowLeft className="h-4 w-4 text-white/20 transition group-hover:-translate-x-1 group-hover:text-white/60" />
            </button>
        </div>
    );
}