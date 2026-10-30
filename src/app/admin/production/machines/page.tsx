"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";

import LazyLoading from "@/components/ui/LazyLoading";
import { m, AnimatePresence } from "framer-motion";
import { Factory, Plus, SquarePen, X, Loader2, TrendingUp, BarChart3, AlertTriangle, ClipboardList, Trash2, CalendarDays, Gauge, Filter, LineChart, Users, Eye, CalendarCogIcon } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";

import { listAll } from "@/lib/api";
import Pagination from "@/components/ui/Pagination";
import { toHHMM } from "@/lib/productionTime";
import { toPersianDigits, JALALI_MONTHS, pad2 } from "@/lib/jalali";
import { EfficiencyBadge, EmployeeItem, ErrorBanner, Field, GroupBy, INPUT_CLS, JalaliDatePicker, Machine, MachineMonthlyReport, MachineSummaryReport, MonthlyReport, NiceSelect, Option, ProductionLog, StatCard, StatusSwitch, currentJalaliYearMonth, fetchAllEmployeesCached, gradientOf, initialOf, isoToJalaliString, parseBackendError, todayGregorian } from "./_shared";


const ProductionBarChart = dynamic(() => import("@/components/charts/ProductionBarChart"), {
    ssr: false,
    loading: () => <LazyLoading />,
});

const ConfirmDeleteLog = dynamic(() => import("./_modals").then((mod) => mod.ConfirmDeleteLog), {
    ssr: false,
    loading: () => <LazyLoading />,
});
const LogModal = dynamic(() => import("./_modals").then((mod) => mod.LogModal), {
    ssr: false,
    loading: () => <LazyLoading />,
});
const MachineModal = dynamic(() => import("./_modals").then((mod) => mod.MachineModal), {
    ssr: false,
    loading: () => <LazyLoading />,
});
const ViewNoteModal = dynamic(() => import("./_modals").then((mod) => mod.ViewNoteModal), {
    ssr: false,
    loading: () => <LazyLoading />,
});

type TabKey = "dashboard" | "machines" | "logs" | "monthly" | "machineSummary" | "machineMonthly";


const LOGS_PAGE_SIZE = 20;

