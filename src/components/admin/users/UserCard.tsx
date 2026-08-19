"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Pencil, X, Loader, Star } from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import type { ApiEmployee, ApiUser } from "@/types/users";
import EditUserModal from "./EditUserModal";

interface UserCardProps {
    employee: ApiEmployee;
    index: number;
    onDelete: (id: number) => void;
    onUpdated: (updatedEmployee: ApiEmployee) => void;
}

const AVATAR_GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#3b82f6", "#6366f1"],
    ["#8b5cf6", "#ec4899"],
    ["#06b6d4", "#6366f1"],
    ["#f59e0b", "#ef4444"],
];

function getErrorMessage(err: unknown, fallback: string) {
    const error = err as AxiosError<Record<string, unknown>>;
    const data = error.response?.data;
    if (!data) return fallback;
    const possibleKeys = ["detail", "message", "error", "non_field_errors"];
    for (const key of possibleKeys) {
        const value = data[key];
        if (typeof value === "string") return value;
        if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }
    return fallback;
}

function extractUserList(data: unknown): ApiUser[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>;
        if (Array.isArray(obj.results)) return obj.results as ApiUser[];
        if (Array.isArray(obj.data)) return obj.data as ApiUser[];
        if (Array.isArray(obj.users)) return obj.users as ApiUser[];
    }
    return [];
}

function extractEmployeeList(data: unknown): ApiEmployee[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>;
        if (Array.isArray(obj.results)) return obj.results as ApiEmployee[];
        if (Array.isArray(obj.data)) return obj.data as ApiEmployee[];
        if (Array.isArray(obj.employees)) return obj.employees as ApiEmployee[];
    }
    return [];
}

