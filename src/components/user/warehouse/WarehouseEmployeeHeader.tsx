"use client";

import {
    Boxes,
    RefreshCw,
    ShieldCheck,
    Warehouse,
} from "lucide-react";
import { motion } from "framer-motion";

interface Props {
    employeeName?: string;
    staffCode?: string | number;
    refreshing?: boolean;
    onRefresh?: () => void;
}

export default function WarehouseEmployeeHeader({
    employeeName,
    staffCode,
    refreshing = false,
    onRefresh,
}: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#101114] p-5 shadow-[0_20px_70px_rgba(0,0,0,.25)] sm:p-6"
        >
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-orange-500/[0.08] blur-3xl" />
            <div className="absolute -bottom-32 left-10 h-56 w-56 rounded-full bg-blue-500/[0.05] blur-3xl" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10">
                        <Warehouse className="h-7 w-7 text-orange-400" />
                    </div>

                    <div>
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                            <h1 className="text-lg font-bold text-white sm:text-xl">
                                انبارداری
                            </h1>

                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                دسترسی فعال
                            </span>
                        </div>

                        <p className="text-sm text-white/45">
                            مدیریت وظایف، موجودی و عملیات انبار
                        </p>

                        {(employeeName || staffCode) && (
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/35">
                                {employeeName && (
                                    <span>{employeeName}</span>
                                )}

                                {staffCode && (
                                    <>
                                        <span className="h-1 w-1 rounded-full bg-white/20" />
                                        <span>
                                            کد پرسنلی: {staffCode}
                                        </span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={refreshing}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-sm font-medium text-white/70 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <RefreshCw
                        className={`h-4 w-4 ${refreshing ? "animate-spin" : ""
                            }`}
                    />
                    بروزرسانی
                </button>
            </div>

            <div className="relative mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
                    <div className="mb-2 flex items-center gap-2 text-white/35">
                        <Boxes className="h-4 w-4" />
                        <span className="text-xs">حوزه کاری</span>
                    </div>
                    <p className="text-sm font-semibold text-white">
                        عملیات انبار
                    </p>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
                    <div className="mb-2 text-xs text-white/35">
                        وضعیت
                    </div>
                    <p className="text-sm font-semibold text-emerald-300">
                        فعال
                    </p>
                </div>

                <div className="col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3 sm:col-span-1">
                    <div className="mb-2 text-xs text-white/35">
                        نقش
                    </div>
                    <p className="text-sm font-semibold text-white">
                        کارمند انبار
                    </p>
                </div>
            </div>
        </motion.div>
    );
}