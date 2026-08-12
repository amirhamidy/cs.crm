"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
    Briefcase,
    Building2,
    CalendarDays,
    Loader2,
    Pencil,
    Trash2,
    User,
    UserCog,
    X,
} from "lucide-react";

export type CaseStatus = "open" | "in_progress" | "closed" | "cancelled";

export type PersonLike =
    | {
        id?: number | string;
        first_name?: string | null;
        last_name?: string | null;
        full_name?: string | null;
        username?: string | null;
        name?: string | null;
        title?: string | null;
    }
    | number
    | string
    | null
    | undefined;

export interface CaseItem {
    id: number | string;
    title: string;
    description?: string | null;
    status: CaseStatus;
    created_at?: string | null;

    customer?: PersonLike;
    customer_name?: string | null;
    customerName?: string | null;

    department?: PersonLike;
    department_name?: string | null;
    departmentName?: string | null;

    assigned_to?: PersonLike;
    assigned_to_name?: string | null;
    assignedToName?: string | null;
    assignee?: PersonLike;
    responsible?: PersonLike;
}

interface CaseCardProps {
    item: CaseItem;
    index?: number;
    users?: PersonLike[];
    customers?: PersonLike[];
    departments?: PersonLike[];
    isDeleting?: boolean;
    onEdit?: (item: CaseItem) => void;
    onDelete?: (item: CaseItem) => void;
    onClick?: (item: CaseItem) => void;
}

const STATUS_MAP: Record<
    CaseStatus,
    { label: string; light: string; dark: string }
> = {
    open: {
        label: "باز",
        light: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dark: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    },
    in_progress: {
        label: "در حال انجام",
        light: "bg-amber-50 text-amber-700 border-amber-200",
        dark: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    },
    closed: {
        label: "بسته شده",
        light: "bg-sky-50 text-sky-700 border-sky-200",
        dark: "bg-sky-500/10 text-sky-300 border-sky-500/20",
    },
    cancelled: {
        label: "لغو شده",
        light: "bg-rose-50 text-rose-700 border-rose-200",
        dark: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    },
};

const AVATAR_GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#3b82f6", "#6366f1"],
    ["#8b5cf6", "#ec4899"],
    ["#06b6d4", "#6366f1"],
    ["#f59e0b", "#ef4444"],
];

const isFilled = (value?: string | null) =>
    typeof value === "string" && value.trim().length > 0;

const nameFromObject = (value: PersonLike): string => {
    if (!value || typeof value !== "object") return "";
    const full = value.full_name ?? value.name ?? value.title ?? "";
    if (isFilled(full)) return full.trim();
    const composed = `${value.first_name ?? ""} ${value.last_name ?? ""}`.trim();
    if (isFilled(composed)) return composed;
    if (isFilled(value.username)) return value.username!.trim();
    return "";
};

const resolveName = (
    value: PersonLike,
    directName?: string | null,
    pool?: PersonLike[]
): string => {
    if (isFilled(directName)) return directName!.trim();

    const fromObject = nameFromObject(value);
    if (isFilled(fromObject)) return fromObject;

    if (typeof value === "string" && !/^\d+$/.test(value.trim())) {
        return value.trim();
    }

    const identifier =
        typeof value === "number" || typeof value === "string"
            ? String(value)
            : value && typeof value === "object" && value.id !== undefined
                ? String(value.id)
                : "";

    if (!identifier || !pool?.length) return "";

    const found = pool.find(
        (person) =>
            person &&
            typeof person === "object" &&
            person.id !== undefined &&
            String(person.id) === identifier
    );

    return nameFromObject(found);
};

const formatDate = (value?: string | null) => {
    if (!isFilled(value)) return "";
    const date = new Date(value!);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(date);
};

