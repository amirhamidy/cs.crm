export type PathTaskStatus = "in_progress" | "completed" | "cancelled" | "sold";
export type PathCaseStatus = PathTaskStatus | "no_tasks";
export type PathAction = "advanced" | "reverted" | "transferred";

export type TimelineType =
  | "case_created"
  | "task_created"
  | "step_advanced"
  | "step_reverted"
  | "step_transferred"
  | "task_sold"
  | "task_cancelled"
  | "sale";

export interface PathEmployee {
  id: number;
  full_name: string;
}

export interface PathLogEntry {
  log_id: number;
  step_id: number;
  step_name: string;
  action: PathAction;
  action_display: string;
  at: string;
  note: string | null;
  employees: PathEmployee[];
}

export interface PathTask {
  id: number;
  title: string;
  status: PathTaskStatus;
  status_display: string;
  department: { id: number; name: string } | null;
  current_step: { id: number; name: string } | null;
  assigned_employees: PathEmployee[];
  created_at: string;
  completed_at: string | null;
  visited_steps: string[];
  path: PathLogEntry[];
}

export interface PathCase {
  id: number;
  title: string;
  active: boolean;
  status: PathCaseStatus;
  created_at: string;
  sales_count: number;
  sales_total: string;
  tasks: PathTask[];
}

export interface PathTimelineItem {
  at: string;
  type: TimelineType;
  case_id: number | null;
  task_id: number | null;
  title: string;
  detail: string | null;
}

export interface CustomerPathSummary {
  cases_count: number;
  active_cases: number;
  tasks_count: number;
  in_progress_tasks: number;
  sold_tasks: number;
  cancelled_tasks: number;
}

export interface CustomerPath {
  customer: {
    id: number;
    full_name: string;
    company_name: string;
    status: number;
    status_display: string;
  };
  summary: CustomerPathSummary;
  cases: PathCase[];
  timeline: PathTimelineItem[];
}

export interface CustomerScore {
  id: number;
  created_by: number;
  score: number;
  reason: string;
  created_at: string;
}
