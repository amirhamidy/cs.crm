"use client";

import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { ChevronDown, ArrowLeft } from "lucide-react";
import { customersApi } from "@/lib/api/customers";
import type { CustomerPath, PathCase, PathTask } from "@/types/customerPath";
import { apiMessage } from "@/lib/apiMessage";
import { formatJalaliDateTime, formatNumber } from "@/lib/format";
import { toPersianDigits } from "@/lib/jalali";
import { EmptyState, ErrorState } from "@/components/ui/Feedback";
import { ListSkeleton } from "@/components/ui/skeletons";

const STATUS_CLS: Record<string, string> = {
  in_progress: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  completed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  sold: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  no_tasks: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
};
const CASE_STATUS_LABEL: Record<string, string> = {
  in_progress: "در جریان",
  completed: "تکمیل‌شده",
  sold: "فروخته‌شده",
  cancelled: "لغوشده",
  no_tasks: "بدون تسک",
};

function Badge({ status, children }: { status: string; children: React.ReactNode }) {
  return (
    <span className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${STATUS_CLS[status] ?? STATUS_CLS.no_tasks}`}>
      {children}
    </span>
  );
}

function TaskBlock({ task }: { task: PathTask }) {
  return (
    <div className="rounded-xl border border-gray-100 p-3 dark:border-white/5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-bold text-gray-800 dark:text-gray-100">{task.title}</span>
        <Badge status={task.status}>{task.status_display}</Badge>
        {task.department && <span className="text-[11.5px] text-gray-500">{task.department.name}</span>}
      </div>
      <p className="mt-1 text-[11.5px] text-gray-500 dark:text-gray-400">
        ایجاد: {formatJalaliDateTime(task.created_at)}
        {task.completed_at && <> · پایان: {formatJalaliDateTime(task.completed_at)}</>}
        {task.current_step && <> · مرحلهٔ فعلی: {task.current_step.name}</>}
      </p>
      {task.assigned_employees.length > 0 && (
        <p className="text-[11.5px] text-gray-500 dark:text-gray-400">
          مسئولان: {task.assigned_employees.map((e) => e.full_name).join("، ")}
        </p>
      )}
      {task.visited_steps.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1 text-[12px]">
          {task.visited_steps.map((s, i) => (
            <span key={`${s}-${i}`} className="inline-flex items-center gap-1">
              <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-gray-700 dark:bg-white/10 dark:text-gray-200">{s}</span>
              {i < task.visited_steps.length - 1 && <ArrowLeft size={12} className="text-gray-400" />}
            </span>
          ))}
        </div>
      )}
      {task.path.length > 0 && (
        <ol className="mt-2 space-y-1 border-r-2 border-gray-200 pr-3 dark:border-white/10">
          {task.path.map((l) => (
            <li key={l.log_id} className="text-[12px] text-gray-600 dark:text-gray-300">
              <span className="font-bold">{l.step_name}</span> · {l.action_display} · {formatJalaliDateTime(l.at)}
              {l.employees.length > 0 && <> · {l.employees.map((e) => e.full_name).join("، ")}</>}
              {l.note && <p className="text-gray-500">{l.note}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function CaseBlock({ c }: { c: PathCase }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-2 p-3 text-right">
        <span className="text-[13.5px] font-black text-gray-900 dark:text-white">{c.title}</span>
        <Badge status={c.status}>{CASE_STATUS_LABEL[c.status] ?? c.status}</Badge>
        {!c.active && <span className="text-[11px] text-gray-400">غیرفعال</span>}
        <span className="mr-auto text-[11.5px] text-gray-500 dark:text-gray-400">
          {toPersianDigits(c.tasks.length)} تسک · {toPersianDigits(c.sales_count)} فروش · {formatNumber(c.sales_total)}
        </span>
        <ChevronDown size={16} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-2 border-t border-gray-100 p-3 dark:border-white/5">
          {c.tasks.length === 0 ? (
            <p className="text-[12.5px] text-gray-500">این پرونده تسکی ندارد.</p>
          ) : (
            c.tasks.map((t) => <TaskBlock key={t.id} task={t} />)
          )}
        </div>
      )}
    </div>
  );
}

export default function CustomerPathPanel({ customerId }: { customerId: number }) {
  const [data, setData] = useState<CustomerPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await customersApi.path(customerId));
    } catch (e) {
      setData(null);
      setError(
        isAxiosError(e) && e.response?.status === 404
          ? "مشتری پیدا نشد"
          : apiMessage(e, "دریافت مسیر پرونده‌ها با خطا مواجه شد"),
      );
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <ListSkeleton rows={4} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data || data.cases.length === 0)
    return <EmptyState title="پرونده‌ای برای نمایش نیست" description="پرونده‌ای که به آن دسترسی دارید برای این مشتری وجود ندارد." />;

  const s = data.summary;
  const stats: [string, number][] = [
    ["پرونده‌ها", s.cases_count],
    ["پرونده‌های فعال", s.active_cases],
    ["تسک‌ها", s.tasks_count],
    ["در جریان", s.in_progress_tasks],
    ["فروخته‌شده", s.sold_tasks],
    ["لغوشده", s.cancelled_tasks],
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
        {stats.map(([l, v]) => (
          <div key={l} className="rounded-xl border border-gray-200 p-2 text-center dark:border-white/10">
            <p className="text-[11px] text-gray-500">{l}</p>
            <p className="text-[15px] font-black text-gray-900 dark:text-white">{toPersianDigits(v)}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {data.cases.map((c) => <CaseBlock key={c.id} c={c} />)}
      </div>

      {data.timeline.length > 0 && (
        <div className="rounded-2xl border border-gray-200 p-4 dark:border-white/10">
          <h3 className="mb-3 text-[13px] font-black text-gray-800 dark:text-gray-100">تایم‌لاین رویدادها</h3>
          <ol className="space-y-2 border-r-2 border-gray-200 pr-3 dark:border-white/10">
            {data.timeline.map((t, i) => (
              <li key={`${t.at}-${i}`} className="text-[12.5px] text-gray-700 dark:text-gray-200">
                <span className="font-bold">{t.title}</span>
                {t.detail && <span className="text-gray-500"> — {t.detail}</span>}
                <p className="text-[11px] text-gray-400">{formatJalaliDateTime(t.at)}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
