import { TaskStatus } from "@/types/task";
import { CaseStatus } from "@/types/case";

export const taskStatusLabels = {
  in_progress: "در حال انجام",
  completed: "تکمیل شده",
  cancelled: "لغو شده",
  sold: "فروخته شده",
} as const;

export const caseStatusLabels = {
  open: "باز",
  in_progress: "در حال انجام",
  closed: "بسته شده",
  cancelled: "لغو شده",
} as const;