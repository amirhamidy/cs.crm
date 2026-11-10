"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    CalendarClock,
    Check,
    ClipboardList,
    Clock3,
    Coins,
    Layers3,
    Package,
    Phone,
    RotateCcw,
    Shuffle,
    TrendingUp,
    Workflow,
} from "lucide-react";
import { DetailSkeleton } from "../../ui/skeletons";
import { casesApi } from "@/lib/api/cases";
import { apiMessage } from "@/lib/apiMessage";
import type { CaseReport, CaseReportTask } from "@/types/caseReport";

const dateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    dateStyle: "medium",
    timeStyle: "short",
});

export function formatDate(value: string | null | undefined): string {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return dateFormatter.format(date);
}

export function formatNumber(value: number | null | undefined): string {
    return (value ?? 0).toLocaleString("fa-IR");
}

export function formatDuration(totalSeconds: number): string {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const parts: string[] = [];
    if (days) parts.push(`${formatNumber(days)} روز`);
    if (hours) parts.push(`${formatNumber(hours)} ساعت`);
    if (!days && minutes) parts.push(`${formatNumber(minutes)} دقیقه`);
    return parts.length > 0 ? parts.join(" و ") : "کمتر از یک دقیقه";
}

type Tone = { color: string; bg: string };

const STATUS_TONES: Record<string, Tone> = {
    completed: { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
    cancelled: { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    in_progress: { color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
};

const DEFAULT_TONE: Tone = { color: "#9ca3af", bg: "rgba(148,163,184,0.12)" };

function getTone(status: string): Tone {
    return STATUS_TONES[status] ?? DEFAULT_TONE;
}

export function useCaseReport(caseId: number) {
    const [report, setReport] = useState<CaseReport | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError("");
        casesApi
            .report(caseId, controller.signal)
            .then(setReport)
            .catch((err: unknown) => {
                if (controller.signal.aborted) return;
                setError(apiMessage(err, "دریافت گزارش پرونده ناموفق بود"));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [caseId]);

    return { report, error, loading };
}

function StatusPill({ status, label }: { status: string; label: string }) {
    const tone = getTone(status);
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
            style={{ background: tone.bg, color: tone.color }}
        >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone.color }} />
            {label}
        </span>
    );
}

function Chip({
    icon,
    label,
    tone = "gray",
}: {
    icon?: ReactNode;
    label: ReactNode;
    tone?: "gray" | "indigo";
}) {
    const tones = {
        gray: "bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-300",
        indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
    };
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10.5px] font-bold ${tones[tone]}`}>
            {icon}
            {label}
        </span>
    );
}

function SectionHeader({ icon, title, count }: { icon: ReactNode; title: string; count?: number }) {
    return (
        <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                    {icon}
                </div>
                <h3 className="text-[13px] font-extrabold text-gray-800 dark:text-gray-100">{title}</h3>
            </div>
            {typeof count === "number" && (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10.5px] font-bold text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                    {formatNumber(count)}
                </span>
            )}
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 py-10 text-gray-400 dark:border-white/10">
            <ClipboardList size={22} />
            <span className="text-[11.5px]">{text}</span>
        </div>
    );
}

function ProgressRing({ percent }: { percent: number }) {
    const radius = 26;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    return (
        <div className="relative h-16 w-16 shrink-0">
            <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
                <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="6" className="stroke-gray-200 dark:stroke-white/10" />
                <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    fill="none"
                    strokeWidth="6"
                    strokeLinecap="round"
                    stroke="url(#case-ring)"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 0.8s ease" }}
                />
                <defs>
                    <linearGradient id="case-ring" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[12px] font-black text-gray-900 dark:text-white">
                {formatNumber(percent)}٪
            </div>
        </div>
    );
}

function Hero({ report }: { report: CaseReport }) {
    const { customer, tasks } = report;
    const done = tasks.filter((t) => t.status === "completed").length;
    const percent = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    const initial = customer.full_name?.trim().charAt(0) || "؟";

    return (
        <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-l from-indigo-500/[0.08] via-violet-500/[0.04] to-transparent p-4 dark:border-white/[0.06]">
            <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="relative flex items-center gap-3.5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-[18px] font-black text-white shadow-lg shadow-indigo-500/25">
                    {initial}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-black text-gray-900 dark:text-white">
                        {customer.full_name}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {customer.company_name && <Chip icon={<Building2 size={10} />} label={customer.company_name} />}
                        {customer.phone_number && <Chip icon={<Phone size={10} />} label={customer.phone_number} />}
                        {customer.status_display && <Chip label={customer.status_display} tone="indigo" />}
                    </div>
                </div>
                {/* <div className="flex flex-col items-center gap-1">
                    <ProgressRing percent={percent} />
                    <span className="text-[9.5px] font-bold text-gray-500 dark:text-gray-400">پیشرفت پرونده</span>
                </div> */}
            </div>
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
    color,
}: {
    icon: ReactNode;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-3.5 transition-shadow hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.02]">
            <div
                className="absolute inset-x-0 top-0 h-0.5"
                style={{ background: `linear-gradient(90deg, ${color}, ${color}22)` }}
            />
            <div
                className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: `${color}1a`, color }}
            >
                {icon}
            </div>
            <div className="text-[10.5px] font-semibold text-gray-500 dark:text-gray-400">{label}</div>
            <div className="mt-0.5 text-[14px] font-black text-gray-900 dark:text-white">{value}</div>
        </div>
    );
}

function Stats({ report }: { report: CaseReport }) {
    const { summary } = report;
    return (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <StatCard icon={<Workflow size={15} />} label="وظایف" value={formatNumber(summary.tasks_count)} color="#6366f1" />
            <StatCard icon={<Package size={15} />} label="سفارش‌ها" value={formatNumber(summary.order_tasks_count)} color="#0ea5e9" />
            <StatCard icon={<Clock3 size={15} />} label="مدت کل" value={formatDuration(summary.total_duration_seconds)} color="#f59e0b" />
            <StatCard icon={<Coins size={15} />} label="مبلغ کل" value={formatNumber(summary.total_order_amount)} color="#10b981" />
        </div>
    );
}

function CountCell({ icon, label, value, color }: { icon: ReactNode; label: string; value: number; color: string }) {
    return (
        <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-2.5 py-2 dark:bg-white/[0.04]">
            <span
                className="flex h-6 w-6 items-center justify-center rounded-lg"
                style={{ background: `${color}1a`, color }}
            >
                {icon}
            </span>
            <div className="leading-tight">
                <div className="text-[13px] font-black tabular-nums text-gray-900 dark:text-white">{formatNumber(value)}</div>
                <div className="text-[9.5px] font-semibold text-gray-500 dark:text-gray-400">{label}</div>
            </div>
        </div>
    );
}

function AvatarStack({ names }: { names: string[] }) {
    const visible = names.slice(0, 4);
    const rest = names.length - visible.length;
    return (
        <div className="flex items-center">
            {visible.map((name, i) => (
                <span
                    key={`${name}-${i}`}
                    title={name}
                    className="-ml-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-indigo-400 to-violet-500 text-[10px] font-black text-white first:ml-0 dark:border-[#16181d]"
                >
                    {name.trim().charAt(0)}
                </span>
            ))}
            {rest > 0 && (
                <span className="-ml-2 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-gray-200 px-1 text-[9.5px] font-black text-gray-600 dark:border-[#16181d] dark:bg-white/10 dark:text-gray-300">
                    +{formatNumber(rest)}
                </span>
            )}
        </div>
    );
}

function CardShell({ status, children }: { status: string; children: ReactNode }) {
    const tone = getTone(status);
    return (
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 pr-5 transition-shadow hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.02]">
            <div
                className="absolute right-0 top-0 h-full w-1.5"
                style={{ background: `linear-gradient(180deg, ${tone.color}, ${tone.color}33)` }}
            />
            {children}
        </div>
    );
}

function TaskCard({ task }: { task: CaseReportTask }) {
    const names = task.assigned_employees.map((e) => e.full_name);
    return (
        <CardShell status={task.status}>
            <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="text-[13.5px] font-extrabold text-gray-900 dark:text-white">{task.title}</span>
                <StatusPill status={task.status} label={task.status_display} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Chip icon={<Layers3 size={10} />} label={task.department?.name ?? "بدون دپارتمان"} />
                <ArrowLeft size={12} className="text-gray-300 dark:text-gray-600" />
                <Chip label={task.current_step?.name ?? "—"} tone="indigo" />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
                <CountCell icon={<TrendingUp size={12} />} label="پیشروی" value={task.counts.advanced} color="#6366f1" />
                <CountCell icon={<RotateCcw size={12} />} label="بازگشت" value={task.counts.reverted} color="#8b5cf6" />
                <CountCell icon={<Shuffle size={12} />} label="انتقال" value={task.counts.transferred} color="#f59e0b" />
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 dark:border-white/[0.06]">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    <Clock3 size={11} />
                    {formatDuration(task.duration_seconds)}
                </span>
                {names.length > 0 && <AvatarStack names={names} />}
            </div>
        </CardShell>
    );
}

function OrderCard({ order }: { order: CaseReport["order_tasks"][number] }) {
    const tone = getTone(order.status);
    return (
        <CardShell status={order.status}>
            <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="text-[13.5px] font-extrabold text-gray-900 dark:text-white">
                    {order.warehouse?.name ?? order.title}
                </span>
                <StatusPill status={order.status} label={order.status_display} />
            </div>

            <div className="mt-3 space-y-3">
                {order.items.map((item) => {
                    const ratio = item.quantity ? Math.min((item.completed_quantity / item.quantity) * 100, 100) : 0;
                    return (
                        <div key={item.id}>
                            <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                                <span className="truncate font-semibold text-gray-700 dark:text-gray-200">
                                    {item.product_name}
                                </span>
                                <span className="flex shrink-0 items-center gap-1 font-bold tabular-nums text-gray-500 dark:text-gray-400">
                                    {ratio >= 100 && <Check size={11} className="text-emerald-500" />}
                                    {formatNumber(item.completed_quantity)} / {formatNumber(item.quantity)}
                                </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${ratio}%`,
                                        background: `linear-gradient(90deg, ${tone.color}, ${tone.color}99)`,
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-[11px] dark:bg-white/[0.04]">
                <span className="flex items-center gap-1.5 font-semibold text-gray-500 dark:text-gray-400">
                    <Coins size={11} />
                    جمع کل
                </span>
                <span className="font-black tabular-nums text-gray-900 dark:text-white">
                    {formatNumber(order.total_amount)}
                </span>
            </div>
        </CardShell>
    );
}

