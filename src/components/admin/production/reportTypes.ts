// نوع‌های پاسخ report/highlights/ و report/downtime/ و کمک‌تابع‌های تاریخ

export type GroupBy = "day" | "week" | "month" | "year";

export interface EmployeeRow {
    employee_id: number;
    employee_name: string;
    logs: number;
    hours: number;
    produced: number;
    waste: number;
    expected_production: number;
    expected_waste: number;
    efficiency: number | null;
    waste_percent: number | null;
    waste_diff: number;
    rank?: number;
}

export interface CauseEntry {
    cause_id: number | null;
    cause_name: string;
    logs: number;
    downtime_minutes: number;
    downtime_hours: number;
    share_percent: number | null;
}

export interface MachineBreakdown {
    machine_id: number;
    machine_name: string;
    machine_code: string;
    total_minutes: number;
    total_hours: number;
    top_cause: CauseEntry | null;
    causes: CauseEntry[];
}

export interface HighlightsReport {
    date_from: string;
    date_to: string;
    production: { metric: string; ranked_count: number; best: EmployeeRow | null; worst: EmployeeRow | null; ranking: EmployeeRow[] };
    waste: { metric: string; ranked_count: number; lowest: EmployeeRow | null; highest: EmployeeRow | null; ranking: EmployeeRow[] };
    breakdown: {
        total_minutes: number;
        total_hours: number;
        no_cause_minutes: number;
        top_cause: CauseEntry | null;
        causes: CauseEntry[];
        by_machine: MachineBreakdown[];
    };
}

export interface DowntimeMetrics {
    hours: number;
    downtime_minutes: number;
    downtime_hours: number;
    events: number;
    downtime_percent: number | null;
}

export interface DowntimePeriod extends DowntimeMetrics {
    key: string;
    label: string;
    date_from: string;
    date_to: string;
}

export interface DowntimeMachine extends DowntimeMetrics {
    machine_id: number;
    machine_name: string;
    machine_code: string;
    periods: DowntimePeriod[];
    series: Record<string, number[]>;
}

export interface DowntimeReport {
    group_by: GroupBy;
    date_from: string;
    date_to: string;
    labels: string[];
    totals: DowntimeMetrics;
    periods: DowntimePeriod[];
    series: Record<string, number[]>;
    machines: DowntimeMachine[];
}

const pad = (n: number) => String(n).padStart(2, "0");

/** تاریخ محلی به شکل YYYY-MM-DD (بدون جابه‌جایی منطقه‌ی زمانی) */
export function isoDaysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** بازه‌ی پیش‌فرض (روز) برای هر نوع تفکیک؛ با محدودیت‌های API سازگار است */
export const DEFAULT_SPAN_DAYS: Record<GroupBy, number> = {
    day: 30,
    week: 90,
    month: 365,
    year: 1825,
};