export default function CaseCard({
    item,
    index = 0,
    users,
    customers,
    departments,
    isDeleting = false,
    onEdit,
    onDelete,
    onClick,
}: CaseCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [hovered, setHovered] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const status = STATUS_MAP[item.status] ?? STATUS_MAP.open;

    const customerName = useMemo(
        () =>
            resolveName(
                item.customer,
                item.customerName ?? item.customer_name,
                customers
            ) || "بدون مشتری",
        [item.customer, item.customerName, item.customer_name, customers]
    );

    const departmentName = useMemo(
        () =>
            resolveName(
                item.department,
                item.departmentName ?? item.department_name,
                departments
            ) || "بدون دپارتمان",
        [item.department, item.departmentName, item.department_name, departments]
    );

    const assigneeName = useMemo(
        () =>
            resolveName(
                item.assigned_to ?? item.assignee ?? item.responsible,
                item.assignedToName ?? item.assigned_to_name,
                users
            ) || "بدون مسئول",
        [
            item.assigned_to,
            item.assignee,
            item.responsible,
            item.assignedToName,
            item.assigned_to_name,
            users,
        ]
    );

    const createdAt = formatDate(item.created_at);
    const gradient = AVATAR_GRADIENTS[Number(item.id) % AVATAR_GRADIENTS.length];

    const handleDelete = async () => {
        if (!onDelete) return;
        setDeleteLoading(true);
        setDeleteError(null);
        try {
            await onDelete(item);
            setShowConfirm(false);
        } catch {
            setDeleteError("خطا در حذف کیس. دوباره تلاش کن.");
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleClose = () => {
        if (deleteLoading) return;
        setShowConfirm(false);
        setDeleteError(null);
    };

    return (
        <>
            <motion.article
                layout
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{
                    duration: 0.35,
                    delay: Math.min(index * 0.04, 0.24),
                    ease: [0.22, 1, 0.36, 1],
                }}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                onClick={() => onClick?.(item)}
                className="group relative overflow-hidden rounded-2xl p-4"
                style={{
                    border: isDark
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "1px solid rgba(0,0,0,0.06)",
                    background: isDark ? "rgba(255,255,255,0.02)" : "#fafafa",
                    minHeight: "130px",
                    pointerEvents: isDeleting ? "none" : undefined,
                    opacity: isDeleting ? 0.45 : 1,
                    boxShadow: isDark
                        ? "0 2px 24px rgba(0,0,0,0.2)"
                        : "0 2px 16px rgba(0,0,0,0.04)",
                    cursor: onClick ? "pointer" : "default",
                }}
                dir="rtl"
            >
                <svg
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    style={{ borderRadius: "1rem" }}
                >
                    <defs>
                        <linearGradient id={`caseBorder-${item.id}`} x1="100%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
                    <motion.rect
                        x="1"
                        y="1"
                        width="calc(100% - 2px)"
                        height="calc(100% - 2px)"
                        rx="15"
                        ry="15"
                        fill="none"
                        stroke={`url(#caseBorder-${item.id})`}
                        strokeWidth="1.5"
                        pathLength="1"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={
                            hovered
                                ? { pathLength: 1, opacity: 1 }
                                : { pathLength: 0, opacity: 0 }
                        }
                        transition={{ duration: 0.55, ease: "easeInOut" }}
                    />
                </svg>

                <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                        background: isDark
                            ? "linear-gradient(135deg, rgba(99,102,241,0.08), transparent 55%)"
                            : "linear-gradient(135deg, rgba(99,102,241,0.06), transparent 55%)",
                    }}
                />

                <div className="relative flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                        <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                            style={{
                                border: isDark
                                    ? "1px solid rgba(255,255,255,0.06)"
                                    : "1px solid rgba(0,0,0,0.06)",
                                background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                                color: isDark ? "#a5b4fc" : "#6366f1",
                            }}
                        >
                            <Briefcase size={18} />
                        </div>

                        <div className="min-w-0">
                            <h3
                                className="truncate text-[13.5px] font-extrabold leading-tight"
                                style={{ color: isDark ? "#f1f5f9" : "#1e293b" }}
                            >
                                {item.title}
                            </h3>

                            {isFilled(item.description) && (
                                <p
                                    className="mt-1 line-clamp-1 text-[12px] leading-6"
                                    style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                                >
                                    {item.description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div
                        className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-bold backdrop-blur-sm ${isDark ? status.dark : status.light
                            }`}
                    >
                        <span
                            className={`h-1.5 w-1.5 rounded-full bg-current ${item.status === "in_progress" ? "animate-pulse" : ""
                                }`}
                        />
                        {status.label}
                    </div>
                </div>

                <div className="relative mt-4 flex flex-wrap items-center gap-2 border-t pt-3.5"
                    style={{
                        borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                    }}
                >
                    <div className="flex items-center gap-2 rounded-full px-2.5 py-1"
                        style={{
                            border: isDark
                                ? "1px solid rgba(255,255,255,0.06)"
                                : "1px solid rgba(0,0,0,0.06)",
                            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                        }}
                    >
                        <User size={11} className={isDark ? "text-slate-500" : "text-slate-400"} />
                        <span
                            className="text-[10.5px] font-bold"
                            style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                        >
                            {customerName}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 rounded-full px-2.5 py-1"
                        style={{
                            border: isDark
                                ? "1px solid rgba(255,255,255,0.06)"
                                : "1px solid rgba(0,0,0,0.06)",
                            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                        }}
                    >
                        <Building2 size={11} className={isDark ? "text-slate-500" : "text-slate-400"} />
                        <span
                            className="text-[10.5px] font-bold"
                            style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                        >
                            {departmentName}
                        </span>
                    </div>

                    <div
                        className="flex items-center gap-2 rounded-full py-1 pl-3 pr-1"
                        style={{
                            border: isDark
                                ? "1px solid rgba(255,255,255,0.06)"
                                : "1px solid rgba(0,0,0,0.06)",
                            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                        }}
                    >
                        <span
                            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold text-white"
                            style={{
                                background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                            }}
                        >
                            {assigneeName.charAt(0)}
                        </span>
                        <span
                            className="text-[10.5px] font-bold"
                            style={{ color: isDark ? "#cbd5e1" : "#475569" }}
                        >
                            {assigneeName}
                        </span>
                    </div>

                    {isFilled(createdAt) && (
                        <div
                            className="mr-auto flex items-center gap-1.5 text-[10.5px] font-medium"
                            style={{ color: isDark ? "#64748b" : "#94a3b8" }}
                        >
                            <CalendarDays size={11} />
                            {createdAt}
                        </div>
                    )}
                </div>

                <div className="relative mt-3 flex items-center justify-end gap-1.5">
                    {onEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(item);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-xl transition-colors"
                            style={{
                                background: isDark
                                    ? "rgba(99,102,241,0.1)"
                                    : "rgba(99,102,241,0.07)",
                                color: isDark ? "#a5b4fc" : "#6366f1",
                            }}
                        >
                            <Pencil size={11} />
                        </button>
                    )}

                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowConfirm(true);
                            }}
                            disabled={isDeleting}
                            className="flex h-7 w-7 items-center justify-center rounded-xl transition-colors disabled:opacity-40"
                            style={{
                                background: isDark
                                    ? "rgba(239,68,68,0.1)"
                                    : "rgba(239,68,68,0.07)",
                                color: "#ef4444",
                            }}
                        >
                            {isDeleting ? (
                                <Loader2 size={11} className="animate-spin" />
                            ) : (
                                <Trash2 size={11} />
                            )}
                        </button>
                    )}
                </div>
            </motion.article>

            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        style={{
                            background: "rgba(0,0,0,0.5)",
                            backdropFilter: "blur(4px)",
                        }}
                        onClick={handleClose}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 16, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 16, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="w-full max-w-[360px] overflow-hidden rounded-[2rem] border p-5"
                            style={{
                                background: isDark ? "#0f172a" : "#ffffff",
                                borderColor: isDark
                                    ? "rgba(255,255,255,0.07)"
                                    : "rgba(0,0,0,0.07)",
                                boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                            dir="rtl"
                        >
                            <div
                                className="flex items-center justify-between border-b px-2 py-2"
                                style={{
                                    borderColor: isDark
                                        ? "rgba(255,255,255,0.06)"
                                        : "rgba(0,0,0,0.06)",
                                }}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="flex h-8 w-8 items-center justify-center rounded-xl"
                                        style={{
                                            background: isDark
                                                ? "rgba(239,68,68,0.12)"
                                                : "rgba(239,68,68,0.08)",
                                        }}
                                    >
                                        <Trash2 size={14} className="text-red-500" />
                                    </div>
                                    <h3
                                        className="text-[13.5px] font-extrabold"
                                        style={{ color: isDark ? "#ffffff" : "#0f172a" }}
                                    >
                                        حذف کیس
                                    </h3>
                                </div>
                                <button
                                    onClick={handleClose}
                                    disabled={deleteLoading}
                                    className="flex h-7 w-7 items-center justify-center rounded-xl transition-colors disabled:opacity-40"
                                    style={{
                                        background: isDark
                                            ? "rgba(255,255,255,0.05)"
                                            : "rgba(0,0,0,0.04)",
                                        color: isDark ? "#94a3b8" : "#64748b",
                                    }}
                                    type="button"
                                >
                                    <X size={13} />
                                </button>
                            </div>

                            <div className="flex flex-col gap-4 px-2 py-4">
                                <p
                                    className="text-[12.5px] leading-relaxed"
                                    style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                                >
                                    کیس{" "}
                                    <span
                                        className="font-extrabold"
                                        style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}
                                    >
                                        {item.title}
                                    </span>{" "}
                                    حذف خواهد شد. این عملیات قابل بازگشت نیست.
                                </p>

                                {deleteError && (
                                    <p className="text-center text-[11.5px] font-semibold text-red-500">
                                        {deleteError}
                                    </p>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleClose}
                                        disabled={deleteLoading}
                                        className="flex-1 rounded-2xl py-2.5 text-[12.5px] font-bold transition-colors disabled:opacity-40"
                                        style={{
                                            background: isDark
                                                ? "rgba(255,255,255,0.05)"
                                                : "rgba(0,0,0,0.04)",
                                            color: isDark ? "#94a3b8" : "#64748b",
                                        }}
                                        type="button"
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleteLoading}
                                        className="flex flex-1 items-center justify-center rounded-2xl py-2.5 text-[12.5px] font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                                        style={{
                                            background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                            boxShadow: "0 4px 14px rgba(239,68,68,0.3)",
                                        }}
                                        type="button"
                                    >
                                        {deleteLoading ? (
                                            <Loader2 size={15} className="animate-spin" />
                                        ) : (
                                            <>
                                                <Trash2 size={13} className="ml-1.5" />
                                                حذف کن
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}