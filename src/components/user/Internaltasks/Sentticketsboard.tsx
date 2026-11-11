"use client";

import PageHeader, { HEADER_BTN_PRIMARY } from "@/components/ui/PageHeader";
import { useCallback, useMemo, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { internalTasksApi } from "@/lib/api";
import { LayoutGrid, Plus, Ticket } from "lucide-react";
import TicketBoardSkeleton from "./TicketBoardSkeleton";
import { useCurrentEmployee } from "@/hooks/usecurrentemployee";
import { deleteInternalTask } from "./Api";
import type { InternalTask, InternalTaskStatus } from "./types";
import SentTaskCard from "./Senttaskcard";
import CreateTicketModal from "./Createticketmodal";

function normalizeDateValue(value: unknown): string | null {
    if (!value) return null;
    if (typeof value === "string") return value.trim() || null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
    if (typeof value === "object" && value !== null && "deadline" in value) {
        return normalizeDateValue((value as { deadline?: unknown }).deadline);
    }
    return null;
}

function normalizeTask(item: unknown): InternalTask | null {
    if (!item || typeof item !== "object") return null;
    const task = item as Partial<InternalTask>, id = Number(task.id);
    if (!Number.isFinite(id) || id <= 0) return null;

    const status: InternalTaskStatus =
        task.status === "in_progress" || task.status === "completed" || task.status === "cancelled"
            ? task.status
            : "in_progress";

    return {
        id,
        title: typeof task.title === "string" ? task.title : "",
        description: typeof task.description === "string" ? task.description : "",
        status,
        created_by: typeof task.created_by === "string" ? task.created_by.trim() : "",
        created_at: typeof task.created_at === "string" && task.created_at.trim() ? task.created_at : new Date().toISOString(),
        started_at: normalizeDateValue(task.started_at ?? (task.deadline as unknown as { started_at?: unknown } | null)?.started_at),
        deadline: normalizeDateValue(task.deadline),
        assigned_to: Array.isArray(task.assigned_to) ? task.assigned_to : [],
        attachments: Array.isArray(task.attachments) ? task.attachments : [],
        updated_at: typeof task.updated_at === "string" ? task.updated_at : new Date().toISOString(),
        completed_at: typeof task.completed_at === "string" || task.completed_at === null ? task.completed_at : null,
    };
}

function normalizeTasks(data: unknown): InternalTask[] {
    if (!Array.isArray(data)) return [];
    const map = new Map<number, InternalTask>();
    data.forEach(item => {
        const task = normalizeTask(item);
        if (task) map.set(task.id, task);
    });
    return [...map.values()];
}

function getUsername(employee: unknown) {
    if (!employee || typeof employee !== "object") return "";
    const username = (employee as { username?: unknown }).username;
    return typeof username === "string" ? username.trim() : "";
}

export default function SentTicketsBoard() {
    const { employee, loading: employeeLoading } = useCurrentEmployee();
    const list = usePaginatedList(
        (params, signal) => internalTasksApi.page(params, signal),
        { pageSize: 12 },
    );
    const tasks = useMemo(() => normalizeTasks(list.data), [list.data]);
    const loading = list.loading && list.data.length === 0;
    const [actionError, setActionError] = useState<string | null>(null);
    const error = actionError ?? (list.error ? "دریافت تیکت‌ها با خطا مواجه شد." : null);
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

    const currentUsername = getUsername(employee);

    const loadTasks = () => { setActionError(null); list.refetch(); };

    const sentTasks = useMemo(
        () => currentUsername
            ? tasks.filter(task =>
                task.status === "in_progress" &&
                task.created_by.trim() === currentUsername
            )
            : [],
        [tasks, currentUsername]
    );

    const handleUpdated = useCallback(() => { list.refetch(); }, [list.refetch]);

    const handleCreated = () => {
        setCreateOpen(false);
        list.refetch();
    };

    const handleDelete = async (taskId: number) => {
        const id = Number(taskId);
        if (!Number.isFinite(id) || id <= 0) return;
        try {
            setDeleteLoadingId(id);
            await deleteInternalTask(id);
            list.refetch();
        } catch {
            setActionError("حذف تیکت با خطا مواجه شد.");
        } finally {
            setDeleteLoadingId(null);
        }
    };

    if (loading || employeeLoading) {
        return <TicketBoardSkeleton count={4} />;
    }

    return (
        <div dir="rtl" className="flex flex-col gap-5">
            <PageHeader
                icon={Ticket}
                title="تیکت‌های ارسال شده"
                subtitle={`${list.count} تیکت`}
                search={{ value: list.search, onChange: list.setSearch, placeholder: "جستجو بر اساس عنوان، شماره یا نام فرد" }}
                onRefresh={() => loadTasks()}
                refreshing={list.loading}
            >
                <button type="button" onClick={() => setCreateOpen(true)} className={HEADER_BTN_PRIMARY}>
                    <Plus size={14} />تیکت جدید
                </button>
            </PageHeader>

            {error && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                    <p className="text-[12px] font-semibold text-red-500">{error}</p>
                    <button type="button" onClick={() => loadTasks()} className="rounded-xl bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-500 transition-colors hover:bg-red-500/20">تلاش مجدد</button>
                </div>
            )}

            {sentTasks.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.07]">
                    <LayoutGrid size={28} className="text-gray-300 dark:text-gray-700" />
                    <p className="text-[12px] text-gray-400">هنوز تیکتی ارسال نکرده‌اید.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {sentTasks.map((task, index) => (
                        <SentTaskCard key={task.id} task={task} index={index} onUpdated={handleUpdated} onDelete={handleDelete} isDeleting={deleteLoadingId === task.id} />
                    ))}
                </div>
            )}
            {list.totalPages > 1 && <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />}

            <CreateTicketModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleCreated} />
        </div>
    );
}
