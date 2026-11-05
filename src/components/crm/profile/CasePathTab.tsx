"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronDown,
  FolderKanban,
  History,
  ShoppingBag,
  User,
} from "lucide-react";
import { EmptyState, ErrorState } from "@/components/ui/Feedback";
import { ListSkeleton, StatCardsSkeleton } from "@/components/ui/skeletons";
import { casePathApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import { formatJalaliDateTime, formatMoney, formatNumber } from "@/lib/crm/format";
import { cn } from "@/lib/utils";
import type { CustomerPath, PathCase, PathTask } from "@/types/crm";
import { Card, SectionTitle, StatTile, StatusPill } from "../ui";

const ACTION_TONE: Record<string, string> = {
  advanced: "bg-emerald-500",
  reverted: "bg-amber-500",
  transferred: "bg-sky-500",
};

/** نوار مراحلی که وظیفه از آن‌ها گذشته؛ مرحله‌ی فعلی هایلایت می‌شود */
function StepStrip({ task }: { task: PathTask }) {
  const current = task.current_step?.name;
  const steps = [...task.visited_steps];
  if (current && steps[steps.length - 1] !== current) steps.push(current);

  if (steps.length === 0) {
    return <p className="text-[13px] text-gray-400">هنوز مرحله‌ای طی نشده است.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {steps.map((name, i) => {
        const isCurrent = task.status === "in_progress" && name === current && i === steps.length - 1;
        return (
          <span key={`${name}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <ArrowLeft size={11} className="text-gray-300 dark:text-gray-600" />}
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[13px] font-bold",
                isCurrent
                  ? "bg-brand text-white shadow-sm"
                  : "bg-transparent text-gray-600 dark:bg-transparent dark:text-gray-300",
              )}
            >
              {name}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function useStateToggle(): [boolean, () => void] {
  const [v, setV] = useState(false);
  return [v, () => setV((x) => !x)];
}

function TaskBlock({ task }: { task: PathTask }) {
  const [open, setOpen] = useStateToggle();
  return (
    <div className="rounded-2xl border border-gray-100 bg-transparent p-3.5 dark:border-white/[0.06] dark:bg-transparent">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">{task.title}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[13px] text-gray-400">
            {task.department && (
              <span className="flex items-center gap-1">
                <Building2 size={10} /> {task.department.name}
              </span>
            )}
            {task.assigned_employees.length > 0 && (
              <span className="flex items-center gap-1">
                <User size={10} /> {task.assigned_employees.map((e) => e.full_name).join("، ")}
              </span>
            )}
          </div>
        </div>
        <StatusPill status={task.status} label={task.status_display} />
      </div>

      <div className="mt-3">
        <StepStrip task={task} />
      </div>

      {task.path.length > 0 && (
        <>
          <button
            type="button"
            onClick={setOpen}
            aria-expanded={open}
            className="mt-3 flex items-center gap-1 text-[13px] font-bold text-brand"
          >
            <History size={12} />
            جزئیات {formatNumber(task.path.length)} اقدام
            <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
          </button>

          {open && (
            <ol className="relative mt-3 space-y-3 border-r-2 border-gray-200 pr-4 dark:border-white/10">
              {task.path.map((item) => (
                <li key={item.log_id} className="relative">
                  <span
                    className={cn(
                      "absolute -right-[22px] top-1.5 h-3 w-3 rounded-full",
                      ACTION_TONE[item.action] ?? "bg-gray-400",
                    )}
                  />
                  <div className="text-[13px] font-extrabold text-gray-800 dark:text-gray-100">
                    {item.action_display}
                    {item.step_name && <span className="font-bold text-gray-500"> — {item.step_name}</span>}
                  </div>
                  {item.note && (
                    <p className="mt-0.5 text-[13px] leading-6 text-gray-600 dark:text-gray-300">{item.note}</p>
                  )}
                  <div className="mt-0.5 text-[13px] text-gray-400">
                    {formatJalaliDateTime(item.at)}
                    {item.employees.length > 0 && ` • ${item.employees.map((e) => e.full_name).join("، ")}`}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}

function CaseBlock({ c }: { c: PathCase }) {
  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <FolderKanban size={16} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">{c.title}</div>
            <div className="text-[13px] text-gray-400">
              {formatJalaliDateTime(c.created_at)}
              {!c.active && " • بسته‌شده"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {c.sales_count > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[13px] font-extrabold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
              <ShoppingBag size={11} /> {formatMoney(c.sales_total)}
            </span>
          )}
          <StatusPill status={c.status} />
        </div>
      </div>

      {c.tasks.length === 0 ? (
        <p className="text-[13px] text-gray-400">برای این پرونده وظیفه‌ای ثبت نشده است.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {c.tasks.map((t) => (
            <TaskBlock key={t.id} task={t} />
          ))}
        </div>
      )}
    </Card>
  );
}

const EVENT_DOT: Record<string, string> = {
  case_created: "bg-indigo-500",
  task_created: "bg-sky-500",
  step_advanced: "bg-emerald-500",
  step_reverted: "bg-amber-500",
  step_transferred: "bg-sky-500",
  task_sold: "bg-emerald-600",
  task_cancelled: "bg-rose-500",
  sale: "bg-yellow-500",
};

export default function CasePathTab({ customerId, refreshKey = 0 }: { customerId: number; refreshKey?: number }) {
  const [data, setData] = useState<CustomerPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<"cases" | "timeline">("cases");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await casePathApi.get(customerId));
    } catch (e) {
      setError(apiMessage(e, "دریافت مسیر پرونده‌ها ناموفق بود"));
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <StatCardsSkeleton count={4} />
        <ListSkeleton rows={3} />
      </div>
    );
  }
  if (error || !data) return <ErrorState message={error || "خطا در دریافت اطلاعات"} onRetry={load} />;

  const s = data.summary;

  if (data.cases.length === 0) {
    return (
      <Card>
        <EmptyState
          title="پرونده‌ای برای نمایش وجود ندارد"
          description="برای این مشتری پرونده‌ای ثبت نشده یا شما به پرونده‌های او دسترسی ندارید."
          icon={<FolderKanban size={26} />}
        />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="پرونده‌ها" value={formatNumber(s.cases_count)} hint={`${formatNumber(s.active_cases)} فعال`} />
        <StatTile label="وظایف" value={formatNumber(s.tasks_count)} />
        <StatTile label="در حال انجام" value={formatNumber(s.in_progress_tasks)} tone="warn" />
        <StatTile label="فروخته‌شده" value={formatNumber(s.sold_tasks)} tone="good" hint={s.cancelled_tasks ? `${formatNumber(s.cancelled_tasks)} لغو` : undefined} />
      </div>

      <div className="flex gap-1 self-start rounded-2xl border border-gray-100 p-1 dark:border-white/[0.06]">
        {(
          [
            ["cases", "به تفکیک پرونده"],
            ["timeline", "خط زمانی یکپارچه"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={cn(
              "min-h-9 rounded-xl px-3.5 text-[13px] font-bold transition-all",
              view === key ? "bg-white text-brand shadow-sm dark:bg-transparent" : "text-gray-500 dark:text-gray-400",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "cases" ? (
        <div className="flex flex-col gap-4">
          {data.cases.map((c) => (
            <CaseBlock key={c.id} c={c} />
          ))}
        </div>
      ) : (
        <Card>
          <SectionTitle icon={<History size={16} />} title="همه‌ی رویدادهای مشتری" />
          {data.timeline.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-gray-400">رویدادی ثبت نشده است.</p>
          ) : (
            <ol className="relative space-y-4 border-r-2 border-gray-200 pr-4 dark:border-white/10">
              {data.timeline.map((e, i) => (
                <li key={`${e.at}-${i}`} className="relative">
                  <span
                    className={cn(
                      "absolute -right-[22px] top-1.5 h-3 w-3 rounded-full",
                      EVENT_DOT[e.type] ?? "bg-gray-400",
                    )}
                  />
                  <div className="flex items-center gap-1.5 text-[13px] font-extrabold text-gray-800 dark:text-gray-100">
                    {e.type === "task_sold" && <CheckCircle2 size={13} className="text-emerald-500" />}
                    {e.title}
                  </div>
                  {e.detail && (
                    <div className="text-[13px] leading-6 text-gray-600 dark:text-gray-300">{e.detail}</div>
                  )}
                  <div className="mt-0.5 text-[13px] text-gray-400">{formatJalaliDateTime(e.at)}</div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      )}
    </div>
  );
}
