import {
    ApiOrderTask,
    ApiOrderTaskDeadline,
    ApiStockInfo,
    ApiStockTransaction,
    ApiWarehouseStaff,
    ApiWarehouseTask,
} from "@/types/warehouse";

export type WarehouseTab =
    | "overview"
    | "tasks"
    | "stock"
    | "transactions"
    | "orders"
    | "deadlines";

export const PAGE_SIZE = 8;

export const extractList = <T,>(value: unknown): T[] => {
    if (Array.isArray(value)) return value as T[];

    if (value && typeof value === "object") {
        const data = value as Record<string, unknown>;

        if (Array.isArray(data.results)) return data.results as T[];
        if (Array.isArray(data.data)) return data.data as T[];
        if (Array.isArray(data.items)) return data.items as T[];
    }

    return [];
};

export const getEmployeeId = (employee: unknown): number | string | null => {
    if (!employee || typeof employee !== "object") return null;

    const data = employee as Record<string, unknown>;

    if (typeof data.id === "number" || typeof data.id === "string") {
        return data.id;
    }

    return null;
};

export const getStaffEmployeeId = (
    staff: ApiWarehouseStaff
): number | string | null => {
    const data = staff as unknown as Record<string, unknown>;

    if (
        typeof data.employee_id === "number" ||
        typeof data.employee_id === "string"
    ) {
        return data.employee_id;
    }

    if (
        typeof data.employee === "number" ||
        typeof data.employee === "string"
    ) {
        return data.employee;
    }

    if (data.employee && typeof data.employee === "object") {
        const employee = data.employee as Record<string, unknown>;

        if (
            typeof employee.id === "number" ||
            typeof employee.id === "string"
        ) {
            return employee.id;
        }
    }

    return null;
};

export const sameId = (
    first: number | string | null | undefined,
    second: number | string | null | undefined
) => {
    if (first === null || first === undefined) return false;
    if (second === null || second === undefined) return false;

    return String(first) === String(second);
};

export const isActiveStaff = (staff: ApiWarehouseStaff) => {
    const data = staff as unknown as Record<string, unknown>;
    return data.is_active === true;
};

export const findEmployeeStaff = (
    staff: ApiWarehouseStaff[],
    employeeId: number | string | null
) => {
    if (!employeeId) return null;

    return (
        staff.find(
            (item) =>
                isActiveStaff(item) &&
                sameId(getStaffEmployeeId(item), employeeId)
        ) ?? null
    );
};

export const getTaskAssigneeId = (
    task: ApiWarehouseTask
): number | string | null => {
    const data = task as unknown as Record<string, unknown>;

    if (
        typeof data.assigned_to === "number" ||
        typeof data.assigned_to === "string"
    ) {
        return data.assigned_to;
    }

    if (data.assigned_to && typeof data.assigned_to === "object") {
        const assigned = data.assigned_to as Record<string, unknown>;

        if (
            typeof assigned.id === "number" ||
            typeof assigned.id === "string"
        ) {
            return assigned.id;
        }

        if (
            typeof assigned.employee_id === "number" ||
            typeof assigned.employee_id === "string"
        ) {
            return assigned.employee_id;
        }
    }

    if (
        typeof data.employee_id === "number" ||
        typeof data.employee_id === "string"
    ) {
        return data.employee_id;
    }

    if (
        typeof data.employee === "number" ||
        typeof data.employee === "string"
    ) {
        return data.employee;
    }

    return null;
};

export const isTaskMine = (
    task: ApiWarehouseTask,
    employeeId: number | string | null,
    staffId: number | string | null
) => {
    const assignee = getTaskAssigneeId(task);

    return (
        sameId(assignee, employeeId) ||
        sameId(assignee, staffId)
    );
};

export const getTaskStatus = (task: ApiWarehouseTask) => {
    const data = task as unknown as Record<string, unknown>;

    return String(data.status ?? "").toLowerCase();
};

export const getStatusLabel = (status: unknown) => {
    const value = String(status ?? "").toLowerCase();

    const map: Record<string, string> = {
        pending: "در انتظار",
        waiting: "در انتظار",
        created: "ایجاد شده",
        assigned: "اختصاص داده شده",
        in_progress: "در حال انجام",
        processing: "در حال پردازش",
        completed: "تکمیل شده",
        done: "انجام شده",
        cancelled: "لغو شده",
        canceled: "لغو شده",
        rejected: "رد شده",
        failed: "ناموفق",
        received: "دریافت شده",
        partial: "دریافت ناقص",
    };

    return map[value] ?? String(status || "نامشخص");
};

