"use client";

import {
    AlertCircle,
    BellRing,
    CalendarClock,
} from "lucide-react";
import { ApiOrderTaskDeadline } from "@/types/warehouse";
import {
    formatDate,
    getDeadlineDate,
} from "@/utils/warehouseEmployee";

interface Props {
    deadlines: ApiOrderTaskDeadline[];
}

export default function WarehouseEmployeeDeadlines({
    deadlines,
}: Props) {
    return (
        <section className="space-y-4">
            <div>
                <h2 className="flex items-center gap-2 text-base font-bold text-white">
                    <BellRing className="h-5 w-5 text-amber-300" />
                    مهلت‌های سفارش
                </h2>
                <p className="mt-1 text-xs text-white/35">
                    زمان‌بندی و مهلت‌های ثبت‌شده برای عملیات انبار
                </p>
            </div>

            {deadlines.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    {deadlines.map((deadline) => {
                        const data =
                            deadline as unknown as Record<string, unknown>;

                        const deadlineDate =
                            getDeadlineDate(deadline);

                        const status = String(
                            data.status ?? ""
                        ).toLowerCase();

                        const danger = [
                            "overdue",
                            "expired",
                            "late",
                        ].includes(status);

                        return (
                            <div
                                key={String(data.id)}
                                className={`rounded-2xl border p-4 ${
                                    danger
                                        ? "border-red-400/15 bg-red-400/[0.035]"
                                        : "border-white/[0.07] bg-[#101114]"
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                            danger
                                                ? "bg-red-400/10 text-red-300"
                                                : "bg-amber-400/10 text-amber-300"
                                        }`}
                                    >
                                        {danger ? (
                                            <AlertCircle className="h-5 w-5" />
                                        ) : (
                                            <CalendarClock className="h-5 w-5" />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-bold text-white">
                                                    مهلت سفارش #
                                                    {String(
                                                        data.order_task_id ??
                                                            data.order_id ??
                                                            data.id ??
                                                            "—"
                                                    )}
                                                </p>

                                                <p className="mt-1 text-xs text-white/30">
                                                    {String(
                                                        data.title ??
                                                            data.name ??
                                                            "مهلت عملیاتی"
                                                    )}
                                                </p>
                                            </div>

                                            <span
                                                className={`rounded-full px-2 py-1 text-[10px] ${
                                                    danger
                                                        ? "bg-red-400/10 text-red-300"
                                                        : "bg-amber-400/10 text-amber-300"
                                                }`}
                                            >
                                                {danger
                                                    ? "تاخیر"
                                                    : String(
                                                          data.status ??
                                                              "فعال"
                                                      )}
                                            </span>
                                        </div>

                                        <div className="mt-4 rounded-xl bg-white/[0.025] p-3">
                                            <p className="text-[10px] text-white/25">
                                                موعد
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-white/70">
                                                {formatDate(
                                                    deadlineDate
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#101114] px-6 py-14 text-center">
                    <BellRing className="mx-auto h-9 w-9 text-white/15" />
                    <p className="mt-3 text-sm text-white/45">
                        مهلتی برای نمایش وجود ندارد
                    </p>
                </div>
            )}
        </section>
    );
}