"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Clock, Loader2, Package, User, X, Workflow } from "lucide-react";
import { casesApi } from "@/lib/api/cases";
import { apiMessage } from "@/lib/apiMessage";
import type { CaseReport, CaseReportTask } from "@/types/caseReport";

interface CaseReportModalProps {
    caseId: number;
    caseTitle: string;
    onClose: () => void;
}

const dateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    dateStyle: "medium",
    timeStyle: "short",
});

function formatDate(value: string | null | undefined): string {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return dateFormatter.format(date);
}

function formatNumber(value: number | null | undefined): string {
    return (value ?? 0).toLocaleString("fa-IR");
}

function formatDuration(totalSeconds: number): string {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const parts: string[] = [];
    if (days) parts.push(`${formatNumber(days)} روز`);
    if (hours) parts.push(`${formatNumber(hours)} ساعت`);
    if (!days && minutes) parts.push(`${formatNumber(minutes)} دقیقه`);
    return parts.length > 0 ? parts.join(" و ") : "کمتر از یک دقیقه";
}

const STATUS_TONES: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    in_progress: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
};

function StatusPill({ status, label }: { status: string; label: string }) {
    const tone = STATUS_TONES[status] ?? "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300";
    return (
        <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${tone}`}>{label}</span>
    );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
    return (
        <h3 className="mb-3 flex items-center gap-2 text-[15px] font-black text-gray-800 dark:text-gray-100">
            {icon}
            {title}
        </h3>
    );
}

function StatBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="text-[11.5px] text-gray-500 dark:text-gray-400">{label}</div>
            <div className="mt-1 text-[15px] font-black text-gray-800 dark:text-gray-100">{value}</div>
        </div>
    );
}

function TaskFlow({ task }: { task: CaseReportTask }) {
    return (
        <div className="rounded-2xl border border-gray-200 p-4 dark:border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[15px] font-bold text-gray-800 dark:text-gray-100">{task.title}</span>
                <StatusPill status={task.status} label={task.status_display} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px] text-gray-600 dark:text-gray-300">
                <span className="rounded-lg bg-gray-100 px-2 py-1 dark:bg-white/10">
                    {task.department?.name ?? "بدون دپارتمان"}
                </span>
                <span className="text-gray-400">←</span>
                <span className="rounded-lg bg-indigo-50 px-2 py-1 font-bold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                    {task.current_step?.name ?? "—"}
                </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-gray-500 dark:text-gray-400">
                <span>پیشروی: {formatNumber(task.counts.advanced)}</span>
                <span>بازگشت: {formatNumber(task.counts.reverted)}</span>
                <span>انتقال: {formatNumber(task.counts.transferred)}</span>
                <span>مدت: {formatDuration(task.duration_seconds)}</span>
            </div>
            {task.assigned_employees.length > 0 && (
                <div className="mt-2 text-[11.5px] text-gray-500 dark:text-gray-400">
                    مسئول: {task.assigned_employees.map((e) => e.full_name).join("، ")}
                </div>
            )}
        </div>
    );
}

function ReportBody({ report }: { report: CaseReport }) {
    const { summary, customer } = report;

    return (
        <div className="space-y-6">
            <section>
                <SectionTitle icon={<User size={16} />} title="مشتری" />
                <div className="rounded-2xl border border-gray-200 p-4 text-[15px] dark:border-white/10">
                    <div className="font-bold text-gray-800 dark:text-gray-100">{customer.full_name}</div>
                    <div className="mt-1 text-[11.5px] text-gray-500 dark:text-gray-400">
                        {[customer.company_name, customer.phone_number, customer.status_display]
                            .filter(Boolean)
                            .join(" • ")}
                    </div>
                </div>
            </section>

            <section>
                <SectionTitle icon={<CheckCircle2 size={16} />} title="خلاصه" />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <StatBox label="وظایف" value={formatNumber(summary.tasks_count)} />
                    <StatBox label="سفارش‌ها" value={formatNumber(summary.order_tasks_count)} />
                    <StatBox label="مدت کل" value={formatDuration(summary.total_duration_seconds)} />
                    <StatBox label="مبلغ کل" value={formatNumber(summary.total_order_amount)} />
                </div>
            </section>

            <section>
                <SectionTitle icon={<Workflow size={16} />} title="مسیر وظایف" />
                {report.tasks.length === 0 ? (
                    <p className="text-[11.5px] text-gray-500">وظیفه‌ای ثبت نشده است.</p>
                ) : (
                    <div className="space-y-3">
                        {report.tasks.map((task) => (
                            <TaskFlow key={task.id} task={task} />
                        ))}
                    </div>
                )}
            </section>

            {report.order_tasks.length > 0 && (
                <section>
                    <SectionTitle icon={<Package size={16} />} title="سفارش‌های انبار" />
                    <div className="space-y-3">
                        {report.order_tasks.map((order) => (
                            <div key={order.id} className="rounded-2xl border border-gray-200 p-4 dark:border-white/10">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-[15px] font-bold text-gray-800 dark:text-gray-100">
                                        {order.warehouse?.name ?? order.title}
                                    </span>
                                    <StatusPill status={order.status} label={order.status_display} />
                                </div>
                                <ul className="mt-2 space-y-1 text-[11.5px] text-gray-600 dark:text-gray-300">
                                    {order.items.map((item) => (
                                        <li key={item.id} className="flex justify-between gap-2">
                                            <span>{item.product_name}</span>
                                            <span>
                                                {formatNumber(item.completed_quantity)} از {formatNumber(item.quantity)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-2 text-[11.5px] font-bold text-gray-700 dark:text-gray-200">
                                    جمع: {formatNumber(order.total_amount)}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section>
                <SectionTitle icon={<Clock size={16} />} title="خط زمانی" />
                {report.timeline.length === 0 ? (
                    <p className="text-[11.5px] text-gray-500">رویدادی ثبت نشده است.</p>
                ) : (
                    <ol className="relative space-y-4 border-r-2 border-gray-200 pr-4 dark:border-white/10">
                        {report.timeline.map((event, index) => (
                            <li key={`${event.at}-${index}`} className="relative">
                                <span className="absolute -right-[22px] top-1.5 h-3 w-3 rounded-full bg-indigo-500" />
                                <div className="text-[15px] font-bold text-gray-800 dark:text-gray-100">{event.title}</div>
                                {event.detail && (
                                    <div className="text-[11.5px] text-gray-600 dark:text-gray-300">{event.detail}</div>
                                )}
                                {event.note && (
                                    <div className="text-[11.5px] text-gray-500 dark:text-gray-400">{event.note}</div>
                                )}
                                <div className="mt-0.5 text-[11.5px] text-gray-400">{formatDate(event.at)}</div>
                            </li>
                        ))}
                    </ol>
                )}
            </section>
        </div>
    );
}

export default function CaseReportModal({ caseId, caseTitle, onClose }: CaseReportModalProps) {
    const [report, setReport] = useState<CaseReport | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                key="case-report"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[300] flex items-center justify-center p-4"
                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl dark:bg-[#1a1a1a]"
                    style={{ direction: "rtl" }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-white/10">
                        <div>
                            <div className="text-[15px] font-black text-gray-800 dark:text-gray-100">گزارش پرونده</div>
                            <div className="text-[11.5px] text-gray-500 dark:text-gray-400">{caseTitle}</div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="بستن"
                            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        {loading && (
                            <div className="flex items-center justify-center py-16 text-gray-400">
                                <Loader2 className="animate-spin" size={26} />
                            </div>
                        )}
                        {!loading && error && (
                            <div className="flex flex-col items-center gap-2 py-16 text-red-500">
                                <AlertCircle size={26} />
                                <span className="text-[15px]">{error}</span>
                            </div>
                        )}
                        {!loading && !error && report && <ReportBody report={report} />}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body,
    );
}
