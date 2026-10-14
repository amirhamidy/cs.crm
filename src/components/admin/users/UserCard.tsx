"use client";

import { memo, useEffect, useState, useRef, useCallback, useMemo } from "react";
import type { ReactNode, MouseEvent as ReactMouseEvent } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { useTheme } from "next-themes";
import {
    Phone,
    Trash2,
    SquarePen,
    CalendarDays,
    Star,
    Loader2,
    MoreVertical,
    AlertCircle,
    ShieldCheck,
    Check,
    Power,
    SlidersHorizontal,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiEmployee, ApiUser } from "@/types/users";
import EditUserModal from "@/components/admin/users/EditUserModal";
import AdjustScoreModal from "@/components/admin/users/AdjustScoreModal";

export interface UserInfo {
    id: number;
    phone: string | null;
    isActive: boolean | null;
}

interface UserCardProps {
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

type Placement = "left" | "right";

const SPRING = { type: "spring" as const, stiffness: 420, damping: 26 };
const EMPTY_TITLES: string[] = [];

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

function StatusSwitch({
    isActive,
    loading,
    disabled,
    isDark,
    title,
    onToggle,
}: {
    isActive: boolean;
    loading: boolean;
    disabled: boolean;
    isDark: boolean;
    title?: string;
    onToggle: () => void;
}) {
    const trackBg = isActive
        ? isDark
            ? "rgba(16, 185, 129, 0.2)"
            : "rgba(16, 185, 129, 0.14)"
        : isDark
            ? "rgba(148, 163, 184, 0.16)"
            : "#e9ecf1";

    const trackBorder = isActive
        ? isDark
            ? "rgba(16, 185, 129, 0.4)"
            : "rgba(16, 185, 129, 0.3)"
        : isDark
            ? "rgba(148, 163, 184, 0.3)"
            : "rgba(148, 163, 184, 0.35)";

    const knobBg = isActive ? "#10b981" : isDark ? "#64748b" : "#94a3b8";

    return (
        <button
            type="button"
            dir="ltr"
            title={title}
            aria-pressed={isActive}
            disabled={disabled || loading}
            onClick={(e) => {
                e.stopPropagation();
                if (!disabled && !loading) onToggle();
            }}
            className="relative inline-flex h-7 w-[52px] shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none"
            style={{
                backgroundColor: trackBg,
                border: `1.5px solid ${trackBorder}`,
                cursor: disabled ? "not-allowed" : loading ? "wait" : "pointer",
                opacity: disabled ? 0.55 : 1,
            }}
        >
            <motion.span
                initial={false}
                animate={{ x: isActive ? 0 : 24, backgroundColor: knobBg }}
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
                className="absolute left-[1.5px] top-[1.5px] flex h-6 w-6 items-center justify-center rounded-full text-white"
                style={{ boxShadow: "0 2px 6px rgba(15,23,42,0.22)" }}
            >
                {loading ? (
                    <Loader2 size={12} className="animate-spin" />
                ) : isActive ? (
                    <Check size={13} strokeWidth={3.2} />
                ) : (
                    <Power size={12} strokeWidth={2.6} />
                )}
            </motion.span>
        </button>
    );
}

function extractUserList(data: unknown): ApiUser[] {
    if (Array.isArray(data)) return data as ApiUser[];
    if (data && typeof data === "object") {
        const record = data as Record<string, unknown>;
        if (Array.isArray(record.results)) return record.results as ApiUser[];
        if (Array.isArray(record.data)) return record.data as ApiUser[];
        if (Array.isArray(record.users)) return record.users as ApiUser[];
    }
    return [];
}

function extractEmployeeList(data: unknown): ApiEmployee[] {
    if (Array.isArray(data)) return data as ApiEmployee[];
    if (data && typeof data === "object") {
        const record = data as Record<string, unknown>;
        if (Array.isArray(record.results)) return record.results as ApiEmployee[];
        if (Array.isArray(record.data)) return record.data as ApiEmployee[];
        if (Array.isArray(record.employees)) return record.employees as ApiEmployee[];
    }
    return [];
}

function getErrorMessage(error: unknown, fallback: string) {
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

const SWEEP_COLORS: Record<string, string> = {
    delete: "#ef4444",
    edit: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
    adjustScore: "linear-gradient(90deg, #f59e0b, #10b981)",
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
        return () => {
            timers.forEach((timer) => clearTimeout(timer));
        };
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

                animate(
                    iconEl,
                    { color: iconColor },
                    { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
                );
            }, 400)
        );

