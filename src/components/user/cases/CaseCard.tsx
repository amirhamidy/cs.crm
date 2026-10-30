"use client";

import CaseReportModal from "./CaseReportModal";
import { memo, useEffect, useState, useRef, useCallback, useMemo } from "react";
import type { ReactNode, MouseEvent as ReactMouseEvent } from "react";
import { m, AnimatePresence, animate } from "framer-motion";
import { useTheme } from "next-themes";
import { Trash2, SquarePen, CalendarDays, Loader2, MoreVertical, AlertCircle, User, Building2, ListTodo, FileText } from "lucide-react";
import type { CaseItem } from "@/types/case";
import type { Customer } from "@/types/customer";
import type { Department } from "@/types/department";
import type { Employee } from "@/types/employee";
import type { TaskItem } from "@/types/task";

export interface CaseInfo {
    id: number;
    title: string;
}

interface CaseCardProps {
    item: CaseItem;
    index: number;
    users?: Employee[];
    customers?: Customer[];
    departments?: Department[];
    isDeleting?: boolean;
    hasActiveTasks?: boolean;
    caseTasks?: TaskItem[];
    onEdit?: (item: CaseItem) => void;
    onDelete?: (item: CaseItem) => void;
    onClick?: (item: CaseItem) => void;
}

const SPRING = { type: "spring" as const, stiffness: 420, damping: 26 };

function formatDate(iso?: string | null) {
    if (!iso) return "نامشخص";
    return new Date(iso).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function Avatar({ name, id }: { name: string; id: number }) {
    const hue = (Math.abs(id) * 53) % 360;
    return (
        <div
            className="flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-2xl text-[15px] font-extrabold text-white"
            style={{
                background: `linear-gradient(135deg, oklch(55% 0.18 ${hue}), oklch(45% 0.22 ${(hue + 30) % 360}))`,
            }}
        >
            {name?.charAt(0) ?? "؟"}
        </div>
    );
}

const isFilled = (v?: string | null): v is string =>
    typeof v === "string" && v.trim().length > 0;

const nameFromObject = (value: any): string => {
    if (!value || typeof value !== "object") return "";
    const full = value.full_name ?? value.name ?? value.title ?? "";
    if (isFilled(full)) return full.trim();
    const composed = `${value.first_name ?? ""} ${value.last_name ?? ""}`.trim();
    if (isFilled(composed)) return composed;
    if (isFilled(value.username)) return value.username!.trim();
    return "";
};

const resolveName = (
    value: any,
    directName?: string | null,
    pool?: any[]
): string => {
    if (isFilled(directName)) return directName!.trim();
    const fromObj = nameFromObject(value);
    if (isFilled(fromObj)) return fromObj;
    if (typeof value === "string" && !/^\d+$/.test(value.trim()))
        return value.trim();
    const id =
        typeof value === "number" || typeof value === "string"
            ? String(value)
            : value && typeof value === "object" && value.id !== undefined
                ? String(value.id)
                : "";
    if (!id || !pool?.length) return "";
    const found = pool.find(
        (p) =>
            p &&
            typeof p === "object" &&
            p.id !== undefined &&
            String(p.id) === id
    );
    return nameFromObject(found);
};

const SWEEP_COLORS: Record<string, string> = {
    delete: "#ef4444",
    edit: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
    tasks: "linear-gradient(90deg, #6366f1, #8b5cf6)",
    report: "linear-gradient(90deg, #10b981, #06b6d4)",
};

function SweepButton({
    actionKey,
    icon,
    offset,
    delay,
    disabled,
    isDark,
    iconBg,
    iconBorder,
    iconColor,
    onEnter,
    onLeave,
    onClick,
    spring,
}: {
    actionKey: string;
    icon: ReactNode;
    offset: { x: number; y: number };
    delay: number;
    disabled: boolean;
    isDark: boolean;
    iconBg: string;
    iconBorder: string;
    iconColor: string;
    onEnter: () => void;
    onLeave: () => void;
    onClick: (e: ReactMouseEvent) => void;
    spring: typeof SPRING;
}) {
    const spanRef = useRef<HTMLSpanElement>(null);
    const iconWrapRef = useRef<HTMLSpanElement>(null);
    const animatingRef = useRef(false);
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    useEffect(() => {
        const timers = timersRef.current;
        return () => timers.forEach(clearTimeout);
    }, []);

    const runSweep = useCallback(() => {
        if (disabled || animatingRef.current) return;
        const bg = spanRef.current;
        const iconEl = iconWrapRef.current;
        if (!bg || !iconEl) return;

        animatingRef.current = true;
        bg.style.transformOrigin = "0% 50%";
        animate(bg, { scaleX: [0, 1] }, { duration: 0.4, ease: [0.4, 0, 0.2, 1] });

        timersRef.current.push(
            setTimeout(() => {
                animate(iconEl, { color: "#ffffff" }, { duration: 0.08, ease: "easeIn" });
            }, 300)
        );

        timersRef.current.push(
            setTimeout(() => {
                bg.style.transformOrigin = "100% 50%";
                animate(bg, { scaleX: [1, 0] }, { duration: 0.4, ease: [0.4, 0, 0.2, 1] });
                animate(iconEl, { color: iconColor }, { duration: 0.4, ease: [0.4, 0, 0.2, 1] });
            }, 400)
        );

        timersRef.current.push(
            setTimeout(() => {
                animatingRef.current = false;
            }, 820)
        );
    }, [disabled, iconColor]);

    return (
        <m.button
            type="button"
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{ x: offset.x, y: offset.y, scale: 1, opacity: 1 }}
            exit={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            transition={{ ...spring, delay }}
            whileTap={disabled ? {} : { scale: 0.96 }}
            onMouseEnter={() => {
                runSweep();
                onEnter();
            }}
            onMouseLeave={onLeave}
            onClick={onClick}
            className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full"
            style={{
                backgroundColor: iconBg,
                border: `1.5px solid ${iconBorder}`,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.45 : 1,
            }}
        >
            <span
                ref={spanRef}
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                    background: SWEEP_COLORS[actionKey] || "#6366f1",
                    transform: "scaleX(0)",
                    transformOrigin: "0% 50%",
                }}
            />
            <span
                ref={iconWrapRef}
                className="relative z-10 flex items-center justify-center"
                style={{
                    color: disabled ? (isDark ? "#6b7280" : "#9ca3af") : iconColor,
                }}
            >
                {icon}
            </span>
        </m.button>
    );
}

