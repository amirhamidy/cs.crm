"use client";

import { useRef, useSyncExternalStore } from "react";
import type { ApiEmployee } from "@/types/users";

export interface UserInfo {
    id: number;
    phone: string | null;
    isActive: boolean | null;
}

export interface UserCardProps {
    employee: ApiEmployee;
    departmentName?: string | null;
    activeTaskTitles?: string[];
    index: number;
    hasActiveTasks?: boolean;
    userInfo?: UserInfo | null;
    score?: number | null;
    onDelete: (id: number) => void;
    onUpdated: (employee: ApiEmployee) => void;
    onScoreChanged?: (
        employeeId: number,
        action: "add" | "deduct",
        amount: number
    ) => void;
}

export type Placement = "left" | "right";

export type ActionKey =
    | "toggleActive"
    | "edit"
    | "adjustScore"
    | "manager"
    | "delete"
    | "password"
    | "avatar";

export type DepartmentMembership = {
    id: number;
    employee: number;
    employee_name: string;
    department: number;
    department_name: string;
    created_at?: string;
    updated_at?: string;
    is_manager?: boolean;
};

/** Shared stable empty array (avoids new [] identities on every render). */
export const EMPTY_TITLES: string[] = [];

export const SWEEP_GRADIENTS: Record<string, string> = {
    edit: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
    adjustScore: "linear-gradient(90deg, #f59e0b, #10b981)",
    manager: "linear-gradient(90deg, #f59e0b, #f97316)",
    delete: "#ef4444",
    password: "linear-gradient(90deg, #6366f1, #8b5cf6)",
    avatar: "linear-gradient(90deg, #10b981, #06b6d4)",
};

export const SHEET_TONES = {
    blue: "border-blue-500/15 bg-blue-500/[0.08] text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/[0.12] dark:text-blue-400",
    emerald:
        "border-emerald-500/15 bg-emerald-500/[0.08] text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/[0.12] dark:text-emerald-400",
    amber:
        "border-amber-500/15 bg-amber-500/[0.08] text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/[0.12] dark:text-amber-400",
    rose: "border-rose-500/15 bg-rose-500/[0.08] text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/[0.12] dark:text-rose-400",
} as const;

export const SHEET_DISABLED =
    "cursor-not-allowed border-black/[0.06] bg-black/[0.03] text-gray-400 opacity-50 dark:border-white/[0.06] dark:bg-white/[0.03]";

export const PANEL_BASE =
    "w-full rounded-[2rem] border border-gray-900/[0.08] bg-white p-5 shadow-xl dark:border-white/[0.08] dark:bg-gray-900";

export const SOFT_BUTTON =
    "rounded-2xl bg-gray-900/5 py-2.5 text-[12.5px] font-bold text-gray-600 disabled:opacity-50 dark:bg-white/5 dark:text-gray-300";

let dateFormatter: Intl.DateTimeFormat | null = null;

export function formatDate(iso?: string | null) {
    if (!iso) return "نامشخص";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "نامشخص";
    if (!dateFormatter) {
        dateFormatter = new Intl.DateTimeFormat("fa-IR", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }
    return dateFormatter.format(date);
}

export function getErrorMessage(error: unknown, fallback: string) {
    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: unknown }).response === "object"
    ) {
        const response = (
            error as {
                response?: {
                    data?: {
                        detail?: string;
                        message?: string;
                    };
                };
            }
        ).response;

        const detail = response?.data?.detail || response?.data?.message;
        if (detail) return detail;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }
    return fallback;
}

let lastRawUser: string | null = null;
let lastLoggedUserId: number | null = null;

function readLoggedUserId(): number | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem("user");
        if (raw === lastRawUser) return lastLoggedUserId;
        lastRawUser = raw;
        const parsed = raw ? JSON.parse(raw) : null;
        lastLoggedUserId = typeof parsed?.id === "number" ? parsed.id : null;
    } catch {
        lastRawUser = null;
        lastLoggedUserId = null;
    }
    return lastLoggedUserId;
}

const subscribeNoop = () => () => { };
const getServerLoggedUserId = () => null;

export function useLoggedUserId() {
    return useSyncExternalStore(
        subscribeNoop,
        readLoggedUserId,
        getServerLoggedUserId
    );
}

/**
 * Keeps `true` forever once `flag` becomes true.
 * Used so a modal stays mounted after its first open and can play its exit animation.
 */
export function useMountedOnce(flag: boolean) {
    const ref = useRef(false);
    if (flag) ref.current = true;
    return ref.current;
}

