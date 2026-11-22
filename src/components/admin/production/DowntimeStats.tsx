"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock, Gauge, Hash, Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import ProductionBarChart from "@/components/charts/ProductionBarChart";
import { toPersianDigits } from "@/lib/jalali";
import { formatProductionHours, formatProductionInteger, formatProductionPercent } from "@/lib/productionFormat";
import { ErrorBanner, StatCard, parseBackendError } from "./shared";
import BreakdownCauseRows from "./BreakdownCauseRows";
import { PriorityBadge, priorityMap } from "./priority";
import { SortableTable } from "./sorting";
import type { Col } from "./sorting";
import type { DowntimeMachine, DowntimePeriod, DowntimeReport, GroupBy, HighlightsReport } from "./reportTypes";

const GROUP_LABEL: Record<GroupBy, string> = { day: "روز", week: "هفته", month: "ماه", year: "سال" };
const pct = (v: number | null) => (v == null ? "—" : `${formatProductionPercent(v)}٪`);

export default function DowntimeStats({
    dateFrom,
    dateTo,
    machineId,
    groupBy,
}: {
    dateFrom: string;
    dateTo: string;
    machineId: number | null;
    groupBy: GroupBy;
}) {
    const [dt, setDt] = useState<DowntimeReport | null>(null);
    const [hl, setHl] = useState<HighlightsReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!dateFrom || !dateTo) return;
        let alive = true;
        setLoading(true);
        setError("");
        const base: Record<string, string> = { date_from: dateFrom, date_to: dateTo };
        if (machineId !== null) base.machine_id = String(machineId);
        Promise.all([
            axiosInstance.get("/production/api/v1/report/downtime/", { params: { ...base, group_by: groupBy } }),
            axiosInstance.get("/production/api/v1/report/highlights/", { params: base }),
        ])
            .then(([a, b]) => {
                if (!alive) return;
                setDt(a.data as DowntimeReport);
                setHl(b.data as HighlightsReport);
            })
            .catch((e) => {
                if (!alive) return;
                setDt(null);
                setHl(null);
                setError(parseBackendError(e, "دریافت آمار توقف دستگاه با خطا مواجه شد"));
            })
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, [dateFrom, dateTo, machineId, groupBy]);

    const priorities = useMemo(
        () => priorityMap(dt?.machines ?? [], (m) => m.downtime_minutes),
        [dt],
    );

    const periodCols: Col<DowntimePeriod>[] = [
        { key: "period", label: GROUP_LABEL[groupBy], get: (p) => p.key, render: (p) => toPersianDigits(p.label), tdClass: "font-bold text-gray-700 dark:text-gray-200" },
        { key: "hours", label: "ساعت کار", get: (p) => p.hours, firstDir: "desc", render: (p) => formatProductionHours(p.hours) },
        { key: "minutes", label: "توقف (دقیقه)", get: (p) => p.downtime_minutes, firstDir: "desc", tdClass: "font-bold text-red-500", render: (p) => formatProductionInteger(p.downtime_minutes) },
        { key: "dhours", label: "توقف (ساعت)", get: (p) => p.downtime_hours, firstDir: "desc", render: (p) => formatProductionHours(p.downtime_hours) },
        { key: "percent", label: "درصد توقف", get: (p) => p.downtime_percent, firstDir: "desc", render: (p) => pct(p.downtime_percent) },
        { key: "events", label: "دفعات توقف", get: (p) => p.events, firstDir: "desc", render: (p) => formatProductionInteger(p.events) },
    ];

    const machineCols: Col<DowntimeMachine>[] = [
        {
            key: "priority",
            label: "اولویت",
            // اولویت ۱ اول؛ دستگاه بدون توقف (بدون اولویت) آخر
            get: (m) => priorities.get(m.machine_id)?.rank ?? null,
            render: (m) => <PriorityBadge info={priorities.get(m.machine_id)} />,
        },
        {
            key: "machine",
            label: "دستگاه",
            get: (m) => m.machine_name,
            tdClass: "font-bold text-gray-800 dark:text-gray-100",
            render: (m) => (
                <>
                    {m.machine_name} <span className="font-mono text-[10px] font-medium text-gray-400">({m.machine_code})</span>
                </>
            ),
        },
        { key: "hours", label: "ساعت کار", get: (m) => m.hours, firstDir: "desc", render: (m) => formatProductionHours(m.hours) },
        { key: "minutes", label: "توقف (دقیقه)", get: (m) => m.downtime_minutes, firstDir: "desc", tdClass: "font-bold text-red-500", render: (m) => formatProductionInteger(m.downtime_minutes) },
        { key: "dhours", label: "توقف (ساعت)", get: (m) => m.downtime_hours, firstDir: "desc", render: (m) => formatProductionHours(m.downtime_hours) },
        { key: "percent", label: "درصد توقف", get: (m) => m.downtime_percent, firstDir: "desc", render: (m) => pct(m.downtime_percent) },
        { key: "events", label: "دفعات توقف", get: (m) => m.events, firstDir: "desc", render: (m) => formatProductionInteger(m.events) },
    ];

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 size={22} className="animate-spin text-indigo-500" />
            </div>
        );
    }
    if (error) return <ErrorBanner message={error} onClose={() => setError("")} />;
    if (!dt) return null;

    const t = dt.totals;

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="کل زمان توقف" value={formatProductionHours(t.downtime_hours)} tone="red" icon={<AlertTriangle size={16} />} />
                <StatCard label="درصد توقف از ساعت کار" value={pct(t.downtime_percent)} tone="amber" icon={<Gauge size={16} />} />
                <StatCard label="دفعات توقف" value={formatProductionInteger(t.events)} unit="بار" tone="indigo" icon={<Hash size={16} />} />
                <StatCard label="ساعت کار ثبت‌شده" value={formatProductionHours(t.hours)} tone="emerald" icon={<Clock size={16} />} />
            </div>

            <ProductionBarChart
                allLabels
                title={`روند توقف دستگاه (${GROUP_LABEL[groupBy]}انه)`}
                subtitle="مجموع دقیقه‌ی توقف در هر دوره"
                data={dt.periods.map((p) => ({ name: toPersianDigits(p.label), a: p.downtime_minutes, b: 0 }))}
                seriesA={{ label: "توقف (دقیقه)", color: "#f59e0b" }}
                seriesB={{ label: "—", color: "#9ca3af" }}
            />

            <div className="space-y-2">
                <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">آمار توقف به تفکیک {GROUP_LABEL[groupBy]}</h3>
                <SortableTable
                    rows={dt.periods}
                    columns={periodCols}
                    rowKey={(p) => p.key}
                    initialSort={{ key: "period", dir: "asc" }}
                    minWidth={620}
                    empty="در این بازه ثبتی وجود ندارد."
                />
            </div>

            <div className="space-y-2">
                <div>
                    <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">آمار توقف به تفکیک دستگاه و اولویت</h3>
                    <p className="mt-1 text-[10.5px] text-gray-400">
                        اولویت ۱ = دستگاهی که بیشترین توقف را داشته و باید زودتر بررسی شود؛ یک‌سوم اول «بالا»، یک‌سوم دوم «متوسط» و بقیه «پایین».
                    </p>
                </div>
                {dt.machines.length > 1 && (
                    <ProductionBarChart
                        allLabels
                        title="توقف به تفکیک دستگاه"
                        subtitle="مجموع دقیقه‌ی توقف در بازه"
                        data={dt.machines.map((m) => ({ name: m.machine_name, a: m.downtime_minutes, b: 0 }))}
                        seriesA={{ label: "توقف (دقیقه)", color: "#ef4444" }}
                        seriesB={{ label: "—", color: "#9ca3af" }}
                    />
                )}
                <SortableTable
                    rows={dt.machines}
                    columns={machineCols}
                    rowKey={(m) => m.machine_id}
                    initialSort={{ key: "minutes", dir: "desc" }}
                    minWidth={760}
                    empty="در این بازه ثبتی وجود ندارد."
                />
            </div>

            {hl && (
                <BreakdownCauseRows
                    causes={hl.breakdown.causes}
                    byMachine={hl.breakdown.by_machine}
                    totalMinutes={hl.breakdown.total_minutes}
                />
            )}
        </div>
    );
}