export default function AdminProductionManagementPage() {
    const [machines, setMachines] = useState<Machine[]>([]);
    const [logs, setLogs] = useState<ProductionLog[]>([]);
    const [employees, setEmployees] = useState<EmployeeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState("");
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>("dashboard");

    const [machineModal, setMachineModal] = useState<{ open: boolean; machine: Machine | null }>({
        open: false,
        machine: null,
    });
    const [showLogModal, setShowLogModal] = useState(false);
    const [logToDelete, setLogToDelete] = useState<ProductionLog | null>(null);
    const [logToView, setLogToView] = useState<ProductionLog | null>(null);

    const [filterEmployeeId, setFilterEmployeeId] = useState<number | null>(null);
    const [filterMachineId, setFilterMachineId] = useState<number | null>(null);
    const [filterDateFrom, setFilterDateFrom] = useState("");
    const [filterDateTo, setFilterDateTo] = useState("");
    const [machineStatusFilter, setMachineStatusFilter] = useState<number | null>(null);
    const [logsPage, setLogsPage] = useState(1);

    const { jy: currentJy, jm: currentJm } = useMemo(() => currentJalaliYearMonth(), []);
    const [reportYear, setReportYear] = useState(currentJy);
    const [reportMonth, setReportMonth] = useState(currentJm);
    const [reportEmployeeId, setReportEmployeeId] = useState<number | null>(null);
    const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
    const [monthlyLoading, setMonthlyLoading] = useState(false);
    const [monthlyError, setMonthlyError] = useState("");

    const [summaryMachineId, setSummaryMachineId] = useState<number | null>(null);
    const [summaryGroupBy, setSummaryGroupBy] = useState<number | null>(0);
    const [summaryDateFrom, setSummaryDateFrom] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 6);
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    });
    const [summaryDateTo, setSummaryDateTo] = useState(todayGregorian());
    const [summaryReport, setSummaryReport] = useState<MachineSummaryReport | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState("");

    const [machineMonthlyReport, setMachineMonthlyReport] = useState<MachineMonthlyReport | null>(null);
    const [machineMonthlyLoading, setMachineMonthlyLoading] = useState(false);
    const [machineMonthlyError, setMachineMonthlyError] = useState("");

    const fetchData = useCallback(async () => {
        try {
            const [mach, logsAll, emp] = await Promise.all([
                listAll<Machine>("/production/api/v1/machine/"),
                listAll<ProductionLog>("/production/api/v1/log/"),
                fetchAllEmployeesCached(),
            ]);
            setMachines(mach);
            setLogs(logsAll);
            setEmployees(emp);
        } catch (err) {
            setPageError(parseBackendError(err, "دریافت اطلاعات تولید با خطا مواجه شد"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const stats = useMemo(() => {
        let produced = 0;
        let waste = 0;
        let effSum = 0;
        let effCount = 0;

        logs.forEach((l) => {
            produced += Number(l.produced_qty || 0);
            waste += Number(l.waste_qty || 0);
            if (l.efficiency !== null && l.efficiency !== undefined) {
                effSum += Number(l.efficiency);
                effCount++;
            }
        });

        return {
            produced,
            waste,
            avgEfficiency: effCount > 0 ? effSum / effCount : 0,
        };
    }, [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter((l) => {
            if (filterEmployeeId !== null && l.employee !== filterEmployeeId) return false;
            if (filterMachineId !== null && l.machine !== filterMachineId) return false;
            if (filterDateFrom && l.date < filterDateFrom) return false;
            if (filterDateTo && l.date > filterDateTo) return false;
            return true;
        });
    }, [logs, filterEmployeeId, filterMachineId, filterDateFrom, filterDateTo]);

    
    useEffect(() => {
        setLogsPage(1);
    }, [filterEmployeeId, filterMachineId, filterDateFrom, filterDateTo]);

    
    
    const logsTotalPages = Math.max(1, Math.ceil(filteredLogs.length / LOGS_PAGE_SIZE));
    const pagedLogs = useMemo(() => {
        const start = (logsPage - 1) * LOGS_PAGE_SIZE;
        return filteredLogs.slice(start, start + LOGS_PAGE_SIZE);
    }, [filteredLogs, logsPage]);

    const filteredMachines = useMemo(() => {
        if (machineStatusFilter === null) return machines;
        if (machineStatusFilter === 1) return machines.filter((m) => m.is_active);
        return machines.filter((m) => !m.is_active);
    }, [machines, machineStatusFilter]);

    const employeeOptions = useMemo<Option[]>(
        () =>
            employees.map((e) => ({
                id: e.id,
                label: e.full_name || e.username,
                sub: `@${e.username}`,
            })),
        [employees]
    );

    const machineOptions = useMemo<Option[]>(
        () =>
            machines.map((m) => ({
                id: m.id,
                label: m.name,
                sub: `کد: ${m.code}${m.is_active ? "" : " (غیرفعال)"}`,
            })),
        [machines]
    );

    const machineStatusOptions = useMemo<Option[]>(
        () => [
            { id: null as unknown as number, label: "همه وضعیت‌ها", sub: "" },
            { id: 1, label: "فعال", sub: "" },
            { id: 0, label: "غیرفعال", sub: "" },
        ],
        []
    );

    const monthOptions = useMemo<Option[]>(
        () => JALALI_MONTHS.map((name, idx) => ({ id: idx + 1, label: name, sub: "" })),
        []
    );

    const groupByOptions = useMemo<Option[]>(
        () => [
            { id: 0, label: "روزانه", sub: "" },
            { id: 1, label: "هفتگی", sub: "" },
            { id: 2, label: "ماهانه", sub: "" },
            { id: 3, label: "سالانه", sub: "" },
        ],
        []
    );

    async function handleToggleActive(m: Machine) {
        if (togglingId !== null) return;
        setTogglingId(m.id);
        setPageError("");
        try {
            await axiosInstance.patch(`/production/api/v1/machine/${m.id}/update/`, {
                is_active: !m.is_active,
            });
            setMachines((prev) =>
                prev.map((item) => (item.id === m.id ? { ...item, is_active: !m.is_active } : item))
            );
        } catch (err) {
            setPageError(parseBackendError(err, "خطا در تغییر وضعیت ماشین"));
        } finally {
            setTogglingId(null);
        }
    }

    async function handleDeleteMachine(m: Machine) {
        setPageError("");
        try {
            await axiosInstance.delete(`/production/api/v1/machine/${m.id}/delete/`);
            fetchData();
        } catch (err) {
            setPageError(
                parseBackendError(
                    err,
                    `حذف ماشین «${m.name}» ممکن نیست. اگر این ماشین سابقه تولید دارد، به‌جای حذف، آن را غیرفعال کنید.`
                )
            );
        }
    }

    async function loadMonthlyReport() {
        setMonthlyLoading(true);
        setMonthlyError("");
        try {
            const params: Record<string, string | number> = { year: reportYear, month: reportMonth };
            if (reportEmployeeId !== null) params.employee_id = reportEmployeeId;
            const res = await axiosInstance.get("/production/api/v1/report/monthly/", { params });
            setMonthlyReport(res.data as MonthlyReport);
        } catch (err) {
            setMonthlyError(parseBackendError(err, "دریافت گزارش ماهانه با خطا مواجه شد"));
            setMonthlyReport(null);
        } finally {
            setMonthlyLoading(false);
        }
    }

    async function loadSummaryReport() {
        setSummaryLoading(true);
        setSummaryError("");
        try {
            const groupByMap: Record<number, GroupBy> = { 0: "day", 1: "week", 2: "month", 3: "year" };
            const params: Record<string, string> = {
                date_from: summaryDateFrom,
                date_to: summaryDateTo,
                group_by: groupByMap[summaryGroupBy ?? 0],
            };
            if (summaryMachineId !== null) params.machine_id = String(summaryMachineId);
            const res = await axiosInstance.get("/production/api/v1/report/machine/summary/", { params });
            setSummaryReport(res.data as MachineSummaryReport);
        } catch (err) {
            setSummaryError(parseBackendError(err, "دریافت گزارش روند تولید با خطا مواجه شد"));
            setSummaryReport(null);
        } finally {
            setSummaryLoading(false);
        }
    }

    async function loadMachineMonthlyReport() {
        setMachineMonthlyLoading(true);
        setMachineMonthlyError("");
        try {
            const res = await axiosInstance.get("/production/api/v1/report/machine/monthly/", {
                params: { year: reportYear, month: reportMonth },
            });
            setMachineMonthlyReport(res.data as MachineMonthlyReport);
        } catch (err) {
            setMachineMonthlyError(parseBackendError(err, "دریافت گزارش ماهانه ماشین با خطا مواجه شد"));
            setMachineMonthlyReport(null);
        } finally {
            setMachineMonthlyLoading(false);
        }
    }

    useEffect(() => {
        if (activeTab === "monthly") loadMonthlyReport();
    }, [activeTab, reportYear, reportMonth, reportEmployeeId]);

    useEffect(() => {
        if (activeTab === "machineSummary") loadSummaryReport();
    }, [activeTab, summaryDateFrom, summaryDateTo, summaryGroupBy, summaryMachineId]);

    useEffect(() => {
        if (activeTab === "machineMonthly") loadMachineMonthlyReport();
    }, [activeTab, reportYear, reportMonth]);

    const tabs: { key: TabKey; label: string; icon: ReactNode }[] = [
        { key: "dashboard", label: "داشبورد", icon: <BarChart3 size={14} /> },
        { key: "machines", label: "ماشین‌آلات", icon: <Factory size={14} /> },
        { key: "logs", label: "سوابق تولید", icon: <ClipboardList size={14} /> },
        { key: "monthly", label: "عملکرد نیرو", icon: <Users size={14} /> },
        { key: "machineSummary", label: "عملکرد ماشین", icon: <CalendarCogIcon  size={14} /> },
        { key: "machineMonthly", label: " عملکرد ماهانه ماشین ", icon: <CalendarCogIcon size={14} /> },
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6" dir="rtl">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                        <Factory size={20} />
                    </div>
                    <div>
                        <h1 className="text-[16px] font-extrabold text-gray-900 dark:text-white">
                            مدیریت تولید و ماشین‌آلات
                        </h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-400">
                            آمار کلیدی، کنترل دستگاه‌ها و سوابق تولید
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <m.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowLogModal(true)}
                        className="flex h-11 items-center gap-2 rounded-full bg-emerald-600 px-5 text-[12.5px] font-bold text-white transition-colors hover:bg-emerald-500"
                    >
                        <ClipboardList size={15} />
                        ثبت عملکرد جدید
                    </m.button>
                    <m.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setMachineModal({ open: true, machine: null })}
                        className="flex h-11 items-center gap-2 rounded-full bg-blue-600 px-5 text-[12.5px] font-bold text-white transition-colors hover:bg-blue-500"
                    >
                        <Plus size={15} />
                        تعریف ماشین
                    </m.button>
                </div>
            </div>

            <ErrorBanner message={pageError} onClose={() => setPageError("")} />

            <div className="flex flex-wrap gap-2 rounded-2xl border border-black/[0.06] bg-[#fafafa] p-2 dark:border-white/[0.06] dark:bg-white/[0.02]">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setActiveTab(t.key)}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-bold transition-all ${activeTab === t.key
                            ? "bg-white text-blue-600 shadow-sm dark:bg-white/[0.06] dark:text-blue-400"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            }`}
                    >
                        {t.icon}
                        {t.label}
                    </button>
                ))}
            </div>

            {activeTab === "dashboard" && (
                <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <StatCard
                            label="کل تولید واقعی"
                            value={toPersianDigits(stats.produced.toLocaleString())}
                            unit="عدد"
                            tone="emerald"
                            icon={<TrendingUp size={16} />}
                        />
                        <StatCard
                            label="میانگین راندمان"
                            value={`${toPersianDigits(stats.avgEfficiency.toFixed(1))}٪`}
                            tone="indigo"
                            icon={<BarChart3 size={16} />}
                        />
                        <StatCard
                            label="کل ضایعات ثبت‌شده"
                            value={toPersianDigits(stats.waste.toLocaleString())}
                            unit="عدد"
                            tone="red"
                            icon={<AlertTriangle size={16} />}
                        />
                    </div>

                    <section className="space-y-4">
                        <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                            <Factory size={15} className="text-indigo-500" />
                            ماشین‌آلات خط تولید ({toPersianDigits(machines.length)})
                        </h2>

                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 size={22} className="animate-spin text-indigo-500" />
                            </div>
                        ) : machines.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-[12px] text-gray-400 dark:border-white/[0.1]">
                                هنوز ماشینی تعریف نشده. با «تعریف ماشین» شروع کنید.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {machines.slice(0, 6).map((machine, index) => (
                                    <m.div
                                        key={machine.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(index, 8) * 0.03 }}
                                        className="flex flex-col gap-3 rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 transition-shadow duration-200 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.35),0_14px_40px_rgba(99,102,241,0.25)] dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:shadow-[0_0_0_1px_rgba(129,140,248,0.45),0_14px_44px_rgba(99,102,241,0.35)]"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div
                                                    className={`flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-2xl bg-gradient-to-br text-[15px] font-extrabold text-white ${gradientOf(
                                                        machine.id
                                                    )}`}
                                                >
                                                    {initialOf(machine.name)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-[13.5px] font-extrabold leading-tight text-gray-800 dark:text-gray-100">
                                                        {machine.name}
                                                    </p>
                                                    <p dir="ltr" className="mt-0.5 text-right font-mono text-[11px] text-gray-400 dark:text-gray-500">
                                                        {machine.code}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setMachineModal({ open: true, machine: machine })}
                                                aria-label="ویرایش ماشین"
                                                title="ویرایش"
                                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-black/[0.14] bg-[#e2e2e2] text-gray-700 transition-all hover:bg-blue-600 hover:text-white active:scale-95 dark:border-white/[0.13] dark:bg-[#1e1e1e] dark:text-gray-200 dark:hover:bg-blue-600"
                                            >
                                                <SquarePen size={15} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 border-t border-black/5 pt-3 dark:border-white/5">
                                            <div className="rounded-xl bg-black/[0.03] px-3 py-2 dark:bg-white/[0.03]">
                                                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                                    <Gauge size={11} />
                                                    تولید در ساعت
                                                </span>
                                                <span className="mt-0.5 block text-[13px] font-extrabold text-gray-800 dark:text-gray-100">
                                                    {toPersianDigits(machine.std_production_per_hour)}
                                                </span>
                                            </div>
                                            <div className="rounded-xl bg-black/[0.03] px-3 py-2 dark:bg-white/[0.03]">
                                                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                                    <AlertTriangle size={11} />
                                                    ضایعات در ساعت
                                                </span>
                                                <span className="mt-0.5 block text-[13px] font-extrabold text-red-500">
                                                    {toPersianDigits(machine.std_waste_per_hour)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`rounded-lg border px-2 py-0.5 text-[10.5px] font-bold ${machine.is_active
                                                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                    : "border-gray-400/30 bg-gray-400/10 text-gray-500 dark:text-gray-400"
                                                    }`}
                                            >
                                                {machine.is_active ? "فعال" : "غیرفعال"}
                                            </span>
                                            <StatusSwitch
                                                isActive={machine.is_active}
                                                loading={togglingId === machine.id}
                                                disabled={togglingId !== null && togglingId !== machine.id}
                                                title={machine.is_active ? "غیرفعال‌سازی ماشین" : "فعال‌سازی ماشین"}
                                                onToggle={() => handleToggleActive(machine)}
                                            />
                                        </div>
                                    </m.div>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}

            {activeTab === "machines" && (
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
                            {filteredMachines.map((machine, index) => (
                                <m.div
                                    key={machine.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(index, 8) * 0.03 }}
                                    className={`flex flex-col gap-3 rounded-2xl border p-4 transition-shadow duration-200 ${machine.is_active
                                        ? "border-black/[0.06] bg-[#fafafa] hover:shadow-[0_0_0_1px_rgba(99,102,241,0.35),0_14px_40px_rgba(99,102,241,0.25)] dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:shadow-[0_0_0_1px_rgba(129,140,248,0.45),0_14px_44px_rgba(99,102,241,0.35)]"
                                        : "border-gray-300/40 bg-gray-50 opacity-75 dark:border-white/[0.08] dark:bg-white/[0.015]"
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div
                                                className={`flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-2xl bg-gradient-to-br text-[15px] font-extrabold text-white ${gradientOf(
                                                    machine.id
                                                )}`}
                                            >
                                                {initialOf(machine.name)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-[13.5px] font-extrabold leading-tight text-gray-800 dark:text-gray-100">
                                                    {machine.name}
                                                </p>
                                                <p dir="ltr" className="mt-0.5 text-right font-mono text-[11px] text-gray-400 dark:text-gray-500">
                                                    {machine.code}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setMachineModal({ open: true, machine: machine })}
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
                                                            `ماشین «${machine.name}» حذف شود؟\nاگر سابقه تولید داشته باشد، حذف ممکن نیست و باید غیرفعال شود.`
                                                        )
                                                    ) {
                                                        handleDeleteMachine(machine);
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
                                                {toPersianDigits(machine.std_production_per_hour)}
                                            </span>
                                        </div>
                                        <div className="rounded-xl bg-black/[0.03] px-3 py-2 dark:bg-white/[0.03]">
                                            <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                                <AlertTriangle size={11} />
                                                ضایعات در ساعت
                                            </span>
                                            <span className="mt-0.5 block text-[13px] font-extrabold text-red-500">
                                                {toPersianDigits(machine.std_waste_per_hour)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`rounded-lg border px-2 py-0.5 text-[10.5px] font-bold ${machine.is_active
                                                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                : "border-gray-400/30 bg-gray-400/10 text-gray-500 dark:text-gray-400"
                                                }`}
                                        >
                                            {machine.is_active ? "فعال" : "غیرفعال"}
                                        </span>
                                        <StatusSwitch
                                            isActive={machine.is_active}
                                            loading={togglingId === machine.id}
                                            disabled={togglingId !== null && togglingId !== machine.id}
                                            title={machine.is_active ? "غیرفعال‌سازی ماشین" : "فعال‌سازی ماشین"}
                                            onToggle={() => handleToggleActive(machine)}
                                        />
                                    </div>
                                </m.div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {activeTab === "logs" && (
                <section className="space-y-4">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                            <ClipboardList size={15} className="text-emerald-500" />
                            سوابق تولید ({toPersianDigits(filteredLogs.length)} از {toPersianDigits(logs.length)})
                        </h2>
                    </div>

                    <div className="rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                        <div className="mb-3 flex items-center gap-2 text-[11.5px] font-bold text-gray-500">
                            <Filter size={13} />
                            فیلترها
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
                            <JalaliDatePicker
                                label="از تاریخ"
                                value={filterDateFrom}
                                onChange={setFilterDateFrom}
                                placeholder="بدون محدودیت"
                            />
                            <JalaliDatePicker
                                label="تا تاریخ"
                                value={filterDateTo}
                                onChange={setFilterDateTo}
                                placeholder="بدون محدودیت"
                            />
                        </div>
                        {(filterEmployeeId !== null ||
                            filterMachineId !== null ||
                            filterDateFrom ||
                            filterDateTo) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFilterEmployeeId(null);
                                        setFilterMachineId(null);
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
                                    {pagedLogs.map((log) => {
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
                                            <td colSpan={10} className="py-12 text-center text-[12px] text-gray-400">
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

                    {filteredLogs.length > LOGS_PAGE_SIZE && (
                        <Pagination
                            page={logsPage}
                            totalPages={logsTotalPages}
                            onChange={setLogsPage}
                        />
                    )}
                </section>
            )}

            {activeTab === "monthly" && (
                <section className="space-y-4">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                            <CalendarDays size={15} className="text-indigo-500" />
                            گزارش ماهانه تولید
                        </h2>
                    </div>

                    <div className="rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <Field label="سال (شمسی)">
                                <input
                                    type="number"
                                    dir="ltr"
                                    min="1300"
                                    max="1600"
                                    value={reportYear}
                                    onChange={(e) => setReportYear(parseInt(e.target.value, 10) || currentJy)}
                                    className={`${INPUT_CLS} text-left font-mono`}
                                />
                            </Field>
                            <NiceSelect
                                label="ماه (شمسی)"
                                placeholder="انتخاب ماه"
                                emptyText="ماهی یافت نشد"
                                options={monthOptions}
                                value={reportMonth}
                                onChange={(id) => id !== null && setReportMonth(id)}
                            />
                            <NiceSelect
                                label="کارمند (اختیاری)"
                                placeholder="همه کارمندان"
                                emptyText="کارمندی یافت نشد"
                                options={employeeOptions}
                                value={reportEmployeeId}
                                onChange={setReportEmployeeId}
                            />
                        </div>
                    </div>

                    {monthlyError && <ErrorBanner message={monthlyError} onClose={() => setMonthlyError("")} />}

                    {monthlyLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 size={22} className="animate-spin text-indigo-500" />
                        </div>
                    ) : monthlyReport ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                                <StatCard
                                    label="کل ساعت کار"
                                    value={toPersianDigits(monthlyReport.totals.hours)}
                                    unit="ساعت"
                                    tone="indigo"
                                    icon={<CalendarDays size={16} />}
                                />
                                <StatCard
                                    label="کل تولید"
                                    value={toPersianDigits(monthlyReport.totals.produced.toLocaleString())}
                                    unit="عدد"
                                    tone="emerald"
                                    icon={<TrendingUp size={16} />}
                                />
                                <StatCard
                                    label="تولید انتظاری"
                                    value={toPersianDigits(Number(monthlyReport.totals.expected_production).toFixed(0))}
                                    unit="عدد"
                                    tone="indigo"
                                    icon={<Gauge size={16} />}
                                />
                                <StatCard
                                    label="کل ضایعات"
                                    value={toPersianDigits(monthlyReport.totals.waste.toLocaleString())}
                                    unit="عدد"
                                    tone="red"
                                    icon={<AlertTriangle size={16} />}
                                />
                                <StatCard
                                    label="ضایعات انتظاری"
                                    value={toPersianDigits(Number(monthlyReport.totals.expected_waste).toFixed(0))}
                                    unit="عدد"
                                    tone="amber"
                                    icon={<AlertTriangle size={16} />}
                                />
                                <StatCard
                                    label="راندمان"
                                    value={
                                        monthlyReport.totals.efficiency === null
                                            ? "—"
                                            : `${toPersianDigits(monthlyReport.totals.efficiency.toFixed(1))}٪`
                                    }
                                    tone="emerald"
                                    icon={<BarChart3 size={16} />}
                                />
                            </div>

                            <ProductionBarChart
                                title="تولید واقعی در برابر انتظاری (نیرو)"
                                subtitle="گزارش ماهانه به تفکیک کارمند"
                                data={monthlyReport.employees.map((e) => ({
                                    name: e.employee_name,
                                    a: Number(e.produced),
                                    b: Number(e.expected_production),
                                }))}
                                seriesA={{ label: "تولید واقعی", color: "#3b82f6" }}
                                seriesB={{ label: "تولید انتظاری", color: "#8b5cf6" }}
                            />

                            {monthlyReport.employees.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-[12px] text-gray-400 dark:border-white/[0.1]">
                                    در این ماه هیچ رکوردی ثبت نشده است.
                                </div>
                            ) : (
                                monthlyReport.employees.map((emp) => (
                                    <div
                                        key={emp.employee_id}
                                        className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.06] dark:bg-white/[0.02]"
                                    >
                                        <div className="flex items-center justify-between border-b border-black/5 bg-gray-50 px-4 py-3 dark:border-white/5 dark:bg-white/[0.03]">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-[13px] font-extrabold text-white ${gradientOf(
                                                        emp.employee_id
                                                    )}`}
                                                >
                                                    {initialOf(emp.employee_name)}
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                                                        {emp.employee_name}
                                                    </p>
                                                    <p className="text-[10.5px] text-gray-400">
                                                        {toPersianDigits(emp.hours)} ساعت · راندمان{" "}
                                                        {emp.efficiency === null
                                                            ? "—"
                                                            : `${toPersianDigits(emp.efficiency.toFixed(1))}٪`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {emp.machines.map((mch) => (
                                            <div
                                                key={mch.machine_id}
                                                className="border-b border-black/5 p-4 last:border-b-0 dark:border-white/5"
                                            >
                                                <div className="mb-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Factory size={13} className="text-indigo-500" />
                                                        <span className="text-[12px] font-extrabold text-gray-800 dark:text-gray-100">
                                                            {mch.machine_name}
                                                        </span>
                                                        <span className="font-mono text-[10px] text-gray-400">
                                                            ({mch.machine_code})
                                                        </span>
                                                    </div>
                                                    <span className="text-[10.5px] font-bold text-gray-500">
                                                        {toPersianDigits(mch.hours)} ساعت · راندمان{" "}
                                                        {mch.efficiency === null
                                                            ? "—"
                                                            : `${toPersianDigits(mch.efficiency.toFixed(1))}٪`}
                                                    </span>
                                                </div>

                                                <div className="overflow-x-auto">
                                                    <table className="w-full border-collapse text-right text-[11.5px]">
                                                        <thead>
                                                            <tr className="border-b border-black/5 text-[10.5px] text-gray-400 dark:border-white/5">
                                                                {[
                                                                    "تاریخ",
                                                                    "ساعت",
                                                                    "تولید",
                                                                    "انتظاری",
                                                                    "ضایعات",
                                                                    "انتظاری",
                                                                    "راندمان",
                                                                    "توضیحات",
                                                                ].map((h, i) => (
                                                                    <th key={i} className="whitespace-nowrap px-2 py-2 font-bold">
                                                                        {h}
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                                            {mch.days.map((d) => (
                                                                <tr
                                                                    key={d.log_id}
                                                                    className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                                                                >
                                                                    <td className="whitespace-nowrap px-2 py-2 text-gray-500 dark:text-gray-400">
                                                                        {toPersianDigits(d.jalali_date)}
                                                                    </td>
                                                                    <td className="whitespace-nowrap px-2 py-2 text-gray-500">
                                                                        {toPersianDigits(d.hours)}
                                                                    </td>
                                                                    <td className="px-2 py-2 font-bold text-emerald-600 dark:text-emerald-400">
                                                                        {toPersianDigits(d.produced.toLocaleString())}
                                                                    </td>
                                                                    <td className="px-2 py-2 text-gray-400">
                                                                        {toPersianDigits(Number(d.expected_production).toFixed(0))}
                                                                    </td>
                                                                    <td className="px-2 py-2 font-bold text-red-500">
                                                                        {toPersianDigits(d.waste)}
                                                                    </td>
                                                                    <td className="px-2 py-2 text-gray-400">
                                                                        {toPersianDigits(Number(d.expected_waste).toFixed(0))}
                                                                    </td>
                                                                    <td className="px-2 py-2">
                                                                        <EfficiencyBadge value={d.efficiency} />
                                                                    </td>
                                                                    <td className="px-2 py-2 text-gray-400">
                                                                        {d.note || "—"}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                    ) : null}
                </section>
            )}

            {activeTab === "machineSummary" && (
                <section className="space-y-4">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                            <LineChart size={15} className="text-indigo-500" />
                            روند تولید ماشین
                        </h2>
                    </div>

                    <div className="rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                            <JalaliDatePicker
                                label="از تاریخ"
                                value={summaryDateFrom}
                                onChange={setSummaryDateFrom}
                                required
                            />
                            <JalaliDatePicker
                                label="تا تاریخ"
                                value={summaryDateTo}
                                onChange={setSummaryDateTo}
                                required
                            />
                            <NiceSelect
                                label="ماشین (اختیاری)"
                                placeholder="همه ماشین‌ها"
                                emptyText="ماشینی یافت نشد"
                                options={machineOptions}
                                value={summaryMachineId}
                                onChange={setSummaryMachineId}
                            />
                            <NiceSelect
                                label="گروه‌بندی"
                                placeholder="انتخاب گروه‌بندی"
                                emptyText="گزینه‌ای یافت نشد"
                                options={groupByOptions}
                                value={summaryGroupBy}
                                onChange={setSummaryGroupBy}
                            />
                        </div>
                    </div>

                    {summaryError && <ErrorBanner message={summaryError} onClose={() => setSummaryError("")} />}

                    {summaryLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 size={22} className="animate-spin text-indigo-500" />
                        </div>
                    ) : summaryReport ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                                <StatCard
                                    label="کل ساعت کار"
                                    value={toPersianDigits(summaryReport.totals.hours)}
                                    unit="ساعت"
                                    tone="indigo"
                                    icon={<CalendarDays size={16} />}
                                />
                                <StatCard
                                    label="کل تولید"
                                    value={toPersianDigits(summaryReport.totals.produced.toLocaleString())}
                                    unit="عدد"
                                    tone="emerald"
                                    icon={<TrendingUp size={16} />}
                                />
                                <StatCard
                                    label="تولید انتظاری"
                                    value={toPersianDigits(Number(summaryReport.totals.expected_production).toFixed(0))}
                                    unit="عدد"
                                    tone="indigo"
                                    icon={<Gauge size={16} />}
                                />
                                <StatCard
                                    label="کل ضایعات"
                                    value={toPersianDigits(summaryReport.totals.waste.toLocaleString())}
                                    unit="عدد"
                                    tone="red"
                                    icon={<AlertTriangle size={16} />}
                                />
                                <StatCard
                                    label="ضایعات انتظاری"
                                    value={toPersianDigits(Number(summaryReport.totals.expected_waste).toFixed(0))}
                                    unit="عدد"
                                    tone="amber"
                                    icon={<AlertTriangle size={16} />}
                                />
                                <StatCard
                                    label="راندمان"
                                    value={
                                        summaryReport.totals.efficiency === null
                                            ? "—"
                                            : `${toPersianDigits(summaryReport.totals.efficiency.toFixed(1))}٪`
                                    }
                                    tone="emerald"
                                    icon={<BarChart3 size={16} />}
                                />
                            </div>

                            <ProductionBarChart
                                tabs={[{ id: 0, label: "روز" }, { id: 1, label: "هفته" }, { id: 2, label: "ماه" }, { id: 3, label: "سال" }]}
                                activeTab={summaryGroupBy}
                                onTab={setSummaryGroupBy}
                                title="روند تولید واقعی و انتظاری"
                                subtitle="مجموع همه ماشین‌ها در هر دوره"
                                data={(() => {
                                    const map = new Map<string, { name: string; a: number; b: number }>();
                                    summaryReport.machines.forEach((m) =>
                                        m.periods.forEach((p) => {
                                            const cur = map.get(p.key) ?? { name: p.label, a: 0, b: 0 };
                                            cur.a += Number(p.produced);
                                            cur.b += Number(p.expected_production);
                                            map.set(p.key, cur);
                                        }),
                                    );
                                    return Array.from(map.values());
                                })()}
                                seriesA={{ label: "تولید واقعی", color: "#3b82f6" }}
                                seriesB={{ label: "تولید انتظاری", color: "#a66cff" }}
                            />

                            {summaryReport.machines.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-[12px] text-gray-400 dark:border-white/[0.1]">
                                    در این بازه هیچ رکوردی ثبت نشده است.
                                </div>
                            ) : (
                                summaryReport.machines.map((mch) => (
                                    <div
                                        key={mch.machine_id}
                                        className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.06] dark:bg-white/[0.02]"
                                    >
                                        <div className="flex items-center justify-between border-b border-black/5 bg-gray-50 px-4 py-3 dark:border-white/5 dark:bg-white/[0.03]">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-[13px] font-extrabold text-white ${gradientOf(
                                                        mch.machine_id
                                                    )}`}
                                                >
                                                    {initialOf(mch.machine_name)}
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                                                        {mch.machine_name}
                                                    </p>
                                                    <p className="font-mono text-[10.5px] text-gray-400">
                                                        {mch.machine_code}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[10.5px] font-bold text-gray-500">
                                                {toPersianDigits(mch.hours)} ساعت · راندمان{" "}
                                                {mch.efficiency === null
                                                    ? "—"
                                                    : `${toPersianDigits(mch.efficiency.toFixed(1))}٪`}
                                            </span>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse text-right text-[11.5px]">
                                                <thead>
                                                    <tr className="border-b border-black/5 text-[10.5px] text-gray-400 dark:border-white/5">
                                                        {[
                                                            "بازه",
                                                            "ساعت",
                                                            "تولید",
                                                            "انتظاری",
                                                            "ضایعات",
                                                            "انتظاری",
                                                            "راندمان",
                                                        ].map((h, i) => (
                                                            <th key={i} className="whitespace-nowrap px-3 py-2 font-bold">
                                                                {h}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                                    {mch.periods.map((p) => (
                                                        <tr
                                                            key={p.key}
                                                            className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                                                        >
                                                            <td className="whitespace-nowrap px-3 py-2 font-bold text-gray-700 dark:text-gray-200">
                                                                {toPersianDigits(p.label)}
                                                            </td>
                                                            <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                                                                {toPersianDigits(p.hours)}
                                                            </td>
                                                            <td className="px-3 py-2 font-bold text-emerald-600 dark:text-emerald-400">
                                                                {toPersianDigits(p.produced.toLocaleString())}
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-400">
                                                                {toPersianDigits(Number(p.expected_production).toFixed(0))}
                                                            </td>
                                                            <td className="px-3 py-2 font-bold text-red-500">
                                                                {toPersianDigits(p.waste)}
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-400">
                                                                {toPersianDigits(Number(p.expected_waste).toFixed(0))}
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <EfficiencyBadge value={p.efficiency} />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : null}
                </section>
            )}

            {activeTab === "machineMonthly" && (
                <section className="space-y-4">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                            <Users size={15} className="text-indigo-500" />
                            گزارش ماهانه ماشین‌ها
                        </h2>
                    </div>

                    <div className="rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <Field label="سال (شمسی)">
                                <input
                                    type="number"
                                    dir="ltr"
                                    min="1300"
                                    max="1600"
                                    value={reportYear}
                                    onChange={(e) => setReportYear(parseInt(e.target.value, 10) || currentJy)}
                                    className={`${INPUT_CLS} text-left font-mono`}
                                />
                            </Field>
                            <NiceSelect
                                label="ماه (شمسی)"
                                placeholder="انتخاب ماه"
                                emptyText="ماهی یافت نشد"
                                options={monthOptions}
                                value={reportMonth}
                                onChange={(id) => id !== null && setReportMonth(id)}
                            />
                        </div>
                    </div>

                    {machineMonthlyError && (
                        <ErrorBanner message={machineMonthlyError} onClose={() => setMachineMonthlyError("")} />
                    )}

                    {machineMonthlyLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 size={22} className="animate-spin text-indigo-500" />
                        </div>
                    ) : machineMonthlyReport ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                                <StatCard
                                    label="کل ساعت کار"
                                    value={toPersianDigits(machineMonthlyReport.totals.hours)}
                                    unit="ساعت"
                                    tone="indigo"
                                    icon={<CalendarDays size={16} />}
                                />
                                <StatCard
                                    label="کل تولید"
                                    value={toPersianDigits(machineMonthlyReport.totals.produced.toLocaleString())}
                                    unit="عدد"
                                    tone="emerald"
                                    icon={<TrendingUp size={16} />}
                                />
                                <StatCard
                                    label="تولید انتظاری"
                                    value={toPersianDigits(
                                        Number(machineMonthlyReport.totals.expected_production).toFixed(0)
                                    )}
                                    unit="عدد"
                                    tone="indigo"
                                    icon={<Gauge size={16} />}
                                />
                                <StatCard
                                    label="کل ضایعات"
                                    value={toPersianDigits(machineMonthlyReport.totals.waste.toLocaleString())}
                                    unit="عدد"
                                    tone="red"
                                    icon={<AlertTriangle size={16} />}
                                />
                                <StatCard
                                    label="ضایعات انتظاری"
                                    value={toPersianDigits(
                                        Number(machineMonthlyReport.totals.expected_waste).toFixed(0)
                                    )}
                                    unit="عدد"
                                    tone="amber"
                                    icon={<AlertTriangle size={16} />}
                                />
                                <StatCard
                                    label="راندمان"
                                    value={
                                        machineMonthlyReport.totals.efficiency === null
                                            ? "—"
                                            : `${toPersianDigits(machineMonthlyReport.totals.efficiency.toFixed(1))}٪`
                                    }
                                    tone="emerald"
                                    icon={<BarChart3 size={16} />}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                <ProductionBarChart
                                    title="تولید ماهانه ماشین‌ها"
                                    subtitle="واقعی در برابر انتظاری"
                                    data={machineMonthlyReport.machines.map((m) => ({
                                        name: m.machine_name,
                                        a: Number(m.produced),
                                        b: Number(m.expected_production),
                                    }))}
                                    seriesA={{ label: "تولید واقعی", color: "#3b82f6" }}
                                    seriesB={{ label: "تولید انتظاری", color: "#8b5cf6" }}
                                />
                                <ProductionBarChart
                                    title="انحراف از مقدار انتظاری"
                                    subtitle="تفاوت تولید و ضایعات با مقدار انتظاری (واقعی − انتظاری)"
                                    signed
                                    data={machineMonthlyReport.machines.map((m) => ({
                                        name: m.machine_name,
                                        a: Number((Number(m.produced) - Number(m.expected_production)).toFixed(1)),
                                        b: Number((Number(m.waste) - Number(m.expected_waste)).toFixed(1)),
                                    }))}
                                    seriesA={{ label: "انحراف تولید", color: "#3b82f6" }}
                                    seriesB={{ label: "انحراف ضایعات", color: "#8b5cf6" }}
                                />
                            </div>

                            {machineMonthlyReport.machines.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-[12px] text-gray-400 dark:border-white/[0.1]">
                                    ماشینی در این ماه ثبت نشده است.
                                </div>
                            ) : (
                                machineMonthlyReport.machines.map((mch) => (
                                    <div
                                        key={mch.machine_id}
                                        className={`overflow-hidden rounded-2xl border bg-white dark:bg-white/[0.02] ${mch.is_active
                                            ? "border-black/[0.06] dark:border-white/[0.06]"
                                            : "border-gray-300/40 opacity-75 dark:border-white/[0.08]"
                                            }`}
                                    >
                                        <div className="flex flex-col gap-2 border-b border-black/5 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/5 dark:bg-white/[0.03]">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-[13px] font-extrabold text-white ${gradientOf(
                                                        mch.machine_id
                                                    )}`}
                                                >
                                                    {initialOf(mch.machine_name)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                                                            {mch.machine_name}
                                                        </p>
                                                        <span
                                                            className={`rounded-md border px-1.5 py-0.5 text-[9.5px] font-bold ${mch.is_active
                                                                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                                : "border-gray-400/30 bg-gray-400/10 text-gray-500 dark:text-gray-400"
                                                                }`}
                                                        >
                                                            {mch.is_active ? "فعال" : "غیرفعال"}
                                                        </span>
                                                    </div>
                                                    <p className="font-mono text-[10.5px] text-gray-400">
                                                        {mch.machine_code} · {toPersianDigits(mch.days_worked)} روز کار
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[10.5px] font-bold text-gray-500">
                                                {toPersianDigits(mch.hours)} ساعت · راندمان{" "}
                                                {mch.efficiency === null
                                                    ? "—"
                                                    : `${toPersianDigits(mch.efficiency.toFixed(1))}٪`}
                                            </span>
                                        </div>

                                        {mch.operators.length === 0 ? (
                                            <div className="px-4 py-6 text-center text-[11.5px] text-gray-400">
                                                در این ماه اپراتوری روی این ماشین کار نکرده است.
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse text-right text-[11.5px]">
                                                    <thead>
                                                        <tr className="border-b border-black/5 text-[10.5px] text-gray-400 dark:border-white/5">
                                                            {[
                                                                "اپراتور",
                                                                "ساعت",
                                                                "تولید",
                                                                "انتظاری",
                                                                "ضایعات",
                                                                "انتظاری",
                                                                "راندمان",
                                                            ].map((h, i) => (
                                                                <th key={i} className="whitespace-nowrap px-3 py-2 font-bold">
                                                                    {h}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                                        {mch.operators.map((op) => (
                                                            <tr
                                                                key={op.employee_id}
                                                                className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                                                            >
                                                                <td className="whitespace-nowrap px-3 py-2 font-extrabold text-gray-800 dark:text-gray-100">
                                                                    {op.employee_name}
                                                                </td>
                                                                <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                                                                    {toPersianDigits(op.hours)}
                                                                </td>
                                                                <td className="px-3 py-2 font-bold text-emerald-600 dark:text-emerald-400">
                                                                    {toPersianDigits(op.produced.toLocaleString())}
                                                                </td>
                                                                <td className="px-3 py-2 text-gray-400">
                                                                    {toPersianDigits(Number(op.expected_production).toFixed(0))}
                                                                </td>
                                                                <td className="px-3 py-2 font-bold text-red-500">
                                                                    {toPersianDigits(op.waste)}
                                                                </td>
                                                                <td className="px-3 py-2 text-gray-400">
                                                                    {toPersianDigits(Number(op.expected_waste).toFixed(0))}
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    <EfficiencyBadge value={op.efficiency} />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    ) : null}
                </section>
            )}

            <AnimatePresence>
                {machineModal.open && (
                    <MachineModal
                        key={machineModal.machine?.id ?? "new"}
                        machine={machineModal.machine}
                        onClose={() => setMachineModal({ open: false, machine: null })}
                        onSaved={() => {
                            setMachineModal({ open: false, machine: null });
                            fetchData();
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showLogModal && (
                    <LogModal
                        key="log-modal"
                        machines={machines}
                        onClose={() => setShowLogModal(false)}
                        onSaved={() => {
                            setShowLogModal(false);
                            fetchData();
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {logToDelete && (
                    <ConfirmDeleteLog
                        key="delete-log"
                        log={logToDelete}
                        onClose={() => setLogToDelete(null)}
                        onDeleted={() => {
                            setLogToDelete(null);
                            fetchData();
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {logToView && (
                    <ViewNoteModal
                        key="view-log-note"
                        log={logToView}
                        onClose={() => setLogToView(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}