"use client";

import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Package,
} from "lucide-react";
import { motion } from "framer-motion";
import {
    ApiWarehouseTask,
} from "@/types/warehouse";
import {
    formatDate,
    formatNumber,
    getStatusLabel,
    getStatusTone,
    getTaskProductName,
} from "@/utils/warehouseEmployee";

interface Props {
    task: ApiWarehouseTask;
    onSelect: (task: ApiWarehouseTask) => void;
}

export default function WarehouseEmployeeTaskCard({
    task,
    onSelect,
}: Props) {
    const data = task as unknown as Record<string, unknown>;

    const status = String(data.status ?? "");
    const tone = getStatusTone(status);

    const expected = Number(
        data.expected_quantity ??
        data.quantity ??
        data.requested_quantity ??
        0
    );

    const received = Number(
        data.received_quantity ??
        data.completed_quantity ??
        0
    );

    const updatedAt =
        data.updated_at ??
        data.modified_at ??
        data.created_at;

    const toneClasses = {
        success:
            "border-emerald-400/15 bg-emerald-400/10 text-emerald-300",
        danger:
            "border-red-400/15 bg-red-400/10 text-red-300",
        warning:
            "border-amber-400/15 bg-amber-400/10 text-amber-300",
        neutral:
            "border-white/[0.08] bg-white/[0.035] text-white/50",
    };

    return (
        <motion.button
            type="button"
            onClick={() => onSelect(task)}
            whileHover={{ y: -2 }}
            className="group w-full rounded-2xl border border-white/[0.07] bg-[#101114] p-4 text-right transition hover:border-white/[0.12] hover:bg-[#131417]"
        >
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300">
                    <ClipboardList className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">
                                وظیفه #
                                {String(data.id ?? "—")}
                            </span>

                            <span
                                className={`rounded-full border px-2 py-1 text-[10px] font-medium ${toneClasses[tone]}`}
                            >
                                {getStatusLabel(status)}
                            </span>
                        </div>

                        <ArrowLeft className="h-4 w-4 text-white/20 transition group-hover:-translate-x-1 group-hover:text-white/60" />
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-sm text-white/65">
                        <Package className="h-4 w-4 text-white/30" />
                        <span className="truncate">
                            {getTaskProductName(task)}
                        </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <div className="rounded-xl bg-white/[0.025] px-3 py-2">
                            <p className="text-[10px] text-white/30">
                                مقدار مورد انتظار
                            </p>
                            <p className="mt-1 text-xs font-semibold text-white/70">
                                {formatNumber(expected)}
                            </p>
                        </div>

                        <div className="rounded-xl bg-white/[0.025] px-3 py-2">
                            <p className="text-[10px] text-white/30">
                                مقدار دریافت
                            </p>
                            <p className="mt-1 text-xs font-semibold text-emerald-300">
                                {formatNumber(received)}
                            </p>
                        </div>

                        <div className="col-span-2 flex items-center gap-2 rounded-xl bg-white/[0.025] px-3 py-2 sm:col-span-1">
                            <CalendarDays className="h-3.5 w-3.5 text-white/25" />
                            <span className="text-[10px] text-white/40">
                                {formatDate(updatedAt)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.button>
    );
}