"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    CalendarDays,
    Loader2,
    MessageCircle,
    Sparkles,
    Star,
    UserRound,
    X,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";

interface ScoreItem {
    id: number;
    created_by: number;
    score: number;
    reason: string;
    created_at: string;
}

interface Employee {
    id: number;
    full_name: string;
    username: string;
}

interface CustomerScoresModalProps {
    customerId: number;
    customerName?: string;
    isOpen: boolean;
    onClose: () => void;
}

const formatDate = (date: string) =>
    new Intl.DateTimeFormat("fa-IR", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(date));

const Stars = ({ score }: { score: number }) => (
    <div className="flex items-center gap-1" dir="ltr">
        {[1, 2, 3, 4, 5].map((star) => (
            <Star
                key={star}
                size={16}
                className={
                    star <= score
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300 dark:text-slate-600"
                }
            />
        ))}
    </div>
);

export default function CustomerScoresModal({
    customerId,
    customerName,
    isOpen,
    onClose,
}: CustomerScoresModalProps) {
    const [scores, setScores] = useState<ScoreItem[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError("");

                const [scoresResponse, employeesResponse] =
                    await Promise.all([
                        axiosInstance.get(
                            `/customers/api/v1/customers/${customerId}/scores/`
                        ),
                        axiosInstance.get(
                            "/accounts/api/v1/employee/list/"
                        ),
                    ]);

                setScores(
                    Array.isArray(scoresResponse.data)
                        ? scoresResponse.data
                        : []
                );

                setEmployees(
                    Array.isArray(employeesResponse.data)
                        ? employeesResponse.data
                        : []
                );
            } catch {
                setError("دریافت امتیازها و لیست کارمندان انجام نشد.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [customerId, isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    const employeeMap = useMemo(
        () =>
            new Map(
                employees.map((employee) => [
                    Number(employee.id),
                    employee.full_name,
                ])
            ),
        [employees]
    );

    const averageScore = useMemo(() => {
        if (!scores.length) return 0;

        return (
            scores.reduce((total, item) => total + Number(item.score || 0), 0) /
            scores.length
        ).toFixed(1);
    }, [scores]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) onClose();
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 25, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 25, scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#17191f]"
                        dir="rtl"
                    >
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 dark:border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
                                    <MessageCircle size={23} />
                                </div>

                                <div>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white">
                                        نظرات و امتیازها
                                    </h2>

                                    <p className="mt-1 max-w-[230px] truncate text-xs text-slate-500 dark:text-slate-400">
                                        {customerName || "مشتری"}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-rose-100 hover:text-rose-500 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-rose-500/15"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-5">
                            <div className="mb-5 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 p-5 text-white shadow-xl shadow-indigo-500/10">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <div className="mb-2 flex items-center gap-2 text-sm text-white/80">
                                            <Sparkles size={16} />
                                            میانگین امتیاز مشتری
                                        </div>

                                        <div className="flex items-end gap-2">
                                            <span className="text-5xl font-black">
                                                {averageScore}
                                            </span>

                                            <span className="mb-2 text-sm text-white/70">
                                                از ۵
                                            </span>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl bg-white/15 px-4 py-3 text-center backdrop-blur-sm">
                                        <div className="text-2xl font-black">
                                            {scores.length}
                                        </div>

                                        <div className="mt-1 text-xs text-white/75">
                                            امتیاز ثبت‌شده
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {loading && (
                                <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                                    <Loader2
                                        size={30}
                                        className="animate-spin text-indigo-500"
                                    />

                                    <span className="text-sm">
                                        در حال دریافت نظرات...
                                    </span>
                                </div>
                            )}

                            {!loading && error && (
                                <div className="rounded-2xl bg-rose-50 p-5 text-center text-sm font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                                    {error}
                                </div>
                            )}

                            {!loading && !error && !scores.length && (
                                <div className="flex min-h-52 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 text-center dark:border-white/10">
                                    <MessageCircle
                                        size={35}
                                        className="mb-3 text-slate-300 dark:text-slate-600"
                                    />

                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                        هنوز امتیازی برای این مشتری ثبت نشده است.
                                    </p>
                                </div>
                            )}

                            {!loading && !error && scores.length > 0 && (
                                <div className="space-y-4">
                                    {scores.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.035]"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                                                        <UserRound
                                                            size={20}
                                                        />
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                                                            {employeeMap.get(
                                                                Number(
                                                                    item.created_by
                                                                )
                                                            ) ||
                                                                "کارمند ناشناس"}
                                                        </p>

                                                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                                            <CalendarDays
                                                                size={13}
                                                            />

                                                            <span>
                                                                {formatDate(
                                                                    item.created_at
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="shrink-0 rounded-xl bg-white px-2.5 py-2 shadow-sm dark:bg-white/5">
                                                    <Stars
                                                        score={Number(
                                                            item.score
                                                        )}
                                                    />
                                                </div>
                                            </div>

                                            {item.reason && (
                                                <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm leading-7 text-slate-600 dark:bg-white/[0.04] dark:text-slate-300">
                                                    {item.reason}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}