        timersRef.current.push(
            setTimeout(() => {
                animatingRef.current = false;
            }, 820)
        );
    }, [disabled, iconColor]);

    return (
        <motion.button
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
                    color: disabled ? (isDark ? "#64748b" : "#9ca3af") : iconColor,
                }}
            >
                {icon}
            </span>
        </motion.button>
    );
}

function UserCard({
    employee,
    departmentName = null,
    activeTaskTitles = EMPTY_TITLES,
    index,
    hasActiveTasks = false,
    userInfo = null,
    score = null,
    onDelete,
    onUpdated,
    onScoreChanged,
}: UserCardProps) {
    const { resolvedTheme } = useTheme();

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const isDark = mounted && resolvedTheme === "dark";

    const cardRef = useRef<HTMLDivElement>(null);
    const [hovered, setHovered] = useState(false);
    const [placement, setPlacement] = useState<Placement>("right");
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [showEdit, setShowEdit] = useState(false);
    const [showAdjust, setShowAdjust] = useState(false);
    const [showMobileSheet, setShowMobileSheet] = useState(false);

    const phoneNumber = userInfo?.phone ?? null;
    const userId = userInfo?.id ?? employee.user_id ?? employee.user ?? null;

    const [isActive, setIsActive] = useState<boolean>(
        userInfo?.isActive ??
        (employee as unknown as { is_active?: boolean }).is_active ??
        true
    );
    const [togglingActive, setTogglingActive] = useState(false);

    useEffect(() => {
        if (typeof userInfo?.isActive === "boolean") setIsActive(userInfo.isActive);
    }, [userInfo?.isActive]);

    const showTaskTooltip = hovered && hasActiveTasks && activeTooltip === null;
    const isRight = placement === "right";

    const checkPosition = useCallback(() => {
        if (!cardRef.current) return;
        const parent = cardRef.current.parentElement;
        if (!parent) return;

        const cardRect = cardRef.current.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();

        const spaceRight = parentRect.right - cardRect.right;
        const spaceLeft = cardRect.left - parentRect.left;

        setPlacement(spaceRight >= spaceLeft ? "right" : "left");
    }, []);

    const loggedUserId = useMemo(() => {
        if (typeof window === "undefined") return null;
        try {
            const raw = localStorage.getItem("user");
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return typeof parsed?.id === "number" ? parsed.id : null;
        } catch {
            return null;
        }
    }, []);

    const isSelf = userId !== null && loggedUserId !== null && loggedUserId === userId;

    const isAdmin = employee.type === 1;
    const canDelete = !isAdmin && !isSelf && !hasActiveTasks;

    const deleteTooltipText = useMemo(() => {
        if (isAdmin) return "امکان حذف مدیر سیستم وجود ندارد";
        if (isSelf) return "شما نمی‌توانید حساب خود را حذف کنید";
        if (hasActiveTasks) return "این کاربر دارای تسک فعال است";
        return "حذف کاربر";
    }, [isAdmin, isSelf, hasActiveTasks]);

    const handleToggleActive = async () => {
        if (togglingActive || !userId || isSelf) return;

        const nextState = !isActive;
        setTogglingActive(true);

        try {
            await axiosInstance.put(`/accounts/api/v1/user/${userId}/update/`, {
                username: employee.username,
                phone_number: phoneNumber || "",
                type: employee.type ?? 2,
                is_active: nextState,
            });

            setIsActive(nextState);
            onUpdated({
                ...employee,
                is_active: nextState,
            } as ApiEmployee);
        } catch (err) {
            console.error("خطا در تغییر وضعیت حساب:", err);
        } finally {
            setTogglingActive(false);
        }
    };

    const handleDelete = async () => {
        if (!canDelete) return;
        setIsDeleting(true);
        setDeleteError("");

        try {
            const [usersRes, employeesRes] = await Promise.all([
                axiosInstance.get("/accounts/api/v1/user/list/").catch(() => null),
                axiosInstance.get("/accounts/api/v1/employee/").catch(() => null),
            ]);

            const users = usersRes ? extractUserList(usersRes.data) : [];
            const employees = employeesRes ? extractEmployeeList(employeesRes.data) : [];

            const normalizedUsername = (employee.username || "").toLowerCase();

            const matchedUser = users.find(
                (user) => user.username?.trim().toLowerCase() === normalizedUsername
            );
            const matchedEmployee = employees.find(
                (item) =>
                    item.username?.trim().toLowerCase() === normalizedUsername ||
                    item.id === employee.id
            );

            const employeeDeleteId = matchedEmployee?.id;
            const userDeleteId = matchedUser?.id;

            if (!employeeDeleteId && !userDeleteId) {
                throw new Error("شناسه حذف کاربر پیدا نشد");
            }

            if (employeeDeleteId) {
                await axiosInstance.delete(`/accounts/api/v1/employee/${employeeDeleteId}/delete/`);
            }

            if (userDeleteId && matchedUser?.type !== 1) {
                await axiosInstance.delete(`/accounts/api/v1/user/${userDeleteId}/delete/`);
            }

            onDelete(employee.id);
            setShowConfirm(false);
        } catch (err) {
            setDeleteError(getErrorMessage(err, "حذف کاربر با خطا مواجه شد"));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleMouseEnter = () => {
        if (typeof window !== "undefined" && window.innerWidth < 768) return;
        checkPosition();
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

    const actionsContainerClass = isRight
        ? "-right-[59px] top-1/2 -translate-y-1/2 flex-col gap-2.5 pl-6"
        : "-left-[59px] top-1/2 -translate-y-1/2 flex-col gap-2.5 pr-6";

    const tooltipPositionClass = isRight
        ? "left-full top-1/2 ml-2.5 -translate-y-1/2"
        : "right-full top-1/2 mr-2.5 -translate-y-1/2";

    const tooltipOffsetX = isRight ? -4 : 4;
    const tooltipOffsetY = 0;

    const actions = [
        {
            key: "toggleActive",
            tooltip: isSelf
                ? "امکان تغییر وضعیت حساب خود وجود ندارد"
                : isActive
                    ? "غیرفعال‌سازی کاربر"
                    : "فعال‌سازی کاربر",
            disabled: isSelf,
            delay: 0,
            color: iconColor,
            onClick: (e: ReactMouseEvent) => {
                e.stopPropagation();
                handleToggleActive();
            },
            icon: null as ReactNode,
        },
        {
            key: "edit",
            tooltip: "ویرایش اطلاعات",
            disabled: false,
            delay: 0.08,
            color: iconColor,
            onClick: (e: ReactMouseEvent) => {
                e.stopPropagation();
                setShowEdit(true);
            },
            icon: <SquarePen size={16} />,
        },
        {
            key: "adjustScore",
            tooltip: isAdmin ? "امتیاز مدیر سیستم قابل تغییر نیست" : "تغییر امتیاز",
            disabled: isAdmin,
            delay: 0.16,
            color: iconColor,
            onClick: (e: ReactMouseEvent) => {
                e.stopPropagation();
                if (!isAdmin) setShowAdjust(true);
            },
            icon: <SlidersHorizontal size={16} />,
        },
        {
            key: "delete",
            tooltip: deleteTooltipText,
            disabled: !canDelete,
            delay: 0.24,
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
            <motion.div
                ref={cardRef}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: Math.min(index, 12) * 0.03 }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="user-card group relative z-[1] flex flex-col gap-3 overflow-visible rounded-2xl p-4 transition-[filter,box-shadow] duration-300 hover:z-50 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.35),0_14px_40px_rgba(99,102,241,0.25)] dark:hover:shadow-[0_0_0_1px_rgba(129,140,248,0.45),0_14px_44px_rgba(99,102,241,0.35)]"
                style={{
                    border: `1px solid ${borderColor}`,
                    background: surfaceBg,
                    direction: "rtl",
                }}
            >
                <svg
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    style={{ borderRadius: "1rem", overflow: "visible" }}
                >
                    <defs>
                        <linearGradient
                            id={`emp-grad-${employee.id}`}
                            x1="100%"
                            y1="100%"
                            x2="0%"
                            y2="0%"
                        >
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.5" />
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
                        stroke={`url(#emp-grad-${employee.id})`}
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

                <AnimatePresence>
                    {showTaskTooltip && (
                        <div
                            className={`pointer-events-none absolute top-1/2 z-[70] -translate-y-1/2 ${isRight ? "left-full ml-[70px]" : "right-full mr-[70px]"
                                }`}
                        >
                            <motion.div
                                initial={{ opacity: 0, x: isRight ? -6 : 6, scale: 0.96 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: isRight ? -6 : 6, scale: 0.96 }}
                                transition={{ duration: 0.15 }}
                                className="w-56 rounded-2xl p-3 shadow-2xl"
                                style={{
                                    background: isDark ? "#0f172a" : "#1e293b",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                }}
                                dir="rtl"
                            >
                                <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5 text-[11px] font-extrabold text-rose-400">
                                    <AlertCircle size={13} />
                                    <span>لیست تسک‌های در حال انجام</span>
                                </div>
                                {activeTaskTitles.length > 0 ? (
                                    <ul className="mt-2 space-y-1.5">
                                        {activeTaskTitles.map((title, idx) => (
                                            <li
                                                key={`${title}-${idx}`}
                                                className="flex items-start gap-1.5 text-[10.5px] leading-4 text-slate-300"
                                            >
                                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose-400" />
                                                <span className="line-clamp-2 min-w-0 break-words">
                                                    {title}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="mt-1.5 text-[10px] text-slate-400">
                                        این کاربر تسک دارد ولی هیچ‌کدام در حال انجام نیست
                                    </p>
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

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

                    {score !== null && (
                        <div
                            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black"
                            style={{
                                background: isDark
                                    ? "rgba(245,158,11,0.14)"
                                    : "rgba(245,158,11,0.1)",
                                border: `1px solid ${isDark ? "rgba(245,158,11,0.25)" : "rgba(245,158,11,0.3)"
                                    }`,
                                color: isDark ? "#fbbf24" : "#d97706",
                            }}
                            title="امتیاز عملکرد"
                        >
                            <Star size={12} fill="currentColor" />
                            <span>{score}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 pt-1">
                    <Avatar name={employee.full_name || "؟"} id={employee.id} />
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="truncate text-[13.5px] font-extrabold leading-tight text-gray-800 dark:text-gray-100">
                            {employee.full_name || "بدون نام"}
                        </p>
                        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                            @{employee.username}
                        </p>
                    </div>
                </div>

                <div
                    className="flex flex-col gap-2 border-t pt-2.5"
                    style={{ borderColor: dividerColor }}
                >
                    {phoneNumber && (
                        <div className="flex items-center gap-2 text-[11.5px] text-gray-400 dark:text-gray-500">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span dir="ltr">{phoneNumber}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-[11.5px] text-gray-400 dark:text-gray-500">
                        <div className="flex min-w-0 items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                                {isAdmin ? "ادمین سیستم" : "کارمند"}
                                {departmentName ? ` • ${departmentName}` : ""}
                            </span>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            <span>{formatDate(employee.created_at)}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span
                            className="rounded-lg px-2 py-0.5 text-[10.5px] font-bold"
                            style={
                                isAdmin
                                    ? {
                                        background:
                                            "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(217,119,6,0.18))",
                                        color: isDark ? "#fbbf24" : "#d97706",
                                        border: "1px solid rgba(245,158,11,0.25)",
                                    }
                                    : {
                                        background:
                                            "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.18))",
                                        color: isDark ? "#a5b4fc" : "#6366f1",
                                        border: "1px solid rgba(99,102,241,0.25)",
                                    }
                            }
                        >
                            {isAdmin ? "مدیر کل" : "کاربر سامانه"}
                        </span>

                        {hasActiveTasks && (
                            <span
                                className="rounded-lg bg-rose-50 px-2 py-0.5 text-[10.5px] font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                                style={{ border: "1px solid rgba(244,63,94,0.25)" }}
                            >
                                {activeTaskTitles.length > 0
                                    ? `${activeTaskTitles.length} تسک فعال`
                                    : "دارای تسک"}
                            </span>
                        )}
                    </div>
                </div>

                <div className="hidden md:block">
                    <AnimatePresence>
                        {hovered && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                className={`pointer-events-auto absolute z-40 flex items-center ${actionsContainerClass}`}
                            >
                                {actions.map((act) => (
                                    <div key={act.key} className="relative flex items-center justify-center">
                                        {act.key === "toggleActive" ? (
                                            <motion.div
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0, opacity: 0 }}
                                                transition={{ ...SPRING, delay: act.delay }}
                                                onMouseEnter={() => setActiveTooltip(act.key)}
                                                onMouseLeave={() => setActiveTooltip(null)}
                                                className="flex items-center justify-center"
                                            >
                                                <StatusSwitch
                                                    isActive={isActive}
                                                    loading={togglingActive}
                                                    disabled={isSelf}
                                                    isDark={isDark}
                                                    onToggle={handleToggleActive}
                                                />
                                            </motion.div>
                                        ) : (
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
                                        )}

                                        <AnimatePresence>
                                            {activeTooltip === act.key && (
                                                <div
                                                    className={`pointer-events-none absolute z-[60] ${tooltipPositionClass}`}
                                                >
                                                    <motion.div
                                                        initial={{
                                                            opacity: 0,
                                                            scale: 0.95,
                                                            x: tooltipOffsetX,
                                                            y: tooltipOffsetY,
                                                        }}
                                                        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                                                        exit={{
                                                            opacity: 0,
                                                            scale: 0.95,
                                                            x: tooltipOffsetX,
                                                            y: tooltipOffsetY,
                                                        }}
                                                        transition={{ duration: 0.15 }}
                                                        className="whitespace-nowrap rounded-2xl px-3 py-2 text-center shadow-xl"
                                                        style={{
                                                            background: isDark ? "#0f172a" : "#1e293b",
                                                            border: "1px solid rgba(255,255,255,0.08)",
                                                        }}
                                                        dir="rtl"
                                                    >
                                                        <span className="text-[11px] font-bold text-white">
                                                            {act.tooltip}
                                                        </span>
                                                    </motion.div>
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            <AnimatePresence>
                {showMobileSheet && (
                    <div
                        className="fixed inset-0 z-50 flex items-end justify-center md:hidden"
                        dir="rtl"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMobileSheet(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 320 }}
                            className="relative z-10 w-full max-w-lg rounded-t-[28px] p-5 shadow-2xl"
                            style={{
                                background: isDark ? "#12141c" : "#ffffff",
                                borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"
                                    }`,
                            }}
                        >
                            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />

                            <div
                                className="mb-4 flex items-center justify-between border-b pb-3"
                                style={{ borderColor: dividerColor }}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Avatar name={employee.full_name || "؟"} id={employee.id} />
                                    <div>
                                        <p className="text-sm font-extrabold text-gray-800 dark:text-gray-100">
                                            {employee.full_name || "بدون نام"}
                                        </p>
                                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                                            @{employee.username} {departmentName ? `• ${departmentName}` : ""}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                                        {isActive ? "فعال" : "غیرفعال"}
                                    </span>
                                    <StatusSwitch
                                        isActive={isActive}
                                        loading={togglingActive}
                                        disabled={isSelf}
                                        isDark={isDark}
                                        title={
                                            isSelf
                                                ? "امکان تغییر وضعیت حساب خود وجود ندارد"
                                                : isActive
                                                    ? "حساب فعال است"
                                                    : "حساب غیرفعال است"
                                        }
                                        onToggle={handleToggleActive}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowMobileSheet(false);
                                        setShowEdit(true);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-2xl p-3.5 text-[13.5px] font-bold text-blue-600 transition-all active:scale-[0.98] dark:text-blue-400"
                                    style={{
                                        background: isDark
                                            ? "rgba(59,130,246,0.12)"
                                            : "rgba(59,130,246,0.08)",
                                        border: `1px solid ${isDark ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.14)"
                                            }`,
                                    }}
                                >
                                    <SquarePen size={18} />
                                    <span>ویرایش اطلاعات کاربر</span>
                                </button>

                                <button
                                    type="button"
                                    disabled={isAdmin}
                                    onClick={() => {
                                        if (isAdmin) return;
                                        setShowMobileSheet(false);
                                        setShowAdjust(true);
                                    }}
                                    className={`flex w-full items-center gap-3 rounded-2xl p-3.5 text-[13.5px] font-bold transition-all ${isAdmin
                                        ? "cursor-not-allowed text-gray-400 opacity-50"
                                        : "text-emerald-600 active:scale-[0.98] dark:text-emerald-400"
                                        }`}
                                    style={{
                                        background: isAdmin
                                            ? isDark
                                                ? "rgba(255,255,255,0.03)"
                                                : "rgba(0,0,0,0.03)"
                                            : isDark
                                                ? "rgba(16,185,129,0.12)"
                                                : "rgba(16,185,129,0.08)",
                                        border: `1px solid ${isAdmin
                                            ? isDark
                                                ? "rgba(255,255,255,0.06)"
                                                : "rgba(0,0,0,0.06)"
                                            : isDark
                                                ? "rgba(16,185,129,0.2)"
                                                : "rgba(16,185,129,0.14)"
                                            }`,
                                    }}
                                >
                                    <SlidersHorizontal size={18} />
                                    <span>تغییر امتیاز</span>
                                </button>

                                <div className="flex flex-col gap-1.5 pt-1">
                                    <button
                                        type="button"
                                        disabled={!canDelete}
                                        onClick={() => {
                                            if (!canDelete) return;
                                            setShowMobileSheet(false);
                                            setShowConfirm(true);
                                        }}
                                        className={`flex w-full items-center gap-3 rounded-2xl p-3.5 text-[13.5px] font-bold transition-all ${!canDelete
                                            ? "cursor-not-allowed text-gray-400 opacity-50"
                                            : "text-rose-600 active:scale-[0.98] dark:text-rose-400"
                                            }`}
                                        style={{
                                            background: !canDelete
                                                ? isDark
                                                    ? "rgba(255,255,255,0.03)"
                                                    : "rgba(0,0,0,0.03)"
                                                : isDark
                                                    ? "rgba(239,68,68,0.12)"
                                                    : "rgba(239,68,68,0.08)",
                                            border: `1px solid ${!canDelete
                                                ? isDark
                                                    ? "rgba(255,255,255,0.06)"
                                                    : "rgba(0,0,0,0.06)"
                                                : isDark
                                                    ? "rgba(239,68,68,0.2)"
                                                    : "rgba(239,68,68,0.14)"
                                                }`,
                                        }}
                                    >
                                        <Trash2 size={18} />
                                        <span>حذف کاربر</span>
                                    </button>

                                    {!canDelete && deleteTooltipText && (
                                        <div className="flex items-center gap-1.5 px-2 text-[11.5px] text-rose-500 dark:text-rose-400">
                                            <AlertCircle size={14} className="shrink-0" />
                                            <span>{deleteTooltipText}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !isDeleting && setShowConfirm(false)}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{
                            background: "rgba(0,0,0,0.55)",
                            backdropFilter: "blur(6px)",
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            transition={{ duration: 0.18 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[360px] rounded-[2rem] p-5 shadow-2xl"
                            style={{
                                background: isDark ? "#0f172a" : "#ffffff",
                                border: isDark
                                    ? "1px solid rgba(255,255,255,0.08)"
                                    : "1px solid rgba(15,23,42,0.08)",
                            }}
                            dir="rtl"
                        >
                            <div className="mb-4 flex items-center gap-2.5">
                                <div
                                    className="flex h-9 w-9 items-center justify-center rounded-2xl"
                                    style={{
                                        background: isDark
                                            ? "rgba(239,68,68,0.14)"
                                            : "rgba(239,68,68,0.08)",
                                    }}
                                >
                                    <Trash2 size={16} className="text-red-500" />
                                </div>
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    حذف کاربر
                                </h3>
                            </div>

                            <p className="text-[12.5px] leading-6 text-gray-600 dark:text-gray-400">
                                آیا از حذف حساب{" "}
                                <span className="font-extrabold text-gray-900 dark:text-white">
                                    «{employee.full_name || employee.username}»
                                </span>{" "}
                                اطمینان دارید؟ این عملیات قابل بازگشت نیست.
                            </p>

                            {deleteError && (
                                <p className="mt-3 text-[11.5px] font-semibold text-red-500">
                                    {deleteError}
                                </p>
                            )}

                            <div className="mt-5 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(false)}
                                    disabled={isDeleting}
                                    className="flex-1 rounded-2xl py-2.5 text-[12.5px] font-bold disabled:opacity-50"
                                    style={{
                                        background: isDark
                                            ? "rgba(255,255,255,0.05)"
                                            : "rgba(15,23,42,0.05)",
                                        color: isDark ? "#cbd5e1" : "#475569",
                                    }}
                                >
                                    انصراف
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[12.5px] font-bold text-white disabled:opacity-60"
                                    style={{
                                        background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                        boxShadow: "0 10px 24px rgba(239,68,68,0.22)",
                                    }}
                                >
                                    {isDeleting ? (
                                        <Loader2 size={15} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={14} />
                                    )}
                                    {isDeleting ? "در حال حذف..." : "حذف کن"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <EditUserModal
                isOpen={showEdit}
                onClose={() => setShowEdit(false)}
                employee={employee}
                onUpdated={(updatedEmployee: ApiEmployee) => {
                    onUpdated(updatedEmployee);
                    setShowEdit(false);
                }}
            />

            <AnimatePresence>
                {showAdjust && (
                    <AdjustScoreModal
                        isOpen={showAdjust}
                        employeeId={employee.id}
                        employeeName={employee.full_name || employee.username}
                        currentScore={score}
                        onClose={() => setShowAdjust(false)}
                        onSuccess={(action, amount) =>
                            onScoreChanged?.(employee.id, action, amount)
                        }
                    />
                )}
            </AnimatePresence>
        </>
    );
}

export default memo(UserCard);