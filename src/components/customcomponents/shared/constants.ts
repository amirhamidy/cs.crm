import type { TaskStatus } from "@/types/task";

export const taskStatusLabels: Record<TaskStatus, string> = {
  cancelled: "لغو شده",
  in_progress: "در حال انجام",
  completed: "تکمیل شده",
  sold: "فروش",
};

export const taskStatusColors: Record<TaskStatus, string> = {
  cancelled: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  in_progress: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  completed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  sold: "border-rose-500/20 bg-rose-500/10 text-rose-400",
};
