"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, ArrowRight, Ban, Building2, CalendarClock, CheckCircle2, ClipboardList, Eye, Layers3, Loader, RefreshCw, Search, ShoppingBag, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { tasksApi } from "@/lib/api";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import Pagination from "@/components/ui/Pagination";
import ArchivedTaskDetailModal, { type ArchiveTaskSummary } from "@/components/user/tasks/ArchivedTaskDetailModal";

type ArchiveFilter = "all" | "completed" | "sold" | "cancelled";

const archiveFilters: { id: ArchiveFilter; label: string; icon: typeof Layers3; color: string }[] = [
    { id: "all", label: "همه", icon: Layers3, color: "#818cf8" },
    { id: "completed", label: "انجام شده", icon: CheckCircle2, color: "#38bdf8" },
    { id: "sold", label: "فروش رفته", icon: ShoppingBag, color: "#34d399" },
    { id: "cancelled", label: "لغو شده", icon: Ban, color: "#fb7185" },
];

const statusStyle: Record<ArchiveTaskSummary["status"], { label: string; color: string }> = {
    completed: { label: "انجام شده", color: "#38bdf8" },
    sold: { label: "فروش رفته", color: "#34d399" },
    cancelled: { label: "لغو شده", color: "#fb7185" },
};

const dateFmt = new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "short", day: "numeric" });
const fmtDate = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "—" : dateFmt.format(d);
};

export default function AdminArchivedTasksPage() {
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [selected, setSelected] = useState<ArchiveTaskSummary | null>(null);

    const list = usePaginatedList<ArchiveTaskSummary, { status?: string }>(
        (params, signal) => tasksApi.archivePage<ArchiveTaskSummary>(params, signal),
        { pageSize: 12, filters: { status: undefined } },
    );
    const loading = list.loading;
    const items = list.data;
    const filter: ArchiveFilter = (list.filters.status as ArchiveFilter | undefined) ?? "all";
    const setFilter = (id: ArchiveFilter) => list.setFilters({ status: id === "all" ? undefined : id });

    const surface = isDark ? "rgba(255,255,255,0.03)" : "rgba(15,23,42,0.03)";
    const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)";

    return (
        <div className="flex flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: isDark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)" }}>
                        <Archive size={18} className="text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">بایگانی تسک‌ها</h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">{loading ? "در حال بارگذاری..." : `${list.count} تسک`}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => router.push("/admin/tasks")}
                        className="flex h-10 items-center gap-2 rounded-2xl px-3.5 text-[12px] font-bold transition-colors"
                        style={{ background: surface, color: isDark ? "#cbd5e1" : "#475569" }}
                    >
                        <ArrowRight size={15} />
                        بازگشت به وظایف
                    </button>
                    <button
                        type="button"
                        onClick={list.refetch}
                        disabled={loading}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl transition-colors disabled:opacity-50"
                        style={{ background: surface, color: isDark ? "#cbd5e1" : "#475569" }}
                        title="بارگذاری مجدد"
                    >
                        <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    {archiveFilters.map(({ id, label, icon: Icon, color }) => {
                        const isActive = filter === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setFilter(id)}
                                className="flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-[11.5px] font-bold transition-all duration-200"
                                style={{
                                    color: isActive ? color : undefined,
                                    backgroundColor: isActive ? `${color}18` : surface,
                                    borderColor: isActive ? `${color}45` : border,
                                }}
                            >
                                <Icon size={13} style={{ color: isActive ? color : "rgb(148 163 184)" }} />
                                <span className={isActive ? "" : "text-gray-500 dark:text-gray-400"}>{label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="relative w-full sm:w-72">
                    <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={list.search}
                        onChange={(e) => list.setSearch(e.target.value)}
                        placeholder="جستجو در عنوان، پرونده، مشتری یا دپارتمان..."
                        className="h-9 w-full rounded-full border border-gray-100 bg-gray-50 pr-9 pl-9 text-[11px] font-semibold text-gray-800 outline-none transition focus:border-indigo-400 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-gray-200"
                    />
                    {list.search && (
                        <button type="button" onClick={() => list.setSearch("")} className="absolute left-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:text-gray-600">
                            <X size={11} />
                        </button>
                    )}
                </div>
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader size={24} className="animate-spin text-indigo-500" />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">در حال دریافت بایگانی...</p>
                </div>
            )}

            {!loading && !list.error && items.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                    <ClipboardList size={28} className="text-gray-300 dark:text-gray-700" />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">تسکی در این وضعیت یافت نشد</p>
                </div>
            )}

            {!loading && items.length > 0 && (
                <motion.div layout className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                        {items.map((task) => {
                            const st = statusStyle[task.status];
                            return (
                                <motion.article
                                    key={task.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="flex flex-col gap-3 rounded-2xl border p-4"
                                    style={{ background: surface, borderColor: border }}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">{task.title || `تسک #${task.task_id}`}</h3>
                                            <p className="mt-0.5 truncate text-[10.5px] text-gray-500 dark:text-gray-400">{task.case_title || "بدون پرونده"}</p>
                                        </div>
                                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold" style={{ color: st.color, backgroundColor: `${st.color}18` }}>
                                            {st.label}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[10.5px] text-gray-600 dark:text-gray-300">
                                        <div className="flex min-w-0 items-center gap-1.5">
                                            <User size={12} className="shrink-0 text-gray-400" />
                                            <span className="truncate">{task.customer_full_name || "—"}</span>
                                        </div>
                                        <div className="flex min-w-0 items-center gap-1.5">
                                            <Building2 size={12} className="shrink-0 text-gray-400" />
                                            <span className="truncate">{task.department_name || "—"}</span>
                                        </div>
                                        <div className="flex min-w-0 items-center gap-1.5">
                                            <CalendarClock size={12} className="shrink-0 text-gray-400" />
                                            <span className="truncate">بایگانی: {fmtDate(task.archived_at)}</span>
                                        </div>
                                        <div className="flex min-w-0 items-center gap-1.5">
                                            <CheckCircle2 size={12} className="shrink-0 text-gray-400" />
                                            <span className="truncate">آخرین اقدام: {task.final_action_by_full_name || task.final_action_by_username || "—"}</span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setSelected(task)}
                                        className="mt-auto flex h-9 items-center justify-center gap-2 rounded-xl text-[11.5px] font-bold text-indigo-600 transition hover:bg-indigo-500/10 dark:text-indigo-300"
                                    >
                                        <Eye size={14} />
                                        مشاهده جزئیات
                                    </button>
                                </motion.article>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}

            {list.totalPages > 1 && <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />}

            {selected && <ArchivedTaskDetailModal task={selected} onClose={() => setSelected(null)} />}
        </div>
    );
}
