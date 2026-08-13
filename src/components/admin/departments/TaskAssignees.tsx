"use client";

import { Loader } from "lucide-react";
import { useEmployeeInfo } from "@/hooks/useEmployeeInfo";

interface TaskAssigneesProps {
    ids?: (number | string | { id: number | string } | null | undefined)[];
    size?: "sm" | "md";
    limit?: number;
    className?: string;
}

const normalizeId = (
    value: number | string | { id: number | string } | null | undefined
): number | null => {
    if (value === null || value === undefined) return null;
    let id: number | string;
    if (typeof value === "object") id = value.id;
    else id = value;
    if (id === null || id === undefined) return null;
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
};

const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "؟";
    const first = parts[0].charAt(0);
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
    return (first + last).trim() || "؟";
};

function AssigneeAvatar({ id, size }: { id: number; size: "sm" | "md" }) {
    const { data, loading } = useEmployeeInfo(id);

    const sizeCls =
        size === "md"
            ? "h-8 w-8 text-[10px]"
            : "h-6 w-6 text-[9px]";

    return (
        <div
            title={data?.full_name}
            className={`${sizeCls} flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-white transition-colors dark:ring-[#0f172a]`}
            style={{
                background:
                    loading || !data
                        ? "rgba(99,102,241,0.45)"
                        : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            }}
        >
            {loading || !data ? (
                <Loader size={9} className="animate-spin" />
            ) : (
                getInitials(data.full_name)
            )}
        </div>
    );
}

export default function TaskAssignees({
    ids = [],
    size = "sm",
    limit = 3,
    className = "",
}: TaskAssigneesProps) {
    const list = ids
        .map(normalizeId)
        .filter((v): v is number => v !== null);

    if (list.length === 0) return null;

    const visible = list.slice(0, limit);
    const extra = list.length - visible.length;

    return (
        <div className={`flex items-center ${className}`}>
            <div className="flex -space-x-2 rtl:space-x-reverse">
                {visible.map((id) => (
                    <AssigneeAvatar key={id} id={id} size={size} />
                ))}
                {extra > 0 && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[9px] font-bold text-indigo-600 ring-2 ring-white dark:bg-indigo-500/20 dark:text-indigo-400 dark:ring-[#0f172a]">
                        +{extra}
                    </div>
                )}
            </div>
        </div>
    );
}
