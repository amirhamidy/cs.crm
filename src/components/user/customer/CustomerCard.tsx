
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
    Phone,
    Building2,
    Trash2,
    SquarePen,
    User,
    CalendarDays,
    Star,
    MessageCircle,
    Loader2,
} from "lucide-react";
import type { Customer } from "@/types/customer";
import { useEmployeeDirectory } from "@/hooks/useEmployeeDirectory";
import CustomerDeleteModal from "./DeleteModal";
import CustomerEditModal from "./CustomerEditModal";
import CustomerScoresModal from "./CustomerScoresModal";
import axiosInstance from "@/lib/axiosInstance";

interface ScoreItem {
    id: number;
    created_by: number;
    score: number;
    reason: string;
    created_at: string;
}

interface Props {
    customer: Customer;
    index: number;
    hasActiveCase?: boolean;
    onDeleted: (id: number) => void;
    onEdited: (updated: Customer) => void;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function Avatar({ name, id }: { name: string; id: number }) {
    const hue = (id * 47) % 360;

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

function Stars({ score }: { score: number }) {
    return (
        <div className="flex items-center gap-0.5" dir="ltr">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={12}
                    fill={star <= Math.round(score) ? "#FBBF24" : "none"}
                    className={
                        star <= Math.round(score)
                            ? "text-amber-400"
                            : "text-gray-300 dark:text-gray-700"
                    }
                />
            ))}
        </div>
    );
}