function TimelineItem({ event, isLast }: { event: CaseReport["timeline"][number]; isLast: boolean }) {
    return (
        <li className="relative flex gap-3">
            <div className="flex flex-col items-center">
                <span className="relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full bg-indigo-500 ring-4 ring-indigo-500/15" />
                {!isLast && <span className="mt-1 w-px flex-1 bg-gradient-to-b from-indigo-500/40 to-transparent" />}
            </div>
            <div className="min-w-0 flex-1 pb-5">
                <div className="rounded-2xl border border-gray-100 bg-white p-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[12.5px] font-extrabold text-gray-900 dark:text-white">{event.title}</span>
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-400">
                            <CalendarClock size={10} />
                            {formatDate(event.at)}
                        </span>
                    </div>
                    {event.detail && (
                        <p className="mt-1 text-[11px] leading-6 text-gray-600 dark:text-gray-300">{event.detail}</p>
                    )}
                    {event.note && (
                        <div className="mt-2 rounded-xl border border-indigo-500/15 bg-indigo-500/[0.06] px-3 py-2 text-[11px] leading-6 text-gray-600 dark:text-gray-300">
                            {event.note}
                        </div>
                    )}
                </div>
            </div>
        </li>
    );
}

function TasksSection({ report }: { report: CaseReport }) {
    return (
        <section>
            <SectionHeader icon={<Workflow size={15} />} title="مسیر وظایف" count={report.tasks.length} />
            {report.tasks.length === 0 ? (
                <EmptyState text="وظیفه‌ای ثبت نشده است." />
            ) : (
                <div className="space-y-3">
                    {report.tasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </div>
            )}
        </section>
    );
}

function OrdersSection({ report }: { report: CaseReport }) {
    return (
        <section>
            <SectionHeader icon={<Package size={15} />} title="سفارش‌های انبار" count={report.order_tasks.length} />
            {report.order_tasks.length === 0 ? (
                <EmptyState text="سفارشی ثبت نشده است." />
            ) : (
                <div className="space-y-3">
                    {report.order_tasks.map((order) => (
                        <OrderCard key={order.id} order={order} />
                    ))}
                </div>
            )}
        </section>
    );
}

function TimelineSection({ report }: { report: CaseReport }) {
    return (
        <section>
            <SectionHeader icon={<Clock3 size={15} />} title="خط زمانی" count={report.timeline.length} />
            {report.timeline.length === 0 ? (
                <EmptyState text="رویدادی ثبت نشده است." />
            ) : (
                <ol>
                    {report.timeline.map((event, index) => (
                        <TimelineItem
                            key={`${event.at}-${index}`}
                            event={event}
                            isLast={index === report.timeline.length - 1}
                        />
                    ))}
                </ol>
            )}
        </section>
    );
}

export type ReportTab = "overview" | "tasks" | "orders" | "timeline";

export function ReportTabs({
    report,
    active,
    onChange,
}: {
    report: CaseReport;
    active: ReportTab;
    onChange: (tab: ReportTab) => void;
}) {
    const items: { id: ReportTab; label: string; count?: number }[] = [
        { id: "overview", label: "خلاصه" },
        { id: "tasks", label: "وظایف", count: report.tasks.length },
        { id: "orders", label: "سفارش‌ها", count: report.order_tasks.length },
        { id: "timeline", label: "خط زمانی", count: report.timeline.length },
    ];
    return (
        <div className="flex gap-1 overflow-x-auto rounded-2xl bg-gray-100 p-1 dark:bg-white/[0.05]">
            {items.map((item) => {
                const isActive = item.id === active;
                return (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onChange(item.id)}
                        className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-[11.5px] font-bold transition-all ${isActive
                            ? "bg-white text-indigo-600 shadow-sm dark:bg-white/10 dark:text-indigo-300"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            }`}
                    >
                        {item.label}
                        {typeof item.count === "number" && (
                            <span
                                className={`rounded-full px-1.5 text-[9.5px] ${isActive ? "bg-indigo-500/15" : "bg-gray-200 dark:bg-white/10"
                                    }`}
                            >
                                {formatNumber(item.count)}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

export function ReportPanel({ report, tab }: { report: CaseReport; tab: ReportTab }) {
    if (tab === "tasks") return <TasksSection report={report} />;
    if (tab === "orders") return <OrdersSection report={report} />;
    if (tab === "timeline") return <TimelineSection report={report} />;
    return (
        <div className="space-y-5">
            <Stats report={report} />
            <TasksSection report={{ ...report, tasks: report.tasks.slice(0, 3) }} />
        </div>
    );
}

export function ReportStack({ report }: { report: CaseReport }) {
    return (
        <div className="space-y-6">
            <Hero report={report} />
            <Stats report={report} />
            <TasksSection report={report} />
            {report.order_tasks.length > 0 && <OrdersSection report={report} />}
            <TimelineSection report={report} />
        </div>
    );
}

export function ReportHero({ report }: { report: CaseReport }) {
    return <Hero report={report} />;
}

export function ReportError({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
                <AlertCircle size={20} className="text-red-500" />
            </div>
            <p className="text-[12px] font-semibold text-red-400">{message}</p>
        </div>
    );
}

export function ReportLoading() {
    return <DetailSkeleton />;
}