function CaseCard({
    item,
    index,
    customers,
    departments,
    users,
    isDeleting = false,
    hasActiveTasks = false,
    caseTasks = [],
    onEdit,
    onDelete,
    onClick,
}: CaseCardProps) {
    const { resolvedTheme } = useTheme();

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const isDark = mounted && resolvedTheme === "dark";

    const cardRef = useRef<HTMLDivElement>(null);
    const [hovered, setHovered] = useState(false);
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeletingState, setIsDeletingState] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [showEdit, setShowEdit] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [showMobileSheet, setShowMobileSheet] = useState(false);

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

    const description =
        typeof item.description === "string" ? item.description.trim() : "";
    const canDelete = !hasActiveTasks;

    const deleteTooltipText = useMemo(() => {
        if (hasActiveTasks) return "این پرونده دارای وظیفه فعال است";
        return "حذف پرونده";
    }, [hasActiveTasks]);

    const handleDelete = async () => {
        if (!canDelete || !onDelete) return;
        setIsDeletingState(true);
        setDeleteError("");
        try {
            await onDelete(item);
            setShowConfirm(false);
        } catch {
            setDeleteError("حذف پرونده با خطا مواجه شد");
        } finally {
            setIsDeletingState(false);
        }
    };

    const handleMouseEnter = () => {
        if (typeof window !== "undefined" && window.innerWidth < 768) return;
        setHovered(true);
    };

    const handleMouseLeave = () => {
        setHovered(false);
        setActiveTooltip(null);
    };

    const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    const surfaceBg = isDark ? "rgba(255,255,255,0.02)" : "#fafafa";
    const dividerColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
    const iconBg = isDark ? "#1e1e1e" : "#e2e2e2";
    const iconBorder = isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.14)";
    const iconColor = isDark ? "#e5e7eb" : "#374151";
    const tasksColor = isDark ? "#a5b4fc" : "#6366f1";

    const actions = [
        {
            key: "report",
            tooltip: "گزارش مسیر پرونده",
            disabled: false,
            delay: 0,
            color: isDark ? "#6ee7b7" : "#059669",
            onClick: (e: ReactMouseEvent) => {
                e.stopPropagation();
                setShowReport(true);
            },
            icon: <FileText size={16} />,
        },
        {
            key: "tasks",
            tooltip:
                caseTasks.length > 0
                    ? `${caseTasks.length} وظیفه`
                    : "وظایف پرونده",
            disabled: false,
            delay: 0.07,
            color: tasksColor,
            onClick: (e: ReactMouseEvent) => {
                e.stopPropagation();
                onClick?.(item);
            },
            icon: <ListTodo size={16} />,
        },
        {
            key: "edit",
            tooltip: "ویرایش اطلاعات",
            disabled: false,
            delay: 0.14,
            color: iconColor,
            onClick: (e: ReactMouseEvent) => {
                e.stopPropagation();
                if (onEdit) {
                    onEdit(item);
                } else {
                    setShowEdit(true);
                }
            },
            icon: <SquarePen size={16} />,
        },
        {
            key: "delete",
            tooltip: deleteTooltipText,
            disabled: !canDelete,
            delay: 0.21,
            color: iconColor,
            onClick: (e: ReactMouseEvent) => {
                e.stopPropagation();
                if (canDelete) setShowConfirm(true);
            },
            icon: <Trash2 size={16} />,
        },
    ];

    return (
        <>
            {showReport && (
                <CaseReportModal
                    caseId={item.id}
                    caseTitle={item.title}
                    onClose={() => setShowReport(false)}
                />
            )}
            <m.div
                ref={cardRef}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: Math.min(index, 12) * 0.03 }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={() => onClick?.(item)}
                className="case-card group relative z-[1] flex flex-col gap-3 overflow-visible rounded-2xl p-4 transition-[filter,box-shadow] duration-300 hover:z-50 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.35),0_14px_40px_rgba(99,102,241,0.25)] dark:hover:shadow-[0_0_0_1px_rgba(129,140,248,0.45),0_14px_44px_rgba(99,102,241,0.35)]"
                style={{
                    border: `1px solid ${borderColor}`,
                    background: surfaceBg,
                    direction: "rtl",
                    cursor: onClick ? "pointer" : "default",
                }}
            >
                <svg
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    style={{ borderRadius: "1rem", overflow: "visible" }}
                >
                    <defs>
                        <linearGradient
                            id={`case-grad-${item.id}`}
                            x1="100%"
                            y1="100%"
                            x2="0%"
                            y2="0%"
                        >
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.5" />
                        </linearGradient>
                    </defs>
                    <m.rect
                        x="1"
                        y="1"
                        width="calc(100% - 2px)"
                        height="calc(100% - 2px)"
                        rx="15"
                        ry="15"
                        fill="none"
                        stroke={`url(#case-grad-${item.id})`}
                        strokeWidth="1.2"
                        pathLength="1"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={
                            hovered
                                ? { pathLength: 1, opacity: 1 }
                                : { pathLength: 0, opacity: 0 }
                        }
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    />
                </svg>

                <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMobileSheet(true);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-gray-500 transition-colors active:scale-95 dark:bg-white/10 dark:text-gray-300 md:hidden"
                        aria-label="گزینه‌ها"
                    >
                        <MoreVertical size={15} />
                    </button>
                </div>

                <div className="flex items-center gap-3 pt-1">
                    <Avatar name={item.title || "؟"} id={item.id} />
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="truncate text-[13.5px] font-extrabold leading-tight text-gray-800 dark:text-gray-100">
                            {item.title || "بدون عنوان"}
                        </p>
                        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                            #{item.id}
                        </p>
                    </div>
                </div>

                <div
                    className="flex flex-col gap-2 border-t pt-2.5"
                    style={{ borderColor: dividerColor }}
                >
                    <div className="flex items-center gap-2 text-[11.5px] text-gray-400 dark:text-gray-500">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        <span>
                            مشتری :
                        </span>
                        <span className="truncate">{customerName}</span>
                    </div>

                    {description && (
                        <div className="flex items-start gap-2 text-[11.5px] text-gray-400 dark:text-gray-500">
                            <span>
                                توضیحات :
                            </span>
                            <span className="line-clamp-2 flex-1">{description}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-[11.5px] text-gray-400 dark:text-gray-500">
                        <div className="flex min-w-0 items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{departmentName}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            <span>{formatDate(item.created_at)}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span
                            className="rounded-lg px-2 py-0.5 text-[10.5px] font-bold"
                            style={{
                                background:
                                    "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.18))",
                                color: isDark ? "#a5b4fc" : "#6366f1",
                                border: "1px solid rgba(99,102,241,0.25)",
                            }}
                        >
                            {assigneeName}
                        </span>

                        {hasActiveTasks && (
                            <span
                                className="rounded-lg bg-rose-50 px-2 py-0.5 text-[10.5px] font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                                style={{ border: "1px solid rgba(244,63,94,0.25)" }}
                            >
                                {caseTasks.length > 0
                                    ? `${caseTasks.length} وظیفه فعال`
                                    : "دارای وظیفه فعال"}
                            </span>
                        )}
                    </div>
                </div>

                <div className="hidden md:block">
                    <AnimatePresence>
                        {hovered && (
                            <m.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                className="pointer-events-auto absolute -right-[59px] top-1/2 z-40 flex -translate-y-1/2 flex-col gap-2.5 pl-6"
                            >
                                {actions.map((act) => (
                                    <div
                                        key={act.key}
                                        className="relative flex items-center justify-center"
                                    >
                                        <SweepButton
                                            actionKey={act.key}
                                            icon={act.icon}
                                            offset={{ x: 0, y: 0 }}
                                            delay={act.delay}
                                            disabled={act.disabled}
                                            isDark={isDark}
                                            iconBg={iconBg}
                                            iconBorder={iconBorder}
                                            iconColor={act.color}
                                            spring={SPRING}
                                            onEnter={() => setActiveTooltip(act.key)}
                                            onLeave={() => setActiveTooltip(null)}
                                            onClick={act.onClick}
                                        />

                                        <AnimatePresence>
                                            {activeTooltip === act.key && (
                                                <div className="pointer-events-none absolute right-full top-1/2 z-[60] mr-2.5 -translate-y-1/2">
                                                    <m.div
                                                        initial={{ opacity: 0, scale: 0.95, x: 4 }}
                                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, x: 4 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="whitespace-nowrap rounded-2xl px-3 py-2 text-center shadow-xl"
                                                        style={{
                                                            background: isDark ? "#111827" : "#1f2937",
                                                            border: "1px solid rgba(255,255,255,0.08)",
                                                        }}
                                                        dir="rtl"
                                                    >
                                                        <span className="text-[11px] font-bold text-white">
                                                            {act.tooltip}
                                                        </span>
                                                    </m.div>
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </m.div>
                        )}
                    </AnimatePresence>
                </div>
            </m.div>

            <AnimatePresence>
                {showMobileSheet && (
                    <div
                        className="fixed inset-0 z-50 flex items-end justify-center md:hidden"
                        dir="rtl"
                    >
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMobileSheet(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        <m.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 320 }}
                            className="relative z-10 w-full max-w-lg rounded-t-[28px] p-5 shadow-2xl"
                            style={{
                                background: isDark ? "#12141c" : "#ffffff",
                                borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                            }}
                        >
                            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />

                            <div
                                className="mb-4 flex items-center border-b pb-3"
                                style={{ borderColor: dividerColor }}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Avatar name={item.title || "؟"} id={item.id} />
                                    <div>
                                        <p className="text-sm font-extrabold text-gray-800 dark:text-gray-100">
                                            {item.title || "بدون عنوان"}
                                        </p>
                                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                                            #{item.id} • {customerName}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowMobileSheet(false);
                                        onClick?.(item);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-2xl p-3 text-sm font-bold text-gray-700 dark:text-gray-200"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.05)" : "#f9fafb",
                                    }}
                                >
                                    <ListTodo size={17} />
                                    مشاهده وظایف {caseTasks.length > 0 && `(${caseTasks.length})`}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowMobileSheet(false);
                                        setShowReport(true);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-2xl p-3 text-sm font-bold text-gray-700 dark:text-gray-200"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.05)" : "#f9fafb",
                                    }}
                                >
                                    <FileText size={17} />
                                    گزارش مسیر پرونده
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowMobileSheet(false);
                                        onEdit ? onEdit(item) : setShowEdit(true);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-2xl p-3 text-sm font-bold text-gray-700 dark:text-gray-200"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.05)" : "#f9fafb",
                                    }}
                                >
                                    <SquarePen size={17} />
                                    ویرایش پرونده
                                </button>

                                <button
                                    type="button"
                                    disabled={!canDelete}
                                    onClick={() => {
                                        setShowMobileSheet(false);
                                        setShowConfirm(true);
                                        setDeleteError("");
                                    }}
                                    className="flex w-full items-center gap-3 rounded-2xl p-3 text-sm font-bold text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-rose-400"
                                    style={{
                                        background: isDark ? "rgba(244,63,94,0.08)" : "#fff1f2",
                                    }}
                                >
                                    <Trash2 size={17} />
                                    {canDelete ? "حذف پرونده" : "دارای وظیفه فعال"}
                                </button>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showConfirm && (
                    <div
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                        dir="rtl"
                    >
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isDeletingState && setShowConfirm(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        <m.div
                            initial={{ opacity: 0, scale: 0.95, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 12 }}
                            transition={{ duration: 0.2 }}
                            className="relative z-10 w-full max-w-sm rounded-3xl p-5 shadow-2xl"
                            style={{
                                background: isDark ? "#12141c" : "#ffffff",
                                border: `1px solid ${borderColor}`,
                            }}
                        >
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                                    <AlertCircle size={22} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-gray-800 dark:text-gray-100">
                                        حذف پرونده
                                    </h3>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        از حذف این پرونده مطمئن هستید؟
                                    </p>
                                </div>
                            </div>

                            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                {item.title || "بدون عنوان"}
                            </p>

                            {deleteError && (
                                <p className="mt-3 text-[11.5px] font-semibold text-red-500">
                                    {deleteError}
                                </p>
                            )}

                            <div className="mt-5 flex gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => !isDeletingState && setShowConfirm(false)}
                                    disabled={isDeletingState}
                                    className="flex-1 rounded-[1.25rem] py-2.5 text-[12.5px] font-bold text-gray-600 transition-all active:scale-[0.98] disabled:opacity-50 dark:text-gray-300"
                                    style={{
                                        background: isDark
                                            ? "rgba(255,255,255,0.05)"
                                            : "rgba(0,0,0,0.05)",
                                        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                                    }}
                                >
                                    انصراف
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isDeletingState || !canDelete}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-[1.25rem] py-2.5 text-[12.5px] font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
                                    style={{
                                        background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                        border: "1px solid rgba(239,68,68,0.3)",
                                    }}
                                >
                                    {isDeletingState ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={14} />
                                    )}
                                    {isDeletingState ? "در حال حذف..." : "حذف پرونده"}
                                </button>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

export default memo(CaseCard);