export default function CustomerCard({
    customer,
    index,
    hasActiveCase = false,
    onDeleted,
    onEdited,
}: Props) {
    const { resolvedTheme } = useTheme();

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const isDark = mounted && resolvedTheme === "dark";

    const [hovered, setHovered] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showScores, setShowScores] = useState(false);
    const [tooltipVisible, setTooltipVisible] = useState(false);

    const [scores, setScores] = useState<ScoreItem[]>([]);
    const [scoresLoading, setScoresLoading] = useState(true);

    const { resolveName } = useEmployeeDirectory();

    const creatorName = resolveName(
        customer.created_by_username,
        customer.created_by_username
    );

    useEffect(() => {
        let cancelled = false;

        const fetchScores = async () => {
            setScoresLoading(true);

            try {
                const { data } = await axiosInstance.get<ScoreItem[]>(
                    `/customers/api/v1/customers/${customer.id}/scores/`
                );

                if (!cancelled) {
                    setScores(Array.isArray(data) ? data : []);
                }
            } catch {
                if (!cancelled) setScores([]);
            } finally {
                if (!cancelled) setScoresLoading(false);
            }
        };

        fetchScores();

        return () => {
            cancelled = true;
        };
    }, [customer.id]);

    const average = scores.length
        ? scores.reduce((sum, item) => sum + item.score, 0) / scores.length
        : 0;

    const handleDelete = async () => {
        setIsDeleting(true);

        try {
            await axiosInstance.delete(
                `/customers/api/v1/customers/${customer.id}/delete/`
            );

            onDeleted(customer.id);
        } catch {
            setIsDeleting(false);
            setShowConfirm(false);
        }
    };

    const borderColor = isDark
        ? "rgba(255,255,255,0.06)"
        : "rgba(0,0,0,0.06)";

    const surfaceBg = isDark ? "rgba(255,255,255,0.02)" : "#fafafa";

    const dividerColor = isDark
        ? "rgba(255,255,255,0.05)"
        : "rgba(0,0,0,0.05)";

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => {
                    setHovered(false);
                    setTooltipVisible(false);
                }}
                className="relative flex flex-col gap-3 overflow-visible rounded-2xl p-4"
                style={{
                    border: `1px solid ${borderColor}`,
                    background: surfaceBg,
                }}
            >
                <svg
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    style={{ borderRadius: "1rem", overflow: "visible" }}
                >
                    <defs>
                        <linearGradient
                            id={`cust-grad-${customer.id}`}
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
                        stroke={`url(#cust-grad-${customer.id})`}
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

                <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5">
                    <button
                        onClick={() => setShowEdit(true)}
                        className="flex h-7 w-7 items-center justify-center rounded-xl transition-colors"
                        style={{
                            background: isDark
                                ? "rgba(99,102,241,0.1)"
                                : "rgba(99,102,241,0.07)",
                            color: isDark ? "#a5b4fc" : "#6366f1",
                        }}
                        title="ویرایش"
                        type="button"
                    >
                        <SquarePen size={11} />
                    </button>

                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (hasActiveCase) return;
                                setShowConfirm(true);
                            }}
                            onMouseEnter={() => {
                                if (hasActiveCase) setTooltipVisible(true);
                            }}
                            onMouseLeave={() => setTooltipVisible(false)}
                            className="flex h-7 w-7 items-center justify-center rounded-xl transition-colors"
                            style={{
                                background: hasActiveCase
                                    ? isDark
                                        ? "rgba(255,255,255,0.04)"
                                        : "rgba(0,0,0,0.04)"
                                    : isDark
                                        ? "rgba(239,68,68,0.1)"
                                        : "rgba(239,68,68,0.07)",
                                color: hasActiveCase
                                    ? isDark
                                        ? "#4b5563"
                                        : "#9ca3af"
                                    : "#ef4444",
                                cursor: hasActiveCase
                                    ? "not-allowed"
                                    : "pointer",
                            }}
                            type="button"
                        >
                            <Trash2 size={11} />
                        </button>

                        <AnimatePresence>
                            {tooltipVisible && (
                                <motion.div
                                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                    className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap"
                                    dir="rtl"
                                >
                                    <div
                                        className="flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-center shadow-xl"
                                        style={{
                                            background: isDark
                                                ? "#0f172a"
                                                : "#1e293b",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                        }}
                                    >
                                        <span className="text-[11px] font-bold text-white">
                                            این مشتری پرونده دارد
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            برای حذف آن باید ابتدا پرونده‌هایش را حذف کنید
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                    <Avatar name={customer.full_name} id={customer.id} />

                    <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="truncate text-[13.5px] font-extrabold leading-tight text-gray-800 dark:text-gray-100">
                            {customer.full_name}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            #{customer.id}
                        </p>
                    </div>

                    {customer.status_display && (
                        <div className="absolute left-2.5 top-[50%] flex -translate-y-1/2 justify-center">
                            <span
                                className="rounded-lg px-2 py-0.5 text-[10.5px] font-bold"
                                style={
                                    customer.status_display === "بالقوه"
                                        ? {
                                            background:
                                                "linear-gradient(135deg, rgba(148,163,184,0.18), rgba(100,116,139,0.18))",
                                            color: isDark
                                                ? "#cbd5e1"
                                                : "#475569",
                                            border:
                                                "1px solid rgba(148,163,184,0.25)",
                                        }
                                        : {
                                            background:
                                                "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(6,182,212,0.18))",
                                            color: isDark
                                                ? "#60a5fa"
                                                : "#0369a1",
                                            border:
                                                "1px solid rgba(59,130,246,0.25)",
                                        }
                                }
                            >
                                {customer.status_display}
                            </span>
                        </div>
                    )}
                </div>

                <div
                    className="flex flex-col gap-1.5 border-t pt-2.5"
                    style={{ borderColor: dividerColor }}
                >
                    <div className="flex items-center gap-2 text-[11.5px] text-gray-400 dark:text-gray-500">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span dir="ltr">{customer.phone_number}</span>
                    </div>

                    {customer.company_name && (
                        <div className="flex items-center gap-2 text-[11.5px] text-gray-400 dark:text-gray-500">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                                {customer.company_name}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-[11.5px] text-gray-400 dark:text-gray-500">
                        <div className="flex min-w-0 items-center gap-1.5">
                            <User className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{creatorName}</span>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            <span>{formatDate(customer.created_at)}</span>
                        </div>
                    </div>
                </div>

                <div
                    className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5"
                    style={{
                        borderColor: isDark
                            ? "rgba(251,191,36,0.12)"
                            : "rgba(245,158,11,0.15)",
                        background: isDark
                            ? "rgba(251,191,36,0.04)"
                            : "rgba(245,158,11,0.04)",
                    }}
                >
                    <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-400/10">
                            <Star
                                size={14}
                                fill={scores.length ? "#FBBF24" : "none"}
                                className="text-amber-400"
                            />
                        </div>

                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-gray-400">
                                امتیاز مشتری
                            </p>

                            <div className="mt-1 flex items-center gap-2">
                                {scoresLoading ? (
                                    <Loader2
                                        size={13}
                                        className="animate-spin text-amber-400"
                                    />
                                ) : (
                                    <>
                                        <span className="text-[14px] font-black text-amber-500">
                                            {scores.length
                                                ? average.toFixed(1)
                                                : "—"}
                                        </span>
                                        <Stars score={average} />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowScores(true)}
                        className="flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-400/10 px-2.5 py-2 text-[10px] font-bold text-amber-600 transition-colors hover:bg-amber-400/20 dark:text-amber-400"
                    >
                        <MessageCircle size={12} />
                        نظرات
                    </button>
                </div>
            </motion.div>

            <CustomerDeleteModal
                customerName={customer.full_name}
                isOpen={showConfirm}
                isDeleting={isDeleting}
                onConfirm={handleDelete}
                onClose={() => setShowConfirm(false)}
            />

            <CustomerEditModal
                customer={customer}
                isOpen={showEdit}
                onClose={() => setShowEdit(false)}
                onEdited={onEdited}
            />

            <CustomerScoresModal
                customerId={customer.id}
                customerName={customer.full_name}
                isOpen={showScores}
                onClose={() => setShowScores(false)}
            />
        </>
    );
}