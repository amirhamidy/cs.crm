"use client";

import { useEffect, useState, useRef } from "react";
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
    const [showActions, setShowActions] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showScores, setShowScores] = useState(false);
    const [tooltipVisible, setTooltipVisible] = useState(false);

    const [scores, setScores] = useState<ScoreItem[]>([]);
    const [scoresLoading, setScoresLoading] = useState(true);

    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    const handleMouseEnter = () => {
        setHovered(true);
        hoverTimeoutRef.current = setTimeout(() => {
            setShowActions(true);
        }, 300);
    };

    const handleMouseLeave = () => {
        setHovered(false);
        setShowActions(false);
        setTooltipVisible(false);
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    };

    const borderColor = isDark
        ? "rgba(255,255,255,0.06)"
        : "rgba(0,0,0,0.06)";

    const surfaceBg = isDark ? "rgba(255,255,255,0.02)" : "#fafafa";

    const dividerColor = isDark
        ? "rgba(255,255,255,0.05)"
        : "rgba(0,0,0,0.05)";

    const isPotential = customer.status_display === "بالقوه";

    const spring = { type: "spring" as const, stiffness: 420, damping: 26 };

    const iconBg = isDark ? "#2a2a2a" : "#eeeeee";
    const iconColor = isDark ? "#e5e7eb" : "#374151";

    const actions = [
        {
            key: "edit",
            icon: <SquarePen size={16} />,
            offset: { x: -34, y: -18 },
            delay: 0.03,
            disabled: false,
            onClick: () => setShowEdit(true),
            title: "ویرایش",
        },
        {
            key: "delete",
            icon: <Trash2 size={16} />,
            offset: { x: 34, y: -18 },
            delay: 0.08,
            disabled: hasActiveCase,
            onClick: () => {
                if (hasActiveCase) return;
                setShowConfirm(true);
            },
            title: "حذف",
        },
        {
            key: "scores",
            icon: <MessageCircle size={16} />,
            offset: { x: 0, y: 26 },
            delay: 0.13,
            disabled: false,
            onClick: () => setShowScores(true),
            title: "نظرات",
        },
    ];

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                whileHover={{ y: -4 }}
                className="group relative flex flex-col gap-3 overflow-visible rounded-2xl p-4"
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
                        stroke={`url(#cust-grad-${customer.id})`}
                        strokeWidth="1"
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

                <div className="absolute left-3 top-3 z-10">
                    <div
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black"
                        style={{
                            background: isDark
                                ? "rgba(245,158,11,0.14)"
                                : "rgba(245,158,11,0.1)",
                            border: `1px solid ${isDark ? "rgba(245,158,11,0.25)" : "rgba(245,158,11,0.3)"}`,
                            color: isDark ? "#fbbf24" : "#d97706",
                        }}
                    >
                        {scoresLoading ? (
                            <Loader2 size={12} className="animate-spin" />
                        ) : (
                            <>
                                <Star size={12} fill="currentColor" />
                                <span>
                                    {scores.length && average > 0
                                        ? average.toFixed(1)
                                        : "—"}
                                </span>
                            </>
                        )}
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

                    {customer.status_display && (
                        <div className="flex items-center gap-1.5 pt-0.5">
                            <span
                                className="rounded-lg px-2 py-0.5 text-[10.5px] font-bold"
                                style={
                                    isPotential
                                        ? {
                                            background:
                                                "linear-gradient(135deg, rgba(148,163,184,0.18), rgba(100,116,139,0.18))",
                                            color: isDark ? "#cbd5e1" : "#475569",
                                            border: "1px solid rgba(148,163,184,0.25)",
                                        }
                                        : {
                                            background:
                                                "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(6,182,212,0.18))",
                                            color: isDark ? "#60a5fa" : "#0369a1",
                                            border: "1px solid rgba(59,130,246,0.25)",
                                        }
                                }
                            >
                                {customer.status_display}
                            </span>
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {showActions && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl"
                            style={{
                                background: isDark
                                    ? "rgba(10,12,20,0.55)"
                                    : "rgba(255,255,255,0.55)",
                                backdropFilter: "blur(6px)",
                                WebkitBackdropFilter: "blur(6px)",
                            }}
                        >
                            <div className="relative h-20 w-40">
                                {actions.map((action) => (
                                    <div
                                        key={action.key}
                                        className="absolute left-1/2 top-1/2"
                                        style={{
                                            marginLeft: "-22px",
                                            marginTop: "-22px",
                                        }}
                                    >
                                        <div className="relative">
                                            <motion.button
                                                type="button"
                                                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                                                animate={{
                                                    x: action.offset.x,
                                                    y: action.offset.y,
                                                    scale: 1,
                                                    opacity: 1,
                                                }}
                                                exit={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                                                transition={{ ...spring, delay: action.delay }}
                                                whileHover={
                                                    action.disabled ? {} : { scale: 1.05 }
                                                }
                                                whileTap={
                                                    action.disabled ? {} : { scale: 0.96 }
                                                }
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    action.onClick();
                                                }}
                                                onMouseEnter={() => {
                                                    if (
                                                        action.key === "delete" &&
                                                        hasActiveCase
                                                    )
                                                        setTooltipVisible(true);
                                                }}
                                                onMouseLeave={() => setTooltipVisible(false)}
                                                title={action.title}
                                                className="flex h-11 w-11 items-center justify-center rounded-full"
                                                style={{
                                                    background: action.disabled
                                                        ? isDark
                                                            ? "rgba(42,42,42,0.5)"
                                                            : "rgba(238,238,238,0.5)"
                                                        : iconBg,
                                                    color: action.disabled
                                                        ? isDark
                                                            ? "#64748b"
                                                            : "#9ca3af"
                                                        : iconColor,
                                                    boxShadow:
                                                        "0 4px 12px rgba(0,0,0,0.12)",
                                                    cursor: action.disabled
                                                        ? "not-allowed"
                                                        : "pointer",
                                                }}
                                            >
                                                {action.icon}
                                            </motion.button>

                                            {action.key === "delete" && (
                                                <AnimatePresence>
                                                    {tooltipVisible && (
                                                        <motion.div
                                                            initial={{
                                                                opacity: 0,
                                                                scale: 0.95,
                                                            }}
                                                            animate={{
                                                                opacity: 1,
                                                                scale: 1,
                                                            }}
                                                            exit={{
                                                                opacity: 0,
                                                                scale: 0.95,
                                                            }}
                                                            className="absolute left-1/2 top-0 z-50 mt-[-72px] whitespace-nowrap"
                                                            style={{
                                                                marginLeft: "-90px",
                                                            }}
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
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
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
