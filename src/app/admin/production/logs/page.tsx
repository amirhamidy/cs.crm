"use client";

import { useDebounced, useServerSearch } from "@/components/admin/production/useServerSearch";
import SearchInput from "@/components/admin/production/SearchInput";
import { useEffect, useMemo, useState } from "react";
import {
    X,
    ClipboardList,
    Trash2,
    CalendarDays,
    Filter,
    Eye,
} from "lucide-react";
import { toHHMM } from "@/lib/productionTime";
import { toPersianDigits } from "@/lib/jalali";
import { listAll } from "@/lib/api";
import {
    isoToJalaliString,
    currentJalaliYearMonth,
    JalaliDatePicker,
    NiceSelect,
    EfficiencyBadge,
    Option,
    Product,
    Cause,
    ProductionLog,
} from "@/components/admin/production/shared";
import { useProductionData } from "@/components/admin/production/ProductionContext";

export default function LogsPage() {
    const { logs, loading, setLogToDelete, setLogToView, employeeOptions, machineOptions } = useProductionData(["logs", "machines", "employees"]);

    const [filterEmployeeId, setFilterEmployeeId] = useState<number | null>(null);
    const [filterMachineId, setFilterMachineId] = useState<number | null>(null);
    const [filterProductId, setFilterProductId] = useState<number | null>(null);
    const [filterWasteCauseId, setFilterWasteCauseId] = useState<number | null>(null);
    const [filterBreakdownCauseId, setFilterBreakdownCauseId] = useState<number | null>(null);
    const [productOptions, setProductOptions] = useState<Option[]>([]);
    const [wasteOptions, setWasteOptions] = useState<Option[]>([]);
    const [breakdownOptions, setBreakdownOptions] = useState<Option[]>([]);
    useEffect(() => {
        listAll<Product>("/production/api/v1/product/")
            .then((a) => setProductOptions(a.map((p) => ({ id: p.id, label: p.name, sub: `کد: ${p.code}` }))))
            .catch(() => {});
        listAll<Cause>("/production/api/v1/cause/", { is_active: true })
            .then((a) => {
                setWasteOptions(a.filter((c) => c.kind === "waste").map((c) => ({ id: c.id, label: c.name, sub: "" })));
                setBreakdownOptions(a.filter((c) => c.kind === "breakdown").map((c) => ({ id: c.id, label: c.name, sub: "" })));
            })
            .catch(() => {});
    }, []);
    const [filterDateFrom, setFilterDateFrom] = useState("");
    const [filterDateTo, setFilterDateTo] = useState("");
    const [search, setSearch] = useState("");

    const debouncedSearch = useDebounced(search);
    const searched = useServerSearch<ProductionLog>("/production/api/v1/log/", debouncedSearch, logs);

    const filteredLogs = useMemo(() => {
        return searched.items.filter((l) => {
            if (filterEmployeeId !== null && l.employee !== filterEmployeeId) return false;
            if (filterMachineId !== null && l.machine !== filterMachineId) return false;
            if (filterProductId !== null && l.product !== filterProductId) return false;
            if (filterWasteCauseId !== null && l.waste_cause !== filterWasteCauseId) return false;
            if (filterBreakdownCauseId !== null && l.breakdown_cause !== filterBreakdownCauseId) return false;
            if (filterDateFrom && l.date < filterDateFrom) return false;
            if (filterDateTo && l.date > filterDateTo) return false;
            return true;
        });
    }, [searched.items, filterEmployeeId, filterMachineId, filterProductId, filterWasteCauseId, filterBreakdownCauseId, filterDateFrom, filterDateTo]);

    return (
        <>
        <section className="space-y-4">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                    <ClipboardList size={15} className="text-emerald-500" />
                    سوابق تولید ({toPersianDigits(filteredLogs.length)} از {toPersianDigits(logs.length)})
                </h2>
                    <p className="mt-1 text-[10.5px] text-gray-400">(فهرست ثبت‌های روزانه تولید؛ هر ردیف یک شیفت کاری است)</p>
                </div>
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div className="mb-3 flex items-center gap-2 text-[11.5px] font-bold text-gray-500">
                    <Filter size={13} />
                    فیلترها
                    <div className="mr-auto flex"><SearchInput value={search} onChange={setSearch} placeholder="جستجو در ثبت‌ها..." /></div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <NiceSelect
                        label="کارمند"
                        placeholder="همه کارمندان"
                        emptyText="کارمندی یافت نشد"
                        options={employeeOptions}
                        value={filterEmployeeId}
                        onChange={setFilterEmployeeId}
                    />
                    <NiceSelect
                        label="ماشین"
                        placeholder="همه ماشین‌ها"
                        emptyText="ماشینی یافت نشد"
                        options={machineOptions}
                        value={filterMachineId}
                        onChange={setFilterMachineId}
                    />
                    <NiceSelect
                        label="محصول"
                        placeholder="همه محصولات"
                        emptyText="محصولی یافت نشد"
                        options={productOptions}
                        value={filterProductId}
                        onChange={setFilterProductId}
                    />
                    <NiceSelect
                        label="علت ضایعات"
                        placeholder="همه علت‌های ضایعات"
                        emptyText="علتی یافت نشد"
                        options={wasteOptions}
                        value={filterWasteCauseId}
                        onChange={setFilterWasteCauseId}
                    />
                    <NiceSelect
                        label="علت خرابی ماشین"
                        placeholder="همه علت‌های خرابی"
                        emptyText="علتی یافت نشد"
                        options={breakdownOptions}
                        value={filterBreakdownCauseId}
                        onChange={setFilterBreakdownCauseId}
                    />
                    <JalaliDatePicker
                        label="از تاریخ"
                        value={filterDateFrom}
                        onChange={setFilterDateFrom}
                        max={filterDateTo || undefined}
                        placeholder="بدون محدودیت"
                    />
                    <JalaliDatePicker
                        label="تا تاریخ"
                        value={filterDateTo}
                        onChange={setFilterDateTo}
                        min={filterDateFrom || undefined}
                        placeholder="بدون محدودیت"
                    />
                </div>
                {(filterEmployeeId !== null ||
                    filterMachineId !== null ||
                    filterProductId !== null ||
                    filterWasteCauseId !== null ||
                    filterBreakdownCauseId !== null ||
                    filterDateFrom ||
                    filterDateTo) && (
                        <button
                            type="button"
                            onClick={() => {
                                setFilterEmployeeId(null);
                                setFilterMachineId(null);
                                setFilterProductId(null);
                                setFilterWasteCauseId(null);
                                setFilterBreakdownCauseId(null);
                                setFilterDateFrom("");
                                setFilterDateTo("");
                            }}
                            className="mt-3 flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-[11px] font-bold text-gray-600 transition-colors hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.08]"
                        >
                            <X size={12} />
                            پاک‌کردن فیلترها
                        </button>
                    )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-[#fafafa] dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-right text-[12px]">
                        <thead>
                            <tr className="border-b border-black/5 text-[11px] text-gray-400 dark:border-white/5">
                                {[
                                    "تاریخ",
                                    "پرسنل",
                                    "ماشین",
                                    "محصول",
                                    "علت",
                                    "ساعت کار",
                                    "تولید",
                                    "انتظاری",
                                    "ضایعات",
                                    "انتظاری",
                                    "راندمان",
                                    "",
                                ].map((h, i) => (
                                    <th key={i} className="whitespace-nowrap px-4 py-3 font-bold">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {filteredLogs.map((log) => {
                                return (
                                    <tr
                                        key={log.id}
                                        className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                                    >
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                                <CalendarDays size={12} className="shrink-0" />
                                                {toPersianDigits(isoToJalaliString(log.date))}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 font-extrabold text-gray-800 dark:text-gray-100">
                                            {log.employee_name}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">
                                            {log.machine_name}{" "}
                                            <span className="font-mono text-[10px] text-gray-400">
                                                ({log.machine_code})
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">
                                            {log.product_name || "—"}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">
                                            <span className="block">{log.waste_cause_name || "—"}</span>
                                            {log.breakdown_cause_name && (
                                                <span className="block text-[11px] text-gray-500">خرابی: {log.breakdown_cause_name}</span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">
                                            {toPersianDigits(log.hours_worked)} ساعت
                                            {toHHMM(log.start_time) && (
                                                <div className="font-mono text-[10px] text-gray-400" dir="ltr">
                                                    {toPersianDigits(toHHMM(log.start_time))} → {toPersianDigits(toHHMM(log.end_time))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-black text-emerald-600 dark:text-emerald-400">
                                            {toPersianDigits(log.produced_qty.toLocaleString())}
                                        </td>
                                        <td className="px-4 py-3 text-gray-400">
                                            {toPersianDigits(Number(log.expected_production).toFixed(1))}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-red-500">
                                            {toPersianDigits(log.waste_qty)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-400">
                                            {toPersianDigits(Number(log.expected_waste).toFixed(1))}
                                        </td>
                                        <td className="px-4 py-3">
                                            <EfficiencyBadge value={log.efficiency} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setLogToView(log)}
                                                    aria-label="مشاهده توضیحات"
                                                    title="مشاهده توضیحات"
                                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 transition-colors hover:bg-blue-500 hover:text-white"
                                                >
                                                    <Eye size={13} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setLogToDelete(log)}
                                                    aria-label="حذف رکورد"
                                                    title="حذف"
                                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-500 transition-colors hover:bg-red-500 hover:text-white"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {!loading && filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan={12} className="py-12 text-center text-[12px] text-gray-400">
                                        {logs.length === 0
                                            ? "هنوز رکوردی ثبت نشده. با «ثبت لاگ جدید» اولین رکورد را اضافه کنید."
                                            : "رکوردی با این فیلترها یافت نشد."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
        </>
    );
}
