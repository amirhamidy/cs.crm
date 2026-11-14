"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    Factory,
    SquarePen,
    Loader2,
    AlertTriangle,
    Trash2,
    Gauge,
} from "lucide-react";
import { toPersianDigits } from "@/lib/jalali";
import {
    Option,
    gradientOf,
    initialOf,
    NiceSelect,
    StatusSwitch,
} from "@/components/admin/production/shared";
import { useProductionData } from "@/components/admin/production/ProductionContext";

export default function MachinesPage() {
    const { machines, loading, togglingId, setMachineModal, handleToggleActive, handleDeleteMachine } = useProductionData(["machines"]);

    const [machineStatusFilter, setMachineStatusFilter] = useState<number | null>(null);

    const filteredMachines = useMemo(() => {
        if (machineStatusFilter === null) return machines;
        if (machineStatusFilter === 1) return machines.filter((m) => m.is_active);
        return machines.filter((m) => !m.is_active);
    }, [machines, machineStatusFilter]);

    const machineStatusOptions = useMemo<Option[]>(
        () => [
            { id: null as unknown as number, label: "همه وضعیت‌ها", sub: "" },
            { id: 1, label: "فعال", sub: "" },
            { id: 0, label: "غیرفعال", sub: "" },
        ],
        []
    );

    return (
        <>
        <section className="space-y-4">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                    <Factory size={15} className="text-indigo-500" />
                    ماشین‌آلات ({toPersianDigits(filteredMachines.length)})
                </h2>
                <div className="w-48">
                    <NiceSelect
                        label="فیلتر وضعیت"
                        placeholder="همه وضعیت‌ها"
                        emptyText="گزینه‌ای یافت نشد"
                        options={machineStatusOptions}
                        value={machineStatusFilter}
                        onChange={setMachineStatusFilter}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 size={22} className="animate-spin text-indigo-500" />
                </div>
            ) : filteredMachines.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-[12px] text-gray-400 dark:border-white/[0.1]">
                    ماشینی با این فیلتر یافت نشد.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMachines.map((m, index) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index, 8) * 0.03 }}
                            className={`flex flex-col gap-3 rounded-2xl border p-4 transition-shadow duration-200 ${m.is_active
                                ? "border-black/[0.06] bg-[#fafafa] hover:shadow-[0_0_0_1px_rgba(99,102,241,0.35),0_14px_40px_rgba(99,102,241,0.25)] dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:shadow-[0_0_0_1px_rgba(129,140,248,0.45),0_14px_44px_rgba(99,102,241,0.35)]"
                                : "border-slate-300/40 bg-slate-50 opacity-75 dark:border-white/[0.08] dark:bg-white/[0.015]"
                                }`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div
                                        className={`flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-2xl bg-gradient-to-br text-[15px] font-extrabold text-white ${gradientOf(
                                            m.id
                                        )}`}
                                    >
                                        {initialOf(m.name)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-[13.5px] font-extrabold leading-tight text-gray-800 dark:text-gray-100">
                                            {m.name}
                                        </p>
                                        <p dir="ltr" className="mt-0.5 text-right font-mono text-[11px] text-gray-400 dark:text-gray-500">
                                            {m.code}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setMachineModal({ open: true, machine: m })}
                                        aria-label="ویرایش ماشین"
                                        title="ویرایش"
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-black/[0.14] bg-[#e2e2e2] text-gray-700 transition-all hover:bg-blue-600 hover:text-white active:scale-95 dark:border-white/[0.13] dark:bg-[#1e1e1e] dark:text-gray-200 dark:hover:bg-blue-600"
                                    >
                                        <SquarePen size={15} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (
                                                confirm(
                                                    `ماشین «${m.name}» حذف شود؟\nاگر سابقه تولید داشته باشد، حذف ممکن نیست و باید غیرفعال شود.`
                                                )
                                            ) {
                                                handleDeleteMachine(m);
                                            }
                                        }}
                                        aria-label="حذف ماشین"
                                        title="حذف"
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-black/[0.14] bg-[#e2e2e2] text-gray-700 transition-all hover:bg-red-600 hover:text-white active:scale-95 dark:border-white/[0.13] dark:bg-[#1e1e1e] dark:text-gray-200 dark:hover:bg-red-600"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 border-t border-black/5 pt-3 dark:border-white/5">
                                <div className="rounded-xl bg-black/[0.03] px-3 py-2 dark:bg-white/[0.03]">
                                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                        <Gauge size={11} />
                                        تولید در ساعت
                                    </span>
                                    <span className="mt-0.5 block text-[13px] font-extrabold text-gray-800 dark:text-gray-100">
                                        {toPersianDigits(m.std_production_per_hour)}
                                    </span>
                                </div>
                                <div className="rounded-xl bg-black/[0.03] px-3 py-2 dark:bg-white/[0.03]">
                                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                        <AlertTriangle size={11} />
                                        ضایعات در ساعت
                                    </span>
                                    <span className="mt-0.5 block text-[13px] font-extrabold text-red-500">
                                        {toPersianDigits(m.std_waste_per_hour)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span
                                    className={`rounded-lg border px-2 py-0.5 text-[10.5px] font-bold ${m.is_active
                                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "border-slate-400/30 bg-slate-400/10 text-slate-500 dark:text-slate-400"
                                        }`}
                                >
                                    {m.is_active ? "فعال" : "غیرفعال"}
                                </span>
                                <StatusSwitch
                                    isActive={m.is_active}
                                    loading={togglingId === m.id}
                                    disabled={togglingId !== null && togglingId !== m.id}
                                    title={m.is_active ? "غیرفعال‌سازی ماشین" : "فعال‌سازی ماشین"}
                                    onToggle={() => handleToggleActive(m)}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </section>
        </>
    );
}
