"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Pencil, Phone, Star, Trash2, X } from "lucide-react";
import { useTheme } from "next-themes";

import axiosInstance from "@/lib/axiosInstance";
import type { ApiEmployee, ApiUser } from "@/types/users";
import EditUserModal from "@/components/admin/users/EditUserModal";

interface UserCardProps {
    employee: ApiEmployee;
    index: number;
    hasActiveTasks?: boolean;
    onDelete: (id: number) => void;
    onUpdated: (employee: ApiEmployee) => void;
}

const AVATAR_GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#ec4899", "#8b5cf6"],
    ["#06b6d4", "#3b82f6"],
    ["#10b981", "#14b8a6"],
    ["#f59e0b", "#ef4444"],
] as const;

function getErrorMessage(error: unknown, fallback: string) {
    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: unknown }).response === "object"
    ) {
        const response = (error as { response?: { data?: { detail?: string; message?: string } } })
            .response;
        const detail = response?.data?.detail || response?.data?.message;
        if (detail) return detail;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
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

export default function UserCard({
    employee,
    index,
    hasActiveTasks = false,
    onDelete,
    onUpdated,
}: UserCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [hovered, setHovered] = useState(false);
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [score, setScore] = useState<number | null>(null);
    const [scoreLoading, setScoreLoading] = useState(true);
    const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const fetchScore = async () => {
            if (!employee?.id) return;

            setScoreLoading(true);

            try {
                const { data } = await axiosInstance.get(`/score/api/v1/employees/${employee.id}/`);
                if (!mounted) return;

                const value =
                    typeof data?.score === "number"
                        ? data.score
                        : typeof data?.total_score === "number"
                            ? data.total_score
                            : null;

                setScore(value);
            } catch {
                if (mounted) {
                    setScore(null);
                }
            } finally {
                if (mounted) {
                    setScoreLoading(false);
                }
            }
        };

        const fetchPhoneNumber = async () => {
            if (!employee?.username) return;

            try {
                const { data } = await axiosInstance.get("/accounts/api/v1/user/list/");
                if (!mounted) return;

                const users = extractUserList(data);
                const matched = users.find(
                    (u) => u.username?.trim().toLowerCase() === employee.username?.trim().toLowerCase()
                );

                if (matched?.phone_number) {
                    setPhoneNumber(matched.phone_number);
                }
            } catch {
                if (mounted) {
                    setPhoneNumber(null);
                }
            }
        };

        fetchScore();
        fetchPhoneNumber();

        return () => {
            mounted = false;
        };
    }, [employee?.id, employee?.username]);

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

    const isSelf = loggedUserId !== null && loggedUserId === employee.id;
    const isAdmin = employee.type === 1;
    const canDelete = !isAdmin && !isSelf && !hasActiveTasks;

    const tooltipInfo = useMemo(() => {
        if (isAdmin) {
            return {
                title: "حساب مدیر سیستم",
                subtitle: "حذف ادمین مجاز نیست",
            };
        }

        if (isSelf) {
            return {
                title: "حساب فعلی شما",
                subtitle: "نمی‌توانید حساب خودتان را حذف کنید",
            };
        }

        if (hasActiveTasks) {
            return {
                title: "این کاربر تسک دارد",
                subtitle: "برای حذف، اول باید تسک‌های مربوط به این کاربر حذف شوند",
            };
        }

        return null;
    }, [hasActiveTasks, isAdmin, isSelf]);

    const employeeName = employee.full_name?.trim() || "بدون نام";
    const username = employee.username?.trim() || "unknown";
    const [start, end] = AVATAR_GRADIENTS[employee.id % AVATAR_GRADIENTS.length];

    const joinedDate = employee.created_at
        ? new Date(employee.created_at).toLocaleDateString("fa-IR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
          })
        : "نامشخص";

    const handleCloseConfirm = () => {
        if (deleting) return;
        setShowConfirm(false);
        setDeleteError("");
    };

    const handleDelete = async () => {
        if (!canDelete) return;

        setDeleting(true);
        setDeleteError("");

        try {
            const [usersRes, employeesRes] = await Promise.all([
                axiosInstance.get("/accounts/api/v1/user/list/").catch(() => null),
                axiosInstance.get("/accounts/api/v1/employee/").catch(() => null),
            ]);

            const users = usersRes ? extractUserList(usersRes.data) : [];
            const employees = employeesRes ? extractEmployeeList(employeesRes.data) : [];

            const normalizedUsername = username.toLowerCase();

            const matchedUser = users.find(
                (user) => user.username?.trim().toLowerCase() === normalizedUsername,
            );

            const matchedEmployee = employees.find(
                (item) =>
                    item.username?.trim().toLowerCase() === normalizedUsername ||
                    item.id === employee.id,
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
        } catch (error) {
            setDeleteError(getErrorMessage(error, "حذف کاربر با خطا مواجه شد"));
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => {
                    setHovered(false);
                    setTooltipVisible(false);
                }}
                className="relative flex min-h-[148px] flex-col justify-between overflow-visible rounded-3xl p-4"
                style={{
                    background: isDark ? "rgba(255,255,255,0.03)" : "#fafafa",
                    border: isDark
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "1px solid rgba(15,23,42,0.06)",
                    boxShadow: isDark
                        ? "0 8px 30px rgba(0,0,0,0.22)"
                        : "0 8px 24px rgba(15,23,42,0.05)",
                }}
            >
                <svg className="pointer-events-none absolute inset-0 h-full w-full">
                    <defs>
                        <linearGradient
                            id={`card-border-${employee.id}`}
                            x1="100%"
                            y1="100%"
                            x2="0%"
                            y2="0%"
                        >
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>

                    <motion.rect
                        x="1"
                        y="1"
                        width="calc(100% - 2px)"
                        height="calc(100% - 2px)"
                        rx="23"
                        ry="23"
                        fill="none"
                        stroke={`url(#card-border-${employee.id})`}
                        strokeWidth="1.4"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={
                            hovered ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }
                        }
                        transition={{ duration: 0.45, ease: "easeInOut" }}
                    />
                </svg>

                <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5">
                    {!scoreLoading && score !== null && (
                        <div
                            className="flex h-7 items-center justify-center gap-1 rounded-xl px-2 leading-none"
                            style={{
                                background: isDark
                                    ? "rgba(234,179,8,0.14)"
                                    : "rgba(234,179,8,0.08)",
                                color: isDark ? "#fde047" : "#ca8a04",
                            }}
                            title="امتیاز عملکرد"
                        >
                            <Star size={11} fill="currentColor" strokeWidth={0} className="shrink-0" />
                            <span className="text-[11px] font-extrabold leading-none">{score}</span>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => setShowEditModal(true)}
                        className="flex h-7 w-7 items-center justify-center rounded-xl"
                        style={{
                            background: isDark
                                ? "rgba(99,102,241,0.12)"
                                : "rgba(99,102,241,0.08)",
                            color: isDark ? "#a5b4fc" : "#6366f1",
                        }}
                        title="ویرایش"
                    >
                        <Pencil size={11} />
                    </button>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (canDelete) {
                                    setShowConfirm(true);
                                }
                            }}
                            onMouseEnter={() => {
                                if (!canDelete) {
                                    setTooltipVisible(true);
                                }
                            }}
                            onMouseLeave={() => setTooltipVisible(false)}
                            className="flex h-7 w-7 items-center justify-center rounded-xl"
                            style={{
                                background: canDelete
                                    ? isDark
                                        ? "rgba(239,68,68,0.12)"
                                        : "rgba(239,68,68,0.08)"
                                    : isDark
                                        ? "rgba(255,255,255,0.05)"
                                        : "rgba(15,23,42,0.04)",
                                color: canDelete ? "#ef4444" : isDark ? "#4b5563" : "#9ca3af",
                                cursor: canDelete ? "pointer" : "not-allowed",
                            }}
                            title={canDelete ? "حذف" : "عدم امکان حذف"}
                        >
                            <Trash2 size={11} />
                        </button>

                        <AnimatePresence>
                            {tooltipVisible && tooltipInfo && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap"
                                >
                                    <div
                                        className="rounded-2xl px-3 py-2 text-center shadow-xl"
                                        style={{
                                            background: isDark ? "#0f172a" : "#1e293b",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                        }}
                                    >
                                        <p className="text-[11px] font-bold text-white">
                                            {tooltipInfo.title}
                                        </p>
                                        <p className="mt-1 text-[10px] text-slate-300">
                                            {tooltipInfo.subtitle}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="flex my-auto mt-5 items-center gap-3">
                    <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[15px] font-extrabold text-white"
                        style={{
                            background: `linear-gradient(135deg, ${start}, ${end})`,
                        }}
                    >
                        {employeeName.charAt(0)}
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">
                            {employeeName}
                        </h3>
                        <div className="mt-0.5 flex items-center gap-x-2 gap-y-0.5">
                            <span className="truncate text-[11.5px] text-gray-500 dark:text-gray-400">
                                @{username}
                            </span>
                             {phoneNumber && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500" dir="ltr">
                                    <Phone size={10} className="shrink-0" />
                                    {phoneNumber}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        {joinedDate}
                    </span>

                    <span
                        className="inline-flex h-7 items-center rounded-xl px-2.5 text-[11px] font-bold"
                        style={{
                            background: isAdmin
                                ? isDark
                                    ? "rgba(245,158,11,0.14)"
                                    : "rgba(245,158,11,0.1)"
                                : isDark
                                    ? "rgba(99,102,241,0.14)"
                                    : "rgba(99,102,241,0.08)",
                            color: isAdmin
                                ? isDark
                                    ? "#fbbf24"
                                    : "#d97706"
                                : isDark
                                    ? "#a5b4fc"
                                    : "#6366f1",
                        }}
                    >
                        {isAdmin ? "ادمین سیستم" : "کارمند"}
                    </span>
                </div>
            </motion.div>

            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCloseConfirm}
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        style={{
                            background: "rgba(0,0,0,0.5)",
                            backdropFilter: "blur(4px)",
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 16 }}
                            transition={{ duration: 0.18 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[360px] rounded-[2rem] p-5"
                            style={{
                                background: isDark ? "#0f172a" : "#ffffff",
                                border: isDark
                                    ? "1px solid rgba(255,255,255,0.07)"
                                    : "1px solid rgba(15,23,42,0.07)",
                                boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
                            }}
                            dir="rtl"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="flex h-9 w-9 items-center justify-center rounded-2xl"
                                        style={{
                                            background: isDark
                                                ? "rgba(239,68,68,0.14)"
                                                : "rgba(239,68,68,0.08)",
                                        }}
                                    >
                                        <Trash2 size={15} className="text-red-500" />
                                    </div>
                                    <h3 className="text-[13.5px] font-extrabold text-gray-900 dark:text-white">
                                        حذف کاربر
                                    </h3>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCloseConfirm}
                                    disabled={deleting}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 disabled:opacity-50"
                                    style={{
                                        background: isDark
                                            ? "rgba(255,255,255,0.05)"
                                            : "rgba(15,23,42,0.05)",
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <p className="text-[12.5px] leading-6 text-gray-600 dark:text-gray-400">
                                کاربر{" "}
                                <span className="font-extrabold text-gray-900 dark:text-white">
                                    {employeeName}
                                </span>{" "}
                                حذف خواهد شد. این عملیات قابل بازگشت نیست.
                            </p>

                            {deleteError && (
                                <p className="mt-3 text-[11.5px] font-semibold text-red-500">
                                    {deleteError}
                                </p>
                            )}

                            <div className="mt-5 flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleCloseConfirm}
                                    disabled={deleting}
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
                                    disabled={deleting}
                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[12.5px] font-bold text-white disabled:opacity-60"
                                    style={{
                                        background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                        boxShadow: "0 10px 24px rgba(239,68,68,0.22)",
                                    }}
                                >
                                    {deleting ? (
                                        <Loader2 size={15} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={13} />
                                    )}
                                    {deleting ? "" : "حذف کن"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <EditUserModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                employee={employee}
                onUpdated={(updatedEmployee: ApiEmployee) => {
                    onUpdated(updatedEmployee);
                    setShowEditModal(false);
                }}
            />
        </>
    );
}
