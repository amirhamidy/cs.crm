"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
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
    MoreVertical,
    AlertCircle,
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

const SWEEP_COLORS: Record<string, string> = {
    delete: "#ef4444",
    edit: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
    scores: "#eab308",
    call: "#22c55e",
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
    title,
    onEnter,
    onLeave,
    onClick,
    spring,
    href,
}: {
    actionKey: string;
    icon: React.ReactNode;
    offset: { x: number; y: number };
    delay: number;
    disabled: boolean;
    isDark: boolean;
    iconBg: string;
    iconBorder: string;
    iconColor: string;
    title: string;
    onEnter: () => void;
    onLeave: () => void;
    onClick: (e: React.MouseEvent) => void;
    spring: object;
    href?: string;
}) {
    const spanRef = useRef<HTMLSpanElement>(null);
    const iconWrapRef = useRef<HTMLSpanElement>(null);
    const animatingRef = useRef(false);

    const runSweep = useCallback(() => {
        if (disabled || animatingRef.current) return;

        const bg = spanRef.current;
        const iconEl = iconWrapRef.current;

        if (!bg || !iconEl) return;

        animatingRef.current = true;

        bg.style.transformOrigin = "0% 50%";

        animate(
            bg,
            { scaleX: [0, 1] },
            {
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1],
            }
        );

        setTimeout(() => {
            animate(
                iconEl,
                { color: "#ffffff" },
                {
                    duration: 0.08,
                    ease: "easeIn",
                }
            );
        }, 300);

        setTimeout(() => {
            bg.style.transformOrigin = "100% 50%";

            animate(
                bg,
                { scaleX: [1, 0] },
                {
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1],
                }
            );

            animate(
                iconEl,
                {
                    color: disabled
                        ? isDark
                            ? "#64748b"
                            : "#9ca3af"
                        : iconColor,
                },
                {
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1],
                }
            );
        }, 400);

        setTimeout(() => {
            animatingRef.current = false;
        }, 820);
    }, [disabled, isDark, iconColor]);

    const content = (
        <>
            <span
                ref={spanRef}
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                    background: SWEEP_COLORS[actionKey],
                    transform: "scaleX(0)",
                    transformOrigin: "0% 50%",
                }}
            />

            <span
                ref={iconWrapRef}
                className="relative z-10"
                style={{
                    color: disabled
                        ? isDark
                            ? "#64748b"
                            : "#9ca3af"
                        : iconColor,
                }}
            >
                {icon}
            </span>
        </>
    );

    const commonProps = {
        initial: { x: 0, y: 0, scale: 0, opacity: 0 },
        animate: { x: offset.x, y: offset.y, scale: 1, opacity: 1 },
        exit: { x: 0, y: 0, scale: 0, opacity: 0 },
        transition: { ...spring, delay },
        whileTap: disabled ? {} : { scale: 0.96 },
        onMouseEnter: () => {
            runSweep();
            onEnter();
        },
        onMouseLeave: onLeave,
        onClick,
        title,
        className:
            "relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full",
        style: {
            backgroundColor: iconBg,
            border: `1.5px solid ${iconBorder}`,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.45 : 1,
        },
    };

    if (href) {
        return (
            <motion.a
                {...commonProps}
                href={disabled ? undefined : href}
                aria-disabled={disabled}
            >
                {content}
            </motion.a>
        );
    }

    return (
        <motion.button type="button" {...commonProps}>
            {content}
        </motion.button>
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
    const [showMobileSheet, setShowMobileSheet] = useState(false);
    const [tooltipVisible, setTooltipVisible] = useState(false);

    const [scoresPreview, setScoresPreview] = useState<{
        count: number;
        average: number;
        reason: string;
    } | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const previewLoaded = useRef(false);

    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { resolveName } = useEmployeeDirectory();

    const creatorName = resolveName(
        customer.created_by_username,
        customer.created_by_username
    );

    const phoneHref = `tel:${String(customer.phone_number).replace(
        /[^\d+]/g,
        ""
    )}`;

    useEffect(() => {
        let cancelled = false;

        const fetchScores = async () => {
            setPreviewLoading(true);

            try {
                const { data } = await axiosInstance.get<ScoreItem[]>(
                    `/customers/api/v1/customers/${customer.id}/scores/`
                );

                if (cancelled) return;

                const list = Array.isArray(data) ? data : [];

                setScoresPreview({
                    count: list.length,
                    average: list.length
                        ? list.reduce((sum, s) => sum + Number(s.score || 0), 0) /
                          list.length
                        : 0,
                    reason: list[0]?.reason ?? "",
                });
            } catch {
                if (!cancelled) {
                    setScoresPreview(null);
                }
            } finally {
                if (!cancelled) setPreviewLoading(false);
            }
        };

        if (showPreview && !previewLoaded.current) {
            previewLoaded.current = true;
            fetchScores();
        }

        return () => {
            cancelled = true;
        };
    }, [showPreview, customer.id]);

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
        if (typeof window !== "undefined" && window.innerWidth < 768) return;

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

    const spring = {
        type: "spring" as const,
        stiffness: 420,
        damping: 26,
    };

    const iconBg = isDark ? "#1e1e1e" : "#e2e2e2";

    const iconBorder = isDark
        ? "rgba(255,255,255,0.13)"
        : "rgba(0,0,0,0.14)";

    const iconColor = isDark ? "#e5e7eb" : "#374151";

    const actions = [
        {
            key: "delete",
            icon: <Trash2 size={16} />,
            offset: { x: 36, y: -22 },
            delay: 0,
            disabled: hasActiveCase,
            onClick: (e: React.MouseEvent) => {
                e.stopPropagation();

                if (!hasActiveCase) {
                    setShowConfirm(true);
                }
            },
            title: "حذف",
        },
        {
            key: "edit",
            icon: <SquarePen size={16} />,
            offset: { x: -36, y: -22 },
            delay: 0.08,
            disabled: false,
            onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
                setShowEdit(true);
            },
            title: "ویرایش",
        },
        {
            key: "scores",
            icon: <MessageCircle size={16} />,
            offset: { x: 36, y: 30 },
            delay: 0.16,
            disabled: false,
            onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
                setShowScores(true);
            },
            title: "نظرات",
        },
        {
            key: "call",
            icon: <Phone size={16} />,
            offset: { x: -36, y: 30 },
            delay: 0.24,
            disabled: false,
            href: phoneHref,
            onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
            },
            title: "تماس",
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
                    style={{
                        borderRadius: "1rem",
                        overflow: "visible",
                    }}
                >
                    <defs>
                        <linearGradient
                            id={`cust-grad-${customer.id}`}
                            x1="100%"
                            y1="100%"
                            x2="0%"
                            y2="0%"
                        >
                            <stop
                                offset="0%"
                                stopColor="#6366f1"
                                stopOpacity="0.5"
                            />
                            <stop
                                offset="100%"
                                stopColor="#8b5cf6"
                                stopOpacity="0.5"
                            />
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
                        initial={{
                            pathLength: 0,
                            opacity: 0,
                        }}
                        animate={
                            hovered
                                ? {
                                    pathLength: 1,
                                    opacity: 1,
                                }
                                : {
                                    pathLength: 0,
                                    opacity: 0,
                                }
                        }
                        transition={{
                            duration: 0.6,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                    />
                </svg>

                <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5">
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
                                            color: isDark
                                                ? "#cbd5e1"
                                                : "#475569",
                                            border: "1px solid rgba(148,163,184,0.25)",
                                        }
                                        : {
                                            background:
                                                "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(6,182,212,0.18))",
                                            color: isDark
                                                ? "#60a5fa"
                                                : "#0369a1",
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
                            transition={{
                                duration: 0.18,
                                ease: "easeOut",
                            }}
                            className="absolute inset-0 z-30 hidden items-center justify-center rounded-2xl md:flex"
                            style={{
                                background: isDark
                                    ? "rgba(10,12,20,0.55)"
                                    : "rgba(255,255,255,0.55)",
                                backdropFilter: "blur(6px)",
                                WebkitBackdropFilter: "blur(6px)",
                            }}
                        >
                            <div className="relative h-24 w-40">
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
                                            <SweepButton
                                                actionKey={action.key}
                                                icon={action.icon}
                                                offset={action.offset}
                                                delay={action.delay}
                                                disabled={action.disabled}
                                                isDark={isDark}
                                                iconBg={iconBg}
                                                iconBorder={iconBorder}
                                                iconColor={iconColor}
                                                title={action.title}
                                                href={action.href}
                                                onEnter={() => {
                                                    if (action.key === "scores") {
                                                        setShowPreview(true);
                                                    }

                                                    if (
                                                        action.key === "delete" &&
                                                        hasActiveCase
                                                    ) {
                                                        setTooltipVisible(true);
                                                    }
                                                }}
                                                onLeave={() => {
                                                    if (action.key === "scores") {
                                                        setShowPreview(false);
                                                    }

                                                    setTooltipVisible(false);
                                                }}
                                                onClick={action.onClick}
                                                spring={spring}
                                            />

                                            {action.key === "scores" && (
                                                <AnimatePresence>
                                                    {showPreview && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95, y: 6 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                            dir="rtl"
                                                            className="pointer-events-none absolute left-1/2 top-0 z-50 flex w-44 -translate-x-1/2 flex-col gap-1.5 rounded-2xl px-3 py-2 shadow-xl"
                                                            style={{
                                                                marginTop: "-64px",
                                                                background: isDark ? "#0f172a" : "#1e293b",
                                                                border: "1px solid rgba(255,255,255,0.08)",
                                                            }}
                                                        >
                                                            {previewLoading ? (
                                                                <span className="flex items-center gap-1.5 text-[11px] text-slate-300">
                                                                    <Loader2 size={11} className="animate-spin" />
                                                                    در حال دریافت...
                                                                </span>
                                                            ) : scoresPreview && scoresPreview.count > 0 ? (
                                                                <>
                                                                    <span className="flex items-center gap-1 text-[12px] font-black text-amber-400">
                                                                        <Star size={12} fill="currentColor" />
                                                                        {scoresPreview.average.toFixed(1)}
                                                                        <span className="text-[10px] font-medium text-slate-400">
                                                                            از ۵ • {scoresPreview.count} نظر
                                                                        </span>
                                                                    </span>
                                                                    {scoresPreview.reason && (
                                                                        <span className="line-clamp-2 text-[10.5px] leading-relaxed text-slate-400">
                                                                            {scoresPreview.reason}
                                                                        </span>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <span className="text-[11px] text-slate-400">
                                                                    هنوز نظری ثبت نشده
                                                                </span>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            )}

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
                                                                    این مشتری
                                                                    پرونده دارد
                                                                </span>

                                                                <span className="text-[10px] text-slate-400">
                                                                    برای حذف آن
                                                                    باید ابتدا
                                                                    پرونده‌هایش
                                                                    را حذف کنید
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
                            transition={{
                                type: "spring",
                                damping: 28,
                                stiffness: 320,
                            }}
                            className="relative z-10 w-full max-w-lg rounded-t-[28px] p-5 shadow-2xl"
                            style={{
                                background: isDark ? "#12141c" : "#ffffff",
                                borderTop: `1px solid ${isDark
                                        ? "rgba(255,255,255,0.1)"
                                        : "rgba(0,0,0,0.08)"
                                    }`,
                            }}
                        >
                            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />

                            <div
                                className="mb-4 flex items-center justify-between border-b pb-3"
                                style={{ borderColor: dividerColor }}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Avatar
                                        name={customer.full_name}
                                        id={customer.id}
                                    />

                                    <div>
                                        <p className="text-sm font-extrabold text-gray-800 dark:text-gray-100">
                                            {customer.full_name}
                                        </p>

                                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                                            #{customer.id}{" "}
                                            {customer.company_name
                                                ? `• ${customer.company_name}`
                                                : ""}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <a
                                    href={phoneHref}
                                    onClick={() => setShowMobileSheet(false)}
                                    className="flex w-full items-center gap-3 rounded-2xl p-3.5 text-[13.5px] font-bold text-emerald-600 transition-all active:scale-[0.98] dark:text-emerald-400"
                                    style={{
                                        background: isDark
                                            ? "rgba(34,197,94,0.12)"
                                            : "rgba(34,197,94,0.08)",
                                        border: `1px solid ${isDark
                                                ? "rgba(34,197,94,0.2)"
                                                : "rgba(34,197,94,0.14)"
                                            }`,
                                    }}
                                >
                                    <Phone size={18} />
                                    <span>تماس با مشتری</span>
                                </a>

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
                                        border: `1px solid ${isDark
                                                ? "rgba(59,130,246,0.2)"
                                                : "rgba(59,130,246,0.14)"
                                            }`,
                                    }}
                                >
                                    <SquarePen size={18} />
                                    <span>ویرایش اطلاعات</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowMobileSheet(false);
                                        setShowScores(true);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-2xl p-3.5 text-[13.5px] font-bold text-amber-600 transition-all active:scale-[0.98] dark:text-amber-400"
                                    style={{
                                        background: isDark
                                            ? "rgba(245,158,11,0.12)"
                                            : "rgba(245,158,11,0.08)",
                                        border: `1px solid ${isDark
                                                ? "rgba(245,158,11,0.2)"
                                                : "rgba(245,158,11,0.14)"
                                            }`,
                                    }}
                                >
                                    <MessageCircle size={18} />
                                    <span>امتیازها و نظرات</span>
                                </button>

                                <div className="flex flex-col gap-1.5 pt-1">
                                    <button
                                        type="button"
                                        disabled={hasActiveCase}
                                        onClick={() => {
                                            if (hasActiveCase) return;

                                            setShowMobileSheet(false);
                                            setShowConfirm(true);
                                        }}
                                        className={`flex w-full items-center gap-3 rounded-2xl p-3.5 text-[13.5px] font-bold transition-all ${hasActiveCase
                                                ? "cursor-not-allowed text-gray-400 opacity-50"
                                                : "text-rose-600 active:scale-[0.98] dark:text-rose-400"
                                            }`}
                                        style={{
                                            background: hasActiveCase
                                                ? isDark
                                                    ? "rgba(255,255,255,0.03)"
                                                    : "rgba(0,0,0,0.03)"
                                                : isDark
                                                    ? "rgba(239,68,68,0.12)"
                                                    : "rgba(239,68,68,0.08)",
                                            border: `1px solid ${hasActiveCase
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
                                        <span>حذف مشتری</span>
                                    </button>

                                    {hasActiveCase && (
                                        <div className="flex items-center gap-1.5 px-2 text-[11.5px] text-rose-500 dark:text-rose-400">
                                            <AlertCircle
                                                size={14}
                                                className="shrink-0"
                                            />

                                            <span>
                                                این مشتری پرونده فعال دارد؛
                                                ابتدا پرونده‌هایش را حذف کنید.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