export const getStatusTone = (status: unknown) => {
    const value = String(status ?? "").toLowerCase();

    if (
        ["completed", "done", "received"].includes(value)
    ) {
        return "success";
    }

    if (
        ["cancelled", "canceled", "rejected", "failed"].includes(value)
    ) {
        return "danger";
    }

    if (
        ["in_progress", "processing", "assigned"].includes(value)
    ) {
        return "warning";
    }

    return "neutral";
};

export const getStockStatus = (
    stock: ApiStockInfo
): {
    label: string;
    tone: "success" | "warning" | "danger" | "neutral";
} => {
    const data = stock as unknown as Record<string, unknown>;

    const current = Number(
        data.current_quantity ??
            data.quantity ??
            data.stock ??
            data.available_quantity ??
            0
    );

    const minimum = Number(
        data.minimum_quantity ??
            data.min_quantity ??
            data.min_stock ??
            0
    );

    const maximum = Number(
        data.maximum_quantity ??
            data.max_quantity ??
            data.max_stock ??
            0
    );

    if (maximum > 0 && current >= maximum) {
        return {
            label: "ظرفیت کامل",
            tone: "danger",
        };
    }

    if (minimum > 0 && current <= minimum) {
        return {
            label: "موجودی کم",
            tone: "warning",
        };
    }

    return {
        label: "مناسب",
        tone: "success",
    };
};

export const getProductName = (value: unknown) => {
    if (!value) return "کالای نامشخص";

    if (typeof value === "string" || typeof value === "number") {
        return String(value);
    }

    if (typeof value === "object") {
        const data = value as Record<string, unknown>;

        return String(
            data.name ??
                data.title ??
                data.product_name ??
                data.label ??
                data.code ??
                "کالای نامشخص"
        );
    }

    return "کالای نامشخص";
};

export const getTaskProductName = (task: ApiWarehouseTask) => {
    const data = task as unknown as Record<string, unknown>;

    return getProductName(
        data.product ??
            data.product_name ??
            data.item ??
            data.warehouse_product
    );
};

export const getStockProductName = (stock: ApiStockInfo) => {
    const data = stock as unknown as Record<string, unknown>;

    return getProductName(
        data.product ??
            data.product_name ??
            data.item
    );
};

export const getTransactionProductName = (
    transaction: ApiStockTransaction
) => {
    const data = transaction as unknown as Record<string, unknown>;

    return getProductName(
        data.product ??
            data.product_name ??
            data.item
    );
};

export const formatNumber = (value: unknown) => {
    const number = Number(value);

    if (!Number.isFinite(number)) return "۰";

    return new Intl.NumberFormat("fa-IR", {
        maximumFractionDigits: 2,
    }).format(number);
};

export const formatDate = (value: unknown) => {
    if (!value) return "—";

    const date = new Date(String(value));

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

export const paginate = <T,>(
    items: T[],
    page: number,
    pageSize = PAGE_SIZE
) => {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * pageSize;

    return {
        items: items.slice(start, start + pageSize),
        page: safePage,
        totalPages,
        total: items.length,
    };
};

export const getOrderTaskTitle = (task: ApiOrderTask) => {
    const data = task as unknown as Record<string, unknown>;

    return String(
        data.title ??
            data.name ??
            data.description ??
            data.order_number ??
            `سفارش #${data.id ?? "—"}`
    );
};

export const getDeadlineDate = (
    deadline: ApiOrderTaskDeadline
) => {
    const data = deadline as unknown as Record<string, unknown>;

    return (
        data.deadline ??
        data.due_date ??
        data.due_at ??
        data.end_date ??
        data.date ??
        null
    );
};

export const matchesSearch = (
    values: unknown[],
    search: string
) => {
    if (!search.trim()) return true;

    const query = search.trim().toLowerCase();

    return values.some((value) =>
        String(value ?? "")
            .toLowerCase()
            .includes(query)
    );
};

export const getTransactionTypeLabel = (value: unknown) => {
    const type = String(value ?? "").toLowerCase();

    const map: Record<string, string> = {
        in: "ورود",
        inbound: "ورود",
        receive: "دریافت",
        received: "دریافت",
        out: "خروج",
        outbound: "خروج",
        issue: "خروج",
        issued: "خروج",
        transfer: "انتقال",
        adjustment: "اصلاح موجودی",
    };

    return map[type] ?? String(value || "عملیات");
};

export const getQuantityFromStock = (stock: ApiStockInfo) => {
    const data = stock as unknown as Record<string, unknown>;

    return (
        data.current_quantity ??
        data.quantity ??
        data.stock ??
        data.available_quantity ??
        0
    );
};

export const getTransactionQuantity = (
    transaction: ApiStockTransaction
) => {
    const data = transaction as unknown as Record<string, unknown>;

    return (
        data.quantity ??
        data.amount ??
        data.qty ??
        0
    );
};