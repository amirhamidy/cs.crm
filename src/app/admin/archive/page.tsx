"use client";

import { useMemo, useState } from "react";
import { CountSkeleton, TaskCardSkeleton } from "@/components/ui/skeletons";
import { AnimatePresence, m } from "framer-motion";
import { Archive, ArrowRight, Ban, CheckCircle2, ClipboardList, Layers3, ShoppingBag } from "lucide-react";
import PageHeader, { HEADER_BTN_SECONDARY } from "@/components/ui/PageHeader";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { tasksApi } from "@/lib/api";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import Pagination from "@/components/ui/Pagination";
import { Task } from "@/types/task";
import TaskCard from "@/components/tasks/TaskCard";

type ArchiveFilter = "all" | "completed" | "sold" | "cancelled";

const archiveFilters: { id: ArchiveFilter; label: string; icon: typeof Layers3; color: string }[] = [
    { id: "all", label: "همه", icon: Layers3, color: "#818cf8" },
    { id: "completed", label: "تکمیل شده", icon: CheckCircle2, color: "#34d399" },
    { id: "sold", label: "فروش رفته", icon: ShoppingBag, color: "#fbbf24" },
    { id: "cancelled", label: "لغو شده", icon: Ban, color: "#fb7185" },
];

export default function AdminArchivedTasksPage() {
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [filter, setFilter] = useState<ArchiveFilter>("all");
    const list = usePaginatedList<Task>((params, signal) => tasksApi.archivePage<Task>(params, signal), { pageSize: 12 });
    const loading = list.loading;
    const tasks = list.data;
    const fetchAll = list.refetch;

    const filteredTasks = useMemo(() => (filter === "all" ? tasks : tasks.filter((task) => task.status === filter)), [tasks, filter]);

    const getCount = (id: ArchiveFilter) => (id === "all" ? list.count : tasks.filter((task) => task.status === id).length);

    return (
        <div className="flex flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
            <PageHeader
                icon={Archive}
                title="بایگانی تسک‌ها"
                subtitle={loading ? <CountSkeleton /> : `${list.count} تسک`}
                search={{ value: list.search, onChange: list.setSearch, placeholder: "جستجو در بایگانی وظایف..." }}
                leading={
                    <button type="button" onClick={() => router.push("/admin/tasks")} className={HEADER_BTN_SECONDARY}>
                        <ArrowRight size={15} />
                        بازگشت به وظایف
                    </button>
                }
                onRefresh={fetchAll}
                refreshing={loading}
            />

            <div className="flex flex-wrap items-center gap-2">
                {archiveFilters.map(({ id, label, icon: Icon, color }) => {
                    const isActive = filter === id;
                    const count = getCount(id);

                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setFilter(id)}
                            className="flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-[11.5px] font-bold transition-all duration-200"
                            style={{
                                color: isActive ? color : undefined,
                                backgroundColor: isActive ? `${color}18` : isDark ? "rgba(255,255,255,0.03)" : "rgba(15,23,42,0.03)",
                                borderColor: isActive ? `${color}45` : isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)",
                            }}
                        >
                            <Icon size={13} style={{ color: isActive ? color : "rgb(148 163 184)" }} />
                            <span className={isActive ? "" : "text-gray-500 dark:text-gray-400"}>{label}</span>
                            <span className="rounded-full px-1.5 py-0.5 text-[9.5px] font-extrabold tabular-nums" style={{ color, backgroundColor: `${color}18` }}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {loading && <TaskCardSkeleton />}

            {!loading && !list.error && filteredTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                    <ClipboardList size={28} className="text-gray-300 dark:text-gray-700" />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">تسکی در این وضعیت یافت نشد</p>
                </div>
            )}

            {!loading && filteredTasks.length > 0 && (
                <m.div layout className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                        {filteredTasks.map((task, index) => (
                            <m.div key={task.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                                <TaskCard task={task} index={index} readOnly />
                            </m.div>
                        ))}
                    </AnimatePresence>
                </m.div>
            )}

            {list.totalPages > 1 && <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />}
        </div>
    );
}
