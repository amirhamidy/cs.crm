"use client";

import {
    ArrowLeft,
    PackageSearch,
} from "lucide-react";
import { ApiOrderTask } from "@/types/warehouse";
import {
    formatDate,
    getOrderTaskTitle,
} from "@/utils/warehouseEmployee";

interface Props {
    orderTasks: ApiOrderTask[];
}

export default function WarehouseEmployeeOrderTasks({
    orderTasks,
}: Props) {
    return (
        <section className="space-y-4">
            <div>
                <h2 className="flex items-center gap-2 text-base font-bold text-white">
                    <PackageSearch className="h-5 w-5 text-violet-300" />
                    سفارش‌های انبار
                </h2>
                <p className="mt-1 text-xs text-white/35">
                    اطلاعات سفارش‌هایی که در چرخه انبار قرار دارند
                </p>
            </div>

            {orderTasks.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    {orderTasks.map((task) => {
                        const data =
                            task as unknown as Record<string, unknown>;

                        return (
                            <div
                                key={String(data.id)}
                                className="rounded-2xl border border-white/[0.07] bg-[#101114] p-4"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                                        <PackageSearch className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-white">
                                                    {getOrderTaskTitle(
                                                        task
                                                    )}
                                                </p>

                                                <p className="mt-1 text-xs text-white/30">
                                                    سفارش #
                                                    {String(
                                                        data.id ?? "—"
                                                    )}
                                                </p>
                                            </div>

                                            <ArrowLeft className="h-4 w-4 shrink-0 text-white/20" />
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                            <div className="rounded-xl bg-white/[0.025] p-2.5">
                                                <p className="text-[10px] text-white/25">
                                                    وضعیت
                                                </p>
                                                <p className="mt-1 text-xs text-white/60">
                                                    {String(
                                                        data.status ??
                                                        "—"
                                                    )}
                                                </p>
                                            </div>

                                            <div className="rounded-xl bg-white/[0.025] p-2.5">
                                                <p className="text-[10px] text-white/25">
                                                    تاریخ
                                                </p>
                                                <p className="mt-1 text-[10px] text-white/50">
                                                    {formatDate(
                                                        data.updated_at ??
                                                        data.created_at
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        {(typeof data.description === "string" ||
                                            typeof data.description === "number" ||
                                            typeof data.note === "string" ||
                                            typeof data.note === "number") && (
                                                <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/40">
                                                    {String(data.description ?? data.note ?? "")}
                                                </p>
                                            )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#101114] px-6 py-14 text-center">
                    <PackageSearch className="mx-auto h-9 w-9 text-white/15" />
                    <p className="mt-3 text-sm text-white/45">
                        سفارشی برای نمایش وجود ندارد
                    </p>
                </div>
            )}
        </section>
    );
}