import type {
    Names,
    ProjectTask,
    Routine,
    Ticket,
    TicketAttachment,
} from "./types";

type Rec = Record<string, unknown>;

const isRec = (value: unknown): value is Rec =>
    typeof value === "object" && value !== null;

const str = (value: unknown): string =>
    typeof value === "string" ? value : "";

const num = (value: unknown): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "") return Number(value);
    return NaN;
};

const idOf = (value: unknown): number => {
    if (isRec(value)) return num(value.id);
    return num(value);
};

const usernameOf = (value: unknown): string => {
    if (!isRec(value)) return "";
    return str(value.username).trim();
};

export function unwrapList(data: unknown): unknown[] {
    if (Array.isArray(data)) return data;
    if (isRec(data) && Array.isArray(data.results)) return data.results;
    return [];
}

function normalizeAttachment(raw: unknown): TicketAttachment | null {
    if (!isRec(raw)) return null;
    const id = num(raw.id);
    if (!Number.isFinite(id)) return null;
    const uploadedBy = idOf(raw.uploaded_by);
    return {
        id,
        note: str(raw.note).trim(),
        fileName: str(raw.original_file_name),
        uploadedBy: Number.isFinite(uploadedBy) ? uploadedBy : null,
        createdAt: str(raw.created_at),
    };
}

export function normalizeTickets(list: unknown[]): Ticket[] {
    const out: Ticket[] = [];

    for (const raw of list) {
        if (!isRec(raw)) continue;

        const id = num(raw.id);
        if (!Number.isFinite(id) || id <= 0) continue;

        const assignedIds = (Array.isArray(raw.assigned_to) ? raw.assigned_to : [])
            .map(idOf)
            .filter(Number.isFinite);

        const attachments = (Array.isArray(raw.attachments) ? raw.attachments : [])
            .map(normalizeAttachment)
            .filter((a): a is TicketAttachment => a !== null)
            .sort((a, b) => a.id - b.id);

        const createdByValue = raw.created_by;
        const createdBy = str(createdByValue).trim() || usernameOf(createdByValue);

        out.push({
            id,
            title: str(raw.title),
            status: str(raw.status),
            assignedIds,
            deadline: str(raw.deadline) || null,
            createdBy,
            createdAt: str(raw.created_at),
            updatedAt: str(raw.updated_at),
            attachments,
        });
    }

    return out;
}

export function normalizeRoutines(list: unknown[]): Routine[] {
    const out: Routine[] = [];

    for (const raw of list) {
        if (!isRec(raw)) continue;

        const id = num(raw.id);
        const task = idOf(raw.task);

        if (!Number.isFinite(id) || !Number.isFinite(task)) continue;

        out.push({
            id,
            task,
            nextRunAt: str(raw.next_run_at) || null,
            isActive: raw.is_active !== false,
        });
    }

    return out;
}

/** assigned_employee شناسه‌ی «کارمند» است (نه کاربر)؛ عدد ساده یا آبجکت را هندل می‌کند */
function resolveAssigneeId(value: unknown): number {
    if (isRec(value)) {
        const raw = value.employee_id ?? value.employee ?? value.id ?? NaN;
        if (isRec(raw)) return num(raw.id);
        return num(raw);
    }
    return num(value);
}

export function normalizeProjectTasks(list: unknown[]): ProjectTask[] {
    const out: ProjectTask[] = [];

    for (const raw of list) {
        if (!isRec(raw)) continue;

        const id = num(raw.id);
        if (!Number.isFinite(id) || id <= 0) continue;

        // فقط فیلدهای مربوط به کارمند؛ assigned_to (شناسه‌ی کاربر) عمداً نیست
        const assignedRaw = raw.assigned_employee ?? raw.assigned_employees;

        const assignedIds = (
            Array.isArray(assignedRaw)
                ? assignedRaw.map(resolveAssigneeId)
                : assignedRaw != null
                    ? [resolveAssigneeId(assignedRaw)]
                    : []
        ).filter(Number.isFinite);

        const step = idOf(raw.current_step);

        out.push({
            id,
            title: str(raw.title),
            status: str(raw.status),
            currentStep: Number.isFinite(step) ? step : -1,
            assignedIds,
            departmentName: str(raw.department_name),
            stepName: str(raw.current_step_name),
            updatedAt: str(raw.updated_at) || str(raw.created_at),
        });
    }

    return out;
}

export function buildNames(list: unknown[]): Names {
    const byId = new Map<number, string>();
    const byUsername = new Map<string, string>();

    for (const raw of list) {
        if (!isRec(raw)) continue;

        const id = num(raw.id);
        const fullName = str(raw.full_name).trim();
        const username = str(raw.username).trim().toLowerCase();
        const label = fullName || str(raw.username).trim();

        if (!label) continue;

        if (Number.isFinite(id)) byId.set(id, label);
        if (username) byUsername.set(username, label);
    }

    return { byId, byUsername };
}

/** شناسه‌ی «کارمند» را از روی username کاربر لاگین‌شده پیدا می‌کند */
export function resolveEmployeeId(
    list: unknown[],
    username: string | null,
): number | null {
    const target = username?.trim().toLowerCase();
    if (!target) return null;

    for (const raw of list) {
        if (!isRec(raw)) continue;
        if (str(raw.username).trim().toLowerCase() !== target) continue;

        const id = num(raw.id);
        return Number.isFinite(id) ? id : null;
    }

    return null;
}
