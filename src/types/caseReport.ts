export interface CaseReportScoreItem {
    score: number;
    reason: string;
    by: string;
    created_at: string;
}

export interface CaseReportPerson {
    id: number;
    full_name: string;
}

export interface CaseReportScoreTotals {
    deducted: number;
    added: number;
    net: number;
}

export interface CaseReportTask {
    id: number;
    title: string;
    description: string;
    status: string;
    status_display: string;
    department: { id: number; name: string } | null;
    current_step: { id: number; name: string } | null;
    assigned_employees: CaseReportPerson[];
    created_by: string;
    created_at: string;
    completed_at: string | null;
    duration_seconds: number;
    counts: {
        advanced: number;
        reverted: number;
        transferred: number;
        attachments: number;
        overdue_steps: number;
    };
}

export interface CaseReportOrderItem {
    id: number;
    product_name: string;
    quantity: number;
    completed_quantity: number;
    unit_price: number | null;
    line_total: number | null;
    status: string;
    status_display: string;
    error_message: string | null;
}

export interface CaseReportOrderTask {
    id: number;
    task_id: number;
    title: string;
    note: string;
    status: string;
    status_display: string;
    warehouse: { id: number; name: string } | null;
    current_step: string;
    performed_by: string | null;
    created_at: string;
    items: CaseReportOrderItem[];
    total_amount: number;
    deadline: { deadline: string | null; is_overdue: boolean } | null;
}

export interface CaseReportTimelineEvent {
    at: string;
    type: string;
    title: string;
    detail?: string;
    note?: string;
    task_id?: number;
    order_task_id?: number;
}

export interface CaseReport {
    generated_at: string;
    case: {
        id: number;
        title: string;
        description: string;
        active: boolean;
        created_by: string;
        created_at: string;
    };
    customer: {
        id: number;
        full_name: string;
        job_title: string;
        phone_number: string;
        company_name: string;
        address: string;
        status_display: string;
        scores: { count: number; average: number; items: CaseReportScoreItem[] };
    };
    summary: {
        tasks_count: number;
        tasks_by_status: Record<string, number>;
        order_tasks_count: number;
        order_tasks_by_status: Record<string, number>;
        total_order_amount: number;
        total_duration_seconds: number;
        step_actions: { advanced: number; reverted: number; transferred: number };
        attachments_count: number;
        overdue_steps: number;
        scores: CaseReportScoreTotals;
        involved_employees: CaseReportPerson[];
    };
    tasks: CaseReportTask[];
    order_tasks: CaseReportOrderTask[];
    timeline: CaseReportTimelineEvent[];
}
