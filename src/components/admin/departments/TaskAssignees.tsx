"use client";

import { UserRound, Loader } from "lucide-react";
import { useEmployeeInfo } from "@/hooks/useEmployeeInfo";
import type { TaskAssignee, TaskRelation, TaskRelationObject } from "./types";

interface TaskAssigneesProps {
    ids: TaskAssignee | null | undefined;
    size?: "sm" | "md";
    limit?: number;
    className?: string;
}

const isRelationObject = (
    value: unknown
): value is TaskRelationObject => {
    return (
        typeof value === "object" &&
        value !== null &&
        "id" in (value as Record<string, unknown>)
    );
};

const normalizeId = (value: unknown): number | null => {
    if (value === null || value === undefined) return null;

    let raw: unknown;

    if (isRelationObject(value)) {
        raw = (value as TaskRelationObject).id;
    } else {
        raw = value;
    }

    if (raw === null || raw === undefined) return null;

    const n = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(n) ? n : null;
};

const flattenAssignee = (value: TaskAssignee | null | undefined): unknown[] => {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) return value;
    return [value];
};

const gradients: [string, string][] = [
    ["#6366f1", "#8b5cf6"],
    ["#ec4899", "#f43f5e"],
    ["#0ea5e9", "#22d3ee"],
    ["#10b981", "#22c55e"],
    ["#f59e0b", "#f97316"],
];

const gradientForId = (id: number): [string, string] => {
    const safeId = Number.isFinite(id) ? Math.abs(Math.trunc(id)) : 0;
    const gradientIndex = safeId % gradients.length;
    return gradients[gradientIndex];
};

function AssigneePill({ id, size }: { id: number; size: "sm" | "md" }) {
    const { data, loading } = useEmployeeInfo(id);
    const gradient = gradientForId(id);

    const iconCls = size === "md" ? "h-6 w-6" : "h-5 w-5";
    const textCls = size === "md" ? "text-[11.5px]" : "text-[10.5px]";

    return (
        <div className="flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-black/[0.03] py-0.5 pl-2.5 pr-0.5 dark:border-white/[0.06] dark:bg-white/[0.04]">
            <span
                className={`flex ${iconCls} shrink-0 items-center justify-center rounded-full text-white`}
                style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
            >
                {loading || !data ? (
                    <Loader size={9} className="animate-spin" />
                ) : (
                    <UserRound size={11} />
                )}
            </span>
            <span className={`${textCls} whitespace-nowrap font-bold text-gray-600 dark:text-gray-300`}>
                {loading || !data ? "..." : data.full_name}
            </span>
        </div>
    );
}

export default function TaskAssignees({
    ids,
    size = "sm",
    limit = 3,
    className = "",
}: TaskAssigneesProps) {
    const list = flattenAssignee(ids)
        .map((v) => normalizeId(v))
        .filter((v): v is number => v !== null);

    if (list.length === 0) return null;

    const visible = list.slice(0, limit);
    const extraCount = list.length - visible.length;

    return (
        <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
            {visible.map((id) => (
                <AssigneePill key={id} id={id} size={size} />
            ))}
            {extraCount > 0 && (
                <div className="flex h-5 items-center justify-center rounded-full bg-indigo-100 px-2 text-[9px] font-bold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                    +{extraCount}
                </div>
            )}
        </div>
    );
}