export default function UserCard({ employee, index, onDelete }: UserCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [hovered, setHovered] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [showEditModal, setShowEditModal] = useState(false);
    const [localEmployee, setLocalEmployee] = useState(employee);
    const [score, setScore] = useState<number | null>(null);
    const [scoreLoading, setScoreLoading] = useState(true);

    useEffect(() => {
        if (!localEmployee?.id) return;
        let alive = true;
        setScoreLoading(true);

        axiosInstance
            .get(`/score/api/v1/employees/${localEmployee.id}/`)
            .then(({ data }) => {
                if (!alive) return;
                const value =
                    typeof data?.score === "number"
                        ? data.score
                        : typeof data?.total_score === "number"
                            ? data.total_score
                            : null;
                setScore(value);
            })
            .catch(() => {
                if (alive) setScore(null);
            })
            .finally(() => {
                if (alive) setScoreLoading(false);
            });

        return () => {
            alive = false;
        };
    }, [localEmployee?.id]);

    if (
        !localEmployee ||
        typeof localEmployee.id !== "number" ||
        typeof localEmployee.full_name !== "string" ||
        typeof localEmployee.username !== "string"
    ) {
        return null;
    }

    const getLoggedUserId = (): number | null => {
        if (typeof window !== "undefined") {
            try {
                const raw = localStorage.getItem("user");
                if (raw) {
                    const parsed = JSON.parse(raw);
                    return typeof parsed.id === "number" ? parsed.id : null;
                }
            } catch {
                return null;
            }
        }
        return null;
    };

    const loggedUserId = getLoggedUserId();
    const isSelf = loggedUserId !== null && loggedUserId === localEmployee.id;
    const isAdmin = localEmployee.type === 1;
    const canDelete = !isAdmin && !isSelf;

    const employeeName = localEmployee.full_name.trim() || "بدون نام";
    const username = localEmployee.username.trim() || "unknown";

    const gradient = AVATAR_GRADIENTS[localEmployee.id % AVATAR_GRADIENTS.length];
    const start = gradient[0];
    const end = gradient[1];

    const joinedDate = localEmployee.created_at
        ? new Date(localEmployee.created_at).toLocaleDateString("fa-IR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        })
        : "نامشخص";

    async function handleDelete() {
        if (!localEmployee || !canDelete) return;

        setDeleting(true);
        setDeleteError("");

        try {
            const [usersRes, employeesRes] = await Promise.all([
                axiosInstance.get("/accounts/api/v1/user/list/").catch(() => null),
                axiosInstance.get("/accounts/api/v1/employee/").catch(() => null),
            ]);

            const users = usersRes ? extractUserList(usersRes.data) : [];
            const employees = employeesRes ? extractEmployeeList(employeesRes.data) : [];

            const targetUsername = localEmployee.username.trim().toLowerCase();

            const matchedUser = users.find(
                (u) => u.username?.trim().toLowerCase() === targetUsername
            );
            const matchedEmployee = employees.find(
                (e) =>
                    e.username?.trim().toLowerCase() === targetUsername ||
                    e.id === localEmployee.id
            );

            const employeeDeleteId = matchedEmployee?.id ?? localEmployee.id;
            const userDeleteId = matchedUser?.id;

            if (employeeDeleteId) {
                await axiosInstance.delete(
                    `/accounts/api/v1/employee/${employeeDeleteId}/delete/`
                );
            }

            if (userDeleteId && matchedUser?.type !== 1) {
                await axiosInstance.delete(
                    `/accounts/api/v1/user/${userDeleteId}/delete/`
                );
            }

            onDelete(localEmployee.id);
            setShowConfirm(false);
        } catch (err) {
            setDeleteError(getErrorMessage(err, "خطا در حذف کارمند"));
        } finally {
            setDeleting(false);
        }
    }

    function handleClose() {
        if (deleting) return;
        setShowConfirm(false);
        setDeleteError("");
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                className="relative rounded-2xl p-4 flex flex-col gap-3 overflow-hidden"
                style={{
                    border: isDark
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "1px solid rgba(0,0,0,0.06)",
                    minHeight: "130px",
                    background: isDark ? "rgba(255,255,255,0.02)" : "#fafafa",
                }}
            >
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ borderRadius: "1rem" }}
                >
                    <defs>
                        <linearGradient
                            id={`borderGrad-${localEmployee.id}`}
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
                        rx="15"
                        ry="15"
                        fill="none"
                        stroke={`url(#borderGrad-${localEmployee.id})`}
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

                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                    {!scoreLoading && score !== null && (
                        <div
                            className="h-7 px-2 rounded-xl flex items-center gap-1 flex-shrink-0"
                            style={{
                                background: isDark
                                    ? "rgba(234,179,8,0.12)"
                                    : "rgba(234,179,8,0.08)",
                                color: isDark ? "#fde047" : "#ca8a04",
                            }}
                            title="امتیاز عملکرد"
                        >
                            <Star size={11} fill="currentColor" strokeWidth={0} />
                            <span className="text-[11px] font-extrabold">{score}</span>
                        </div>
                    )}
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors"
                        style={{
                            background: isDark
                                ? "rgba(99,102,241,0.1)"
                                : "rgba(99,102,241,0.07)",
                            color: isDark ? "#a5b4fc" : "#6366f1",
                        }}
                        title="ویرایش"
                        type="button"
                    >
                        <Pencil size={11} />
                    </button>
                    {canDelete && (
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors"
                            style={{
                                background: isDark
                                    ? "rgba(239,68,68,0.1)"
                                    : "rgba(239,68,68,0.07)",
                                color: "#ef4444",
                            }}
                            title="حذف"
                            type="button"
                        >
                            <Trash2 size={11} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3 pt-1">
                    <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-[15px] font-extrabold flex-shrink-0"
                        style={{
                            background: `linear-gradient(135deg, ${start}, ${end})`,
                        }}
                    >
                        {employeeName.charAt(0)}
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                        <p className="text-[13.5px] font-extrabold text-gray-800 dark:text-gray-100 leading-tight truncate">
                            {employeeName}
                        </p>
                        <p className="text-[11.5px] text-gray-400 dark:text-gray-500 truncate">
                            @{username}
                        </p>
                    </div>
                </div>

                <div
                    className="pt-2.5 border-t"
                    style={{
                        borderColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.05)",
                    }}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-[11.5px] text-gray-400 dark:text-gray-500">
                            عضویت از {joinedDate}
                        </p>
                        <span
                            className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
                            style={{
                                background: isAdmin
                                    ? isDark
                                        ? "rgba(245,158,11,0.15)"
                                        : "rgba(245,158,11,0.08)"
                                    : isDark
                                        ? "rgba(99,102,241,0.12)"
                                        : "rgba(99,102,241,0.07)",
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
                </div>
            </motion.div>

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
                            className="w-full max-w-[360px] rounded-[2rem] overflow-hidden border p-5"
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
                                className="flex items-center justify-between px-2 py-2 border-b"
                                style={{
                                    borderColor: isDark
                                        ? "rgba(255,255,255,0.06)"
                                        : "rgba(0,0,0,0.06)",
                                }}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                                        style={{
                                            background: isDark
                                                ? "rgba(239,68,68,0.12)"
                                                : "rgba(239,68,68,0.08)",
                                        }}
                                    >
                                        <Trash2 size={14} className="text-red-500" />
                                    </div>
                                    <h3 className="text-[13.5px] font-extrabold text-gray-900 dark:text-white">
                                        حذف کارمند
                                    </h3>
                                </div>
                                <button
                                    onClick={handleClose}
                                    disabled={deleting}
                                    className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-40"
                                    style={{
                                        background: isDark
                                            ? "rgba(255,255,255,0.05)"
                                            : "rgba(0,0,0,0.04)",
                                    }}
                                    type="button"
                                >
                                    <X size={13} />
                                </button>
                            </div>

                            <div className="px-2 py-2 flex flex-col gap-4">
                                <p className="text-[12.5px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                    کارمند{" "}
                                    <span className="font-extrabold text-gray-800 dark:text-gray-200">
                                        {employeeName}
                                    </span>{" "}
                                    حذف خواهد شد. این عملیات قابل بازگشت نیست.
                                </p>

                                {deleteError && (
                                    <p className="text-[11.5px] text-red-500 dark:text-red-400 font-semibold text-center">
                                        {deleteError}
                                    </p>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleClose}
                                        disabled={deleting}
                                        className="flex-1 py-2.5 rounded-2xl text-[12.5px] font-bold transition-colors disabled:opacity-40"
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
                                        disabled={deleting}
                                        className="flex-1 py-2.5 rounded-2xl text-[12.5px] font-bold text-white flex items-center justify-center transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                                        style={{
                                            background:
                                                "linear-gradient(135deg, #ef4444, #dc2626)",
                                            boxShadow: "0 4px 14px rgba(239,68,68,0.3)",
                                        }}
                                        type="button"
                                    >
                                        {deleting ? (
                                            <Loader size={15} className="animate-spin" />
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

            <EditUserModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                employee={localEmployee}
                onUpdated={(updatedEmployee) => {
                    setLocalEmployee(updatedEmployee);
                    setShowEditModal(false);
                }}
            />
        </>
    );
}
