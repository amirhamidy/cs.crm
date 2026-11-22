"use client";

import { formatProductionInteger, formatProductionLogHours } from "@/lib/productionFormat";

import Pagination from "@/components/ui/Pagination";
import { useDebounced } from "@/components/admin/production/useServerSearch";
import SearchInput from "@/components/admin/production/SearchInput";
import { useEffect, useState } from "react";
import {
    X,
    ClipboardList,
    Trash2,
    Pencil,
    CalendarDays,
    Filter,
    Eye,
    Loader2,
} from "lucide-react";
import { toHHMM } from "@/lib/productionTime";
import { toPersianDigits } from "@/lib/jalali";
import { listAll, fetchPage } from "@/lib/api";
import {
    isoToJalaliString,
    JalaliDatePicker,
    NiceSelect,
    EfficiencyBadge,
    Option,
    Product,
    Cause,
    ProductionLog,
    parseBackendError,
} from "@/components/admin/production/shared";
import { useProductionData } from "@/components/admin/production/ProductionContext";

export default function LogsPage() {
    const { setLogToDelete, setLogToEdit, setLogToView, employeeOptions, machineOptions, refreshVersion } = useProductionData(["machines", "employees"]);
    const [logs, setLogs] = useState<ProductionLog[]>([]);
    const [totalLogs, setTotalLogs] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 20;

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
    const [ordering, setOrdering] = useState("");

    const debouncedSearch = useDebounced(search);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setLoadError("");
        fetchPage<ProductionLog>("/production/api/v1/log/", {
            page,
            page_size: pageSize,
            search: debouncedSearch.trim() || undefined,
            employee_id: filterEmployeeId ?? undefined,
            machine_id: filterMachineId ?? undefined,
            product_id: filterProductId ?? undefined,
            waste_cause_id: filterWasteCauseId ?? undefined,
            breakdown_cause_id: filterBreakdownCauseId ?? undefined,
            date_from: filterDateFrom || undefined,
            date_to: filterDateTo || undefined,
            ordering: ordering || undefined,
        }, controller.signal)
            .then((response) => {
                setLogs(response.results);
                setTotalLogs(response.count);
            })
            .catch((error) => {
                if (controller.signal.aborted) return;
                setLoadError(parseBackendError(error, "دریافت سوابق تولید انجام نشد"));
                setLogs([]);
                setTotalLogs(0);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [page, debouncedSearch, filterEmployeeId, filterMachineId, filterProductId, filterWasteCauseId, filterBreakdownCauseId, filterDateFrom, filterDateTo, ordering, refreshVersion]);

    const pageCount = Math.max(1, Math.ceil(totalLogs / pageSize));


    return (
        <>
        <section className="space-y-4">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                    <ClipboardList size={15} className="text-emerald-500" />
                    سوابق تولید ({toPersianDigits(totalLogs)})
                </h2>
                    <p className="mt-1 text-[10.5px] text-gray-400">(فهرست ثبت‌های روزانه تولید؛ هر ردیف یک شیفت کاری است)</p>
                </div>
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div className="mb-3 flex items-center gap-2 text-[11.5px] font-bold text-gray-500">
                    <Filter size={13} />
                    فیلترها
                    <div className="mr-auto flex"><SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="جستجو در ثبت‌ها..." /></div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <NiceSelect
                        label="کارمند"
                        placeholder="همه کارمندان"
                        emptyText="کارمندی یافت نشد"
                        options={employeeOptions}
                        value={filterEmployeeId}
                        onChange={(value) => { setFilterEmployeeId(value); setPage(1); }}
                    />
                    <NiceSelect
                        label="ماشین"
                        placeholder="همه ماشین‌ها"
                        emptyText="ماشینی یافت نشد"
                        options={machineOptions}
                        value={filterMachineId}
                        onChange={(value) => { setFilterMachineId(value); setPage(1); }}
                    />
                    <NiceSelect
                        label="محصول"
                        placeholder="همه محصولات"
                        emptyText="محصولی یافت نشد"
                        options={productOptions}
                        value={filterProductId}
                        onChange={(value) => { setFilterProductId(value); setPage(1); }}
                    />
                    <NiceSelect
                        label="علت ضایعات"
                        placeholder="همه علت‌های ضایعات"
                        emptyText="علتی یافت نشد"
                        options={wasteOptions}
                        value={filterWasteCauseId}
                        onChange={(value) => { setFilterWasteCauseId(value); setPage(1); }}
                    />
                    <NiceSelect
                        label="علت خرابی ماشین"
                        placeholder="همه علت‌های خرابی"
                        emptyText="علتی یافت نشد"
                        options={breakdownOptions}
                        value={filterBreakdownCauseId}
                        onChange={(value) => { setFilterBreakdownCauseId(value); setPage(1); }}
                    />
                    <JalaliDatePicker
                        label="از تاریخ"
                        value={filterDateFrom}
                        onChange={(value) => { setFilterDateFrom(value); setPage(1); }}
                        max={filterDateTo || undefined}
                        placeholder="بدون محدودیت"
                    />
                    <JalaliDatePicker
                        label="تا تاریخ"
                        value={filterDateTo}
                        onChange={(value) => { setFilterDateTo(value); setPage(1); }}
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
                                setPage(1);
                            }}
                            className="mt-3 flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-[11px] font-bold text-gray-600 transition-colors hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.08]"
                        >
                            <X size={12} />
                            پاک‌کردن فیلترها
                        </button>
                    )}
            </div>

            {loadError && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-[11px] font-bold text-red-600">{loadError}</p>}
            <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-[#fafafa] dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1400px] border-collapse text-right text-[12px]">
                        <thead>
                            <tr className="border-b border-black/5 text-[11px] text-gray-400 dark:border-white/5">
                                {([
                                    ["تاریخ", "date"],
                                    ["پرسنل", "employee"],
                                    ["ماشین", "machine"],
                                    ["محصول", "product"],
                                    ["علت", ""],
                                    ["ساعت کار", "hours"],
                                    ["تولید", "produced"],
                                    ["انتظاری", ""],
                                    ["ضایعات", "waste"],
                                    ["انتظاری", ""],
                                    ["راندمان", ""],
                                    ["", ""],
                                ] as const).map(([h, key], i) => (
                                    <th key={i} className="whitespace-nowrap px-4 py-3 font-bold">
                                        {key ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setOrdering(ordering === key ? `-${key}` : ordering === `-${key}` ? "" : key);
                                                    setPage(1);
                                                }}
                                                className="flex items-center gap-1 hover:text-gray-600"
                                            >
                                                {h}
                                                <span className="text-[10px]">{ordering === key ? "▲" : ordering === `-${key}` ? "▼" : "↕"}</span>
                                            </button>
                                        ) : h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {loading ? (
                                <tr><td colSpan={12} className="py-12 text-center text-gray-400"><Loader2 size={20} className="mx-auto animate-spin" /></td></tr>
                            ) : logs.map((log) => {
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
                                            {formatProductionLogHours(log.hours_worked, log.start_time, log.end_time)}
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
                                            {formatProductionInteger(log.expected_production)}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-red-500">
                                            {toPersianDigits(log.waste_qty)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-400">
                                            {formatProductionInteger(log.expected_waste)}
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
                                                    onClick={() => setLogToEdit(log)}
                                                    aria-label="ویرایش رکورد"
                                                    title="ویرایش"
                                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 transition-colors hover:bg-amber-500 hover:text-white"
                                                >
                                                    <Pencil size={13} />
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

                            {!loading && logs.length === 0 && (
                                <tr>
                                    <td colSpan={12} className="py-12 text-center text-[12px] text-gray-400">
                                        هیچ رکوردی با این فیلترها یافت نشد."
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {pageCount > 1 && <Pagination page={page} totalPages={pageCount} onChange={setPage} />}
        </section>
        </>
    );
}
