import { TaskEmployeeRef } from "@/types/task";

export interface Stage {
    id: string;
    apiId: number;
    name: string;
    color: string;
    order: number;
    description?: string;
}

export interface StageAPIItem {
    id: number;
    department: number;
    name: string;
    description?: string;
    order: number;
}

export interface Employee {
    id: string;
    apiId: number;
    assignmentId?: number;
    name: string;
    role: string;
    avatar?: string;
}

export interface Department {
    id: string;
    apiId: number;
    name: string;
    description: string;
    accent: string;
    stages: Stage[];
    employees: Employee[];
    createdAt: string;
    order?: number;
}

export interface DepartmentAPIItem {
    id: number;
    name: string;
    order: number;
}

export interface EmployeeAPIItem {
    id: number;
    full_name: string;
    username: string;
    created_at: string;
    updated_at: string;
}

export interface DepartmentEmployeeAPIItem {
    id: number;
    employee: number;
    employee_name: string;
    department: number;
    department_name: string;
    created_at: string;
    updated_at: string;
}

export type TaskRelationId = string | number;

export interface TaskRelationObject {
    id: TaskRelationId;
}

export interface TaskCaseObject {
    id?: TaskRelationId;
    title?: string | null;
    name?: string | null;
}

export type TaskRelation = TaskRelationId | TaskRelationObject;

export type TaskAssignee =
    | TaskRelation
    | TaskEmployeeRef
    | Array<TaskRelation | TaskEmployeeRef>;

export interface Task {
    id: string | number;
    title?: string | null;
    name?: string | null;
    description?: string | null;
    status?: string | null;
    priority?: string | null;
    department?: TaskRelation | null;
    department_name?: string | null;
    current_step?: TaskRelation | null;
    current_step_name?: string | null;
    due_date?: string | null;
    deadline?: string | null;
    started_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    case?: TaskRelationId | TaskCaseObject | null;
    case_name?: string | null;
    attachments?: unknown[];
    files?: unknown[];
    assigned_employee?: TaskAssignee | null;
    [key: string]: unknown;
}
