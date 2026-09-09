"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    BellRing,
    Boxes,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    LayoutGrid,
    Loader2,
    PackagePlus,
    PackageSearch,
    ReceiptText,
    ShieldCheck,
    ShoppingBag,
    Plus,
} from "lucide-react";
import { useTheme } from "next-themes";
import WarehouseOverview from "@/components/admin/warehouse/Warehouseoverview";
import OrderTaskCard from "@/components/admin/warehouse/Ordertaskcard";
import CreateOrderTaskModal from "@/components/user/warehouse/CreateOrderTaskModal";
import WarehouseEmployeeTransactionCard from "@/components/user/warehouse/WarehouseEmployeeTransactionCard";
import WarehouseEmployeeProductCard from "@/components/user/warehouse/WarehouseEmployeeProductCard";
import WarehouseEmployeeProductWizardModal from "@/components/user/warehouse/WarehouseEmployeeProductWizardModal";
import WarehouseEmployeeTaskCard from "@/components/user/warehouse/WarehouseEmployeeTaskCard";
import {
    formatDate,
    formatNumber,
    getDeadlineDate,
    getOrderTaskTitle,
    getStatusLabel,
    getStatusTone,
    getQuantityFromStock,
    getStockProductName,
    getStockStatus,
    PAGE_SIZE,
    paginate,
} from "@/utils/warehouseEmployee";
import useWarehouseEmployee from "@/hooks/useWarehouseEmployee";
import type {
    ApiOrderTask,
    ApiOrderTaskDeadline,
    ApiStockInfo,
    ApiWarehouseTask,
} from "@/types/warehouse";
import WarehouseEmployeeOrderTaskCard from "@/components/user/warehouse/WarehouseEmployeeOrderTaskCard";

type Tab =
    | "overview"
    | "products"
    | "tasks"
    | "stock"
    | "transactions"
    | "orders"
    | "deadlines";

const TABS = [
    ["overview", "نمای کلی", LayoutGrid],
    ["products", "محصولات", ShoppingBag],
    ["tasks", "وظایف انبار", ClipboardList],
    ["stock", "موجودی انبار", Boxes],
    ["transactions", "تراکنش‌ها", ReceiptText],
    ["orders", "درخواست‌های داخلی", PackageSearch],
    ["deadlines", "مهلت‌ها", BellRing],
] as const;

const cardBg = (dark: boolean) => (dark ? "#111c31" : "#fff");

const cardBorder = (dark: boolean) =>
    dark ? "rgba(255,255,255,.07)" : "rgba(15,23,42,.07)";

const muted = (dark: boolean) =>
    dark ? "#64748b" : "#94a3b8";

function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    isDark,
}: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isDark: boolean;
}) {
    if (totalPages <= 1) return null;

    const pages = Array.from(
        {
            length: Math.min(5, totalPages),
        },
        (_, i) =>
            totalPages <= 5
                ? i + 1
                : currentPage <= 3
                    ? i + 1
                    : currentPage >= totalPages - 2
                        ? totalPages - 4 + i
                        : currentPage - 2 + i
    );

    const buttonStyle = {
        background: isDark
            ? "rgba(255,255,255,.04)"
            : "rgba(15,23,42,.04)",
        color: isDark ? "#94a3b8" : "#475569",
    };

    return (
        <div className="mt-5 flex items-center justify-center gap-1.5">
            <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl disabled:opacity-40"
                style={buttonStyle}
            >
                <ChevronRight size={15} />
            </button>

            {pages.map((page) => {
                const active = page === currentPage;

                return (
                    <button
                        key={page}
                        type="button"
                        onClick={() => onPageChange(page)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-[12px] font-extrabold"
                        style={{
                            background: active
                                ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                                : buttonStyle.background,
                            color: active
                                ? "#fff"
                                : buttonStyle.color,
                            boxShadow: active
                                ? "0 4px 12px rgba(99,102,241,.25)"
                                : "none",
                        }}
                    >
                        {page}
                    </button>
                );
            })}

            <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl disabled:opacity-40"
                style={buttonStyle}
            >
                <ChevronLeft size={15} />
            </button>
        </div>
    );
}

function StatusBadge({
    status,
    isDark,
}: {
    status: unknown;
    isDark: boolean;
}) {
    const tone = getStatusTone(status);

    const styles = {
        success: [
            "rgba(34,197,94,.1)",
            "#22c55e",
        ],
        warning: [
            "rgba(245,158,11,.1)",
            "#f59e0b",
        ],
        danger: [
            "rgba(239,68,68,.1)",
            "#ef4444",
        ],
        neutral: [
            isDark
                ? "rgba(148,163,184,.12)"
                : "rgba(15,23,42,.06)",
            isDark ? "#94a3b8" : "#64748b",
        ],
    } as const;

    const [background, color] = styles[tone];

    return (
        <span
            className="inline-flex rounded-full px-2.5 py-1 text-[10.5px] font-extrabold"
            style={{
                background,
                color,
            }}
        >
            {getStatusLabel(status)}
        </span>
    );
}

function StockCard({
    stock,
    index,
    isDark,
}: {
    stock: ApiStockInfo;
    index: number;
    isDark: boolean;
}) {
    const current = Number(
        stock.current_quantity ??
        getQuantityFromStock(stock) ??
        0
    );

    const maximum = Number(
        stock.maximum_stock ?? 0
    );

    const minimum = Number(
        stock.minimum_stock ?? 0
    );

    const initial = Number(
        stock.initial_quantity ?? 0
    );

    const percentage =
        maximum > 0
            ? Math.min(
                100,
                Math.max(
                    0,
                    (current / maximum) * 100
                )
            )
            : 0;

    const status = getStockStatus(stock);
    const mutedColor = muted(isDark);

    const statusBackground =
        status.tone === "danger"
            ? "rgba(239,68,68,.1)"
            : status.tone === "warning"
                ? "rgba(245,158,11,.1)"
                : "rgba(34,197,94,.1)";

    const statusColor =
        status.tone === "danger"
            ? "#ef4444"
            : status.tone === "warning"
                ? "#f59e0b"
                : "#22c55e";

    const progressColor =
        status.tone === "danger"
            ? "#ef4444"
            : status.tone === "warning"
                ? "#f59e0b"
                : "linear-gradient(90deg,#6366f1,#8b5cf6)";

    return (
        <motion.div
            initial={{
                opacity: 0,
                y: 10,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            transition={{
                duration: 0.2,
                delay: index * 0.035,
            }}
            className="relative overflow-hidden rounded-2xl border p-4"
            style={{
                background: cardBg(isDark),
                borderColor: cardBorder(isDark),
                boxShadow: isDark
                    ? "0 10px 30px rgba(0,0,0,.12)"
                    : "0 10px 30px rgba(15,23,42,.04)",
            }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p
                        className="truncate text-[13px] font-extrabold"
                        style={{
                            color: isDark
                                ? "#f8fafc"
                                : "#0f172a",
                        }}
                    >
                        {getStockProductName(stock)}
                    </p>

                    <p
                        className="mt-1 text-[10.5px]"
                        style={{
                            color: mutedColor,
                        }}
                    >
                        موجودی #{stock.id}
                        {stock.unit_label
                            ? ` · ${stock.unit_label}`
                            : ""}
                    </p>
                </div>

                <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold"
                    style={{
                        background: statusBackground,
                        color: statusColor,
                    }}
                >
                    {status.label}
                </span>
            </div>

            <div className="mt-5 flex items-end justify-between gap-3">
                <div>
                    <p
                        className="text-[10.5px]"
                        style={{
                            color: mutedColor,
                        }}
                    >
                        موجودی فعلی
                    </p>

                    <p
                        className="mt-1 text-[20px] font-black"
                        style={{
                            color: isDark
                                ? "#fff"
                                : "#0f172a",
                        }}
                    >
                        {formatNumber(current)}
                    </p>
                </div>

                <div className="text-left">
                    <p
                        className="text-[10.5px]"
                        style={{
                            color: mutedColor,
                        }}
                    >
                        ظرفیت
                    </p>

                    <p
                        className="mt-1 text-[12px] font-bold"
                        style={{
                            color: isDark
                                ? "#cbd5e1"
                                : "#475569",
                        }}
                    >
                        {maximum > 0
                            ? formatNumber(maximum)
                            : "—"}
                    </p>
                </div>
            </div>

            <div
                className="mt-4 h-1.5 overflow-hidden rounded-full"
                style={{
                    background: isDark
                        ? "rgba(255,255,255,.06)"
                        : "rgba(15,23,42,.06)",
                }}
            >
                <motion.div
                    initial={{
                        width: 0,
                    }}
                    animate={{
                        width: `${percentage}%`,
                    }}
                    transition={{
                        duration: 0.6,
                        delay: index * 0.035,
                    }}
                    className="h-full rounded-full"
                    style={{
                        background: progressColor,
                    }}
                />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
                <div>
                    <p
                        className="text-[10px]"
                        style={{
                            color: mutedColor,
                        }}
                    >
                        حداقل
                    </p>

                    <p
                        className="mt-1 text-[10.5px] font-bold"
                        style={{
                            color: isDark
                                ? "#cbd5e1"
                                : "#475569",
                        }}
                    >
                        {formatNumber(minimum)}
                    </p>
                </div>

                <div className="text-center">
                    <p
                        className="text-[10px]"
                        style={{
                            color: mutedColor,
                        }}
                    >
                        اولیه
                    </p>

                    <p
                        className="mt-1 text-[10.5px] font-bold"
                        style={{
                            color: isDark
                                ? "#cbd5e1"
                                : "#475569",
                        }}
                    >
                        {formatNumber(initial)}
                    </p>
                </div>

                <div className="text-left">
                    <p
                        className="text-[10px]"
                        style={{
                            color: mutedColor,
                        }}
                    >
                        واحد
                    </p>

                    <p
                        className="mt-1 truncate text-[10.5px] font-bold"
                        style={{
                            color: isDark
                                ? "#cbd5e1"
                                : "#475569",
                        }}
                    >
                        {stock.unit_label || "—"}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

function DeadlineCard({
    deadline,
    orderTitle,
    index,
    isDark,
}: {
    deadline: ApiOrderTaskDeadline;
    orderTitle: string;
    index: number;
    isDark: boolean;
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: 8,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            transition={{
                duration: 0.2,
                delay: index * 0.035,
            }}
            className="rounded-2xl border p-4"
            style={{
                background: cardBg(isDark),
                borderColor: cardBorder(isDark),
                boxShadow: isDark
                    ? "0 10px 30px rgba(0,0,0,.12)"
                    : "0 10px 30px rgba(15,23,42,.04)",
            }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p
                        className="truncate text-[13px] font-extrabold"
                        style={{
                            color: isDark
                                ? "#f8fafc"
                                : "#0f172a",
                        }}
                    >
                        {orderTitle}
                    </p>

                    <p
                        className="mt-1 text-[10.5px]"
                        style={{
                            color: muted(isDark),
                        }}
                    >
                        سفارش داخلی #
                        {deadline.order_task ?? "—"}
                    </p>
                </div>

                <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                        background: "rgba(99,102,241,.1)",
                        color: "#6366f1",
                    }}
                >
                    <BellRing size={16} />
                </div>
            </div>

            <div
                className="mt-4 rounded-xl p-3"
                style={{
                    background: isDark
                        ? "rgba(255,255,255,.035)"
                        : "rgba(15,23,42,.035)",
                }}
            >
                <p
                    className="text-[10px]"
                    style={{
                        color: muted(isDark),
                    }}
                >
                    مهلت انجام
                </p>

                <p
                    className="mt-1 text-[12px] font-extrabold"
                    style={{
                        color: isDark
                            ? "#e2e8f0"
                            : "#334155",
                    }}
                >
                    {formatDate(
                        getDeadlineDate(deadline)
                    )}
                </p>
            </div>
        </motion.div>
    );
}

export default function WarehouseEmployeePage() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const {
        employeeLoading,
        myStaff,
        warehouseAccess,
        products,
        categories,
        stockInfos,
        transactions,
        myTasks,
        pendingTasks,
        activeTasks,
        completedTasks,
        criticalStock,
        orderTasks,
        orderTaskDeadlines,
        loading,
        refreshing,
        error,
        refresh,
    } = useWarehouseEmployee();

    const [tab, setTab] =
        useState<Tab>("overview");

    const [currentPage, setCurrentPage] =
        useState(1);

    const [taskItems, setTaskItems] =
        useState<ApiWarehouseTask[]>(myTasks);

    const [productWizardOpen, setProductWizardOpen] =
        useState(false);

    const [createOrderTaskOpen, setCreateOrderTaskOpen] =
        useState(false);

    useEffect(() => {
        setTaskItems(myTasks);
    }, [myTasks]);

    useEffect(() => {
        setCurrentPage(1);
    }, [tab]);

    const stockByProduct = useMemo(
        () =>
            new Map(
                stockInfos.map((item) => [
                    item.product,
                    item,
                ])
            ),
        [stockInfos]
    );

    const deadlineByOrderTask = useMemo(
        () =>
            new Map(
                orderTaskDeadlines.map((item) => [
                    item.order_task,
                    item,
                ])
            ),
        [orderTaskDeadlines]
    );

    const pendingOrderTasks = useMemo(
        () =>
            orderTasks.filter(
                (task) =>
                    String(
                        task.status ?? ""
                    ).toLowerCase() !==
                    "completed"
            ),
        [orderTasks]
    );

    const qualityTasks = useMemo(
        () =>
            taskItems.filter(
                (task) =>
                    task.quality_control_id !== null
            ),
        [taskItems]
    );

    const pendingQualityTasks = useMemo(
        () =>
            qualityTasks.filter(
                (task) => task.status === "pending"
            ),
        [qualityTasks]
    );

    const paginatedProducts = useMemo(
        () =>
            paginate(
                products,
                currentPage,
                PAGE_SIZE
            ),
        [products, currentPage]
    );

    const paginatedTasks = useMemo(
        () =>
            paginate(
                taskItems,
                currentPage,
                PAGE_SIZE
            ),
        [taskItems, currentPage]
    );

    const paginatedStock = useMemo(
        () =>
            paginate(
                stockInfos,
                currentPage,
                PAGE_SIZE
            ),
        [stockInfos, currentPage]
    );

    const paginatedTransactions = useMemo(
        () =>
            paginate(
                transactions,
                currentPage,
                PAGE_SIZE
            ),
        [transactions, currentPage]
    );

    const paginatedOrders = useMemo(
        () =>
            paginate(
                orderTasks,
                currentPage,
                PAGE_SIZE
            ),
        [orderTasks, currentPage]
    );

    const paginatedDeadlines = useMemo(
        () =>
            paginate(
                orderTaskDeadlines,
                currentPage,
                PAGE_SIZE
            ),
        [orderTaskDeadlines, currentPage]
    );

    const handleTaskUpdated = useCallback(
        (updatedTask: ApiWarehouseTask) => {
            setTaskItems((current) =>
                current.map((task) =>
                    task.id === updatedTask.id
                        ? updatedTask
                        : task
                )
            );
        },
        []
    );

    const handleProductCreated =
        useCallback(async () => {
            setProductWizardOpen(false);
            setTab("products");
            setCurrentPage(1);
            await refresh();
        }, [refresh]);

    const handleOrderTaskCreated =
        useCallback(
            async (_orderTask: ApiOrderTask) => {
                setCreateOrderTaskOpen(false);
                setTab("orders");
                setCurrentPage(1);
                await refresh();
            },
            [refresh]
        );

    const renderEmpty = useCallback(
        (text: string) => (
            <p
                className="col-span-full py-16 text-center text-[12.5px]"
                style={{
                    color: muted(isDark),
                }}
            >
                {text}
            </p>
        ),
        [isDark]
    );

    if (employeeLoading || loading) {
        return (
            <div
                dir="rtl"
                className="flex min-h-screen items-center justify-center"
                style={{
                    background: isDark
                        ? "#0f172a"
                        : "#f8fafc",
                }}
            >
                <Loader2
                    size={24}
                    className="animate-spin"
                    style={{
                        color: "#6366f1",
                    }}
                />
            </div>
        );
    }

    if (!warehouseAccess) {
        return (
            <div
                dir="rtl"
                className="flex min-h-screen items-center justify-center p-6"
                style={{
                    background: isDark
                        ? "#0f172a"
                        : "#f8fafc",
                }}
            >
                <div
                    className="w-full max-w-md rounded-3xl border p-8 text-center"
                    style={{
                        background: cardBg(isDark),
                        borderColor: cardBorder(isDark),
                    }}
                >
                    <Boxes
                        className="mx-auto"
                        size={30}
                        style={{
                            color: "#6366f1",
                        }}
                    />

                    <h2
                        className="mt-5 text-[17px] font-extrabold"
                        style={{
                            color: isDark
                                ? "#fff"
                                : "#0f172a",
                        }}
                    >
                        دسترسی به انبار ندارید
                    </h2>

                    <p
                        className="mt-2 text-[12px] leading-7"
                        style={{
                            color: muted(isDark),
                        }}
                    >
                        حساب کاربری شما در حال حاضر
                        به عنوان کارمند فعال انبار
                        ثبت نشده است.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            dir="rtl"
            className="flex min-h-screen flex-col gap-6 p-6"
            style={{
                background: isDark
                    ? "#0f172a"
                    : "#f8fafc",
            }}
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1
                        className="text-[18px] font-extrabold"
                        style={{
                            color: isDark
                                ? "#fff"
                                : "#111827",
                        }}
                    >
                        انبار
                    </h1>

                    <p
                        className="mt-1 text-[12px]"
                        style={{
                            color: muted(isDark),
                        }}
                    >
                        مدیریت وظایف، محصولات،
                        موجودی و فرآیندهای ورود و
                        خروج کالا
                    </p>
                </div>

                <motion.button
                    type="button"
                    whileTap={{
                        scale: 0.96,
                    }}
                    onClick={refresh}
                    disabled={refreshing}
                    className="flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[12px] font-bold text-white disabled:opacity-60"
                    style={{
                        background: "#6366f1",
                    }}
                >
                    <Loader2
                        size={15}
                        className={
                            refreshing
                                ? "animate-spin"
                                : ""
                        }
                    />
                    بروزرسانی
                </motion.button>
            </div>

            <div
                className="flex flex-wrap gap-2 rounded-2xl p-1.5"
                style={{
                    background: isDark
                        ? "rgba(255,255,255,.04)"
                        : "rgba(15,23,42,.04)",
                }}
            >
                {TABS.map(
                    ([id, label, Icon]) => {
                        const active = tab === id;

                        const count =
                            id === "products"
                                ? products.length
                                : id === "tasks"
                                    ? pendingTasks.length
                                    : id === "orders"
                                        ? pendingOrderTasks.length
                                        : id === "deadlines"
                                            ? orderTaskDeadlines.length
                                            : 0;

                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() =>
                                    setTab(id)
                                }
                                className="relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-extrabold"
                                style={{
                                    background: active
                                        ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                                        : "transparent",
                                    color: active
                                        ? "#fff"
                                        : isDark
                                            ? "#94a3b8"
                                            : "#475569",
                                    boxShadow: active
                                        ? "0 4px 12px rgba(99,102,241,.25)"
                                        : "none",
                                }}
                            >
                                <Icon size={14} />
                                {label}

                                {count > 0 && (
                                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] text-white">
                                        {count}
                                    </span>
                                )}

                                {id === "tasks" &&
                                    pendingQualityTasks.length >
                                    0 && (
                                        <span
                                            className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] text-white"
                                            style={{
                                                background:
                                                    "#8b5cf6",
                                            }}
                                        >
                                            {
                                                pendingQualityTasks.length
                                            }
                                        </span>
                                    )}
                            </button>
                        );
                    }
                )}
            </div>

            {error && (
                <div
                    className="rounded-2xl border px-4 py-3 text-[12px] font-bold"
                    style={{
                        background: isDark
                            ? "rgba(239,68,68,.08)"
                            : "rgba(239,68,68,.05)",
                        borderColor:
                            "rgba(239,68,68,.15)",
                        color: "#ef4444",
                    }}
                >
                    {error}
                </div>
            )}

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${tab}-${currentPage}`}
                    initial={{
                        opacity: 0,
                        y: 8,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    exit={{
                        opacity: 0,
                        y: -8,
                    }}
                    transition={{
                        duration: 0.2,
                    }}
                >
                    {tab === "overview" && (
                        <div className="space-y-6">
                            <WarehouseOverview
                                products={products}
                                stockInfos={stockInfos}
                                transactions={transactions}
                                tasks={taskItems}
                                orderTasks={orderTasks}
                            />

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {[
                                    [
                                        "وظایف در انتظار",
                                        pendingTasks.length,
                                    ],
                                    [
                                        "وظایف فعال",
                                        activeTasks.length,
                                    ],
                                    [
                                        "وظایف تکمیل شده",
                                        completedTasks.length,
                                    ],
                                    [
                                        "موجودی‌های بحرانی",
                                        criticalStock.length,
                                    ],
                                ].map(
                                    ([label, value]) => (
                                        <div
                                            key={String(
                                                label
                                            )}
                                            className="rounded-2xl border p-4"
                                            style={{
                                                background:
                                                    cardBg(
                                                        isDark
                                                    ),
                                                borderColor:
                                                    cardBorder(
                                                        isDark
                                                    ),
                                            }}
                                        >
                                            <p
                                                className="text-[10.5px]"
                                                style={{
                                                    color: muted(
                                                        isDark
                                                    ),
                                                }}
                                            >
                                                {label}
                                            </p>

                                            <p
                                                className="mt-2 text-[22px] font-black"
                                                style={{
                                                    color:
                                                        label ===
                                                            "موجودی‌های بحرانی" &&
                                                            Number(
                                                                value
                                                            ) >
                                                            0
                                                            ? "#ef4444"
                                                            : isDark
                                                                ? "#fff"
                                                                : "#0f172a",
                                                }}
                                            >
                                                {formatNumber(
                                                    Number(
                                                        value
                                                    )
                                                )}
                                            </p>
                                        </div>
                                    )
                                )}
                            </div>

                            {pendingQualityTasks.length >
                                0 && (
                                    <div
                                        className="rounded-2xl border p-4"
                                        style={{
                                            background:
                                                isDark
                                                    ? "rgba(139,92,246,.06)"
                                                    : "rgba(139,92,246,.04)",
                                            borderColor:
                                                "rgba(139,92,246,.12)",
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="flex h-10 w-10 items-center justify-center rounded-xl"
                                                style={{
                                                    background:
                                                        "rgba(139,92,246,.1)",
                                                    color:
                                                        "#8b5cf6",
                                                }}
                                            >
                                                <ShieldCheck
                                                    size={18}
                                                />
                                            </div>

                                            <div>
                                                <p
                                                    className="text-[12px] font-extrabold"
                                                    style={{
                                                        color: isDark
                                                            ? "#fff"
                                                            : "#0f172a",
                                                    }}
                                                >
                                                    وظایف کنترل
                                                    کیفیت
                                                </p>

                                                <p
                                                    className="mt-1 text-[10.5px]"
                                                    style={{
                                                        color: muted(
                                                            isDark
                                                        ),
                                                    }}
                                                >
                                                    {
                                                        pendingQualityTasks.length
                                                    }{" "}
                                                    وظیفه کنترل
                                                    کیفیت در
                                                    انتظار انجام
                                                    است
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}

                    {tab === "products" && (
                        <div className="space-y-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2
                                        className="text-[16px] font-extrabold"
                                        style={{
                                            color: isDark
                                                ? "#fff"
                                                : "#111827",
                                        }}
                                    >
                                        محصولات انبار
                                    </h2>

                                    <p
                                        className="mt-1 text-[11.5px]"
                                        style={{
                                            color: muted(
                                                isDark
                                            ),
                                        }}
                                    >
                                        مدیریت محصولات و
                                        عملیات مربوط به
                                        موجودی
                                    </p>
                                </div>

                                <motion.button
                                    type="button"
                                    whileTap={{
                                        scale: 0.96,
                                    }}
                                    onClick={() =>
                                        setProductWizardOpen(
                                            true
                                        )
                                    }
                                    className="flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-[12px] font-extrabold text-white shadow-lg shadow-indigo-500/10"
                                    style={{
                                        background:
                                            "linear-gradient(135deg,#6366f1,#8b5cf6)",
                                    }}
                                >
                                    <PackagePlus size={16} />
                                    افزودن محصول
                                </motion.button>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {paginatedProducts.items
                                    .length
                                    ? paginatedProducts.items.map(
                                        (
                                            product,
                                            index
                                        ) => (
                                            <WarehouseEmployeeProductCard
                                                key={
                                                    product.id
                                                }
                                                product={
                                                    product
                                                }
                                                stockInfo={
                                                    stockByProduct.get(
                                                        product.id
                                                    ) ??
                                                    null
                                                }
                                                index={
                                                    index
                                                }
                                                categories={
                                                    categories
                                                }
                                                staff={
                                                    myStaff
                                                        ? [
                                                            myStaff,
                                                        ]
                                                        : []
                                                }
                                                performedById={
                                                    myStaff?.id ??
                                                    null
                                                }
                                                onUpdated={
                                                    refresh
                                                }
                                                onStockChanged={
                                                    refresh
                                                }
                                                onDeleted={
                                                    refresh
                                                }
                                            />
                                        )
                                    )
                                    : renderEmpty(
                                        "محصولی برای نمایش وجود ندارد"
                                    )}
                            </div>

                            <Pagination
                                currentPage={
                                    currentPage
                                }
                                totalPages={
                                    paginatedProducts.totalPages
                                }
                                onPageChange={
                                    setCurrentPage
                                }
                                isDark={isDark}
                            />
                        </div>
                    )}

                    {tab === "tasks" && (
                        <div className="space-y-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2
                                        className="text-[16px] font-extrabold"
                                        style={{
                                            color: isDark
                                                ? "#fff"
                                                : "#111827",
                                        }}
                                    >
                                        وظایف انبار
                                    </h2>

                                    <p
                                        className="mt-1 text-[11.5px]"
                                        style={{
                                            color: muted(
                                                isDark
                                            ),
                                        }}
                                    >
                                        وظایف دریافت کالا و
                                        درخواست‌های کنترل
                                        کیفیت
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {qualityTasks.length >
                                        0 && (
                                            <div
                                                className="flex items-center gap-2 rounded-2xl px-3 py-2"
                                                style={{
                                                    background:
                                                        isDark
                                                            ? "rgba(139,92,246,.08)"
                                                            : "rgba(139,92,246,.06)",
                                                    color:
                                                        "#8b5cf6",
                                                }}
                                            >
                                                <ShieldCheck
                                                    size={15}
                                                />

                                                <span className="text-[10.5px] font-extrabold">
                                                    {
                                                        qualityTasks.length
                                                    }{" "}
                                                    وظیفه کنترل
                                                    کیفیت
                                                </span>
                                            </div>
                                        )}

                                    <motion.button
                                        type="button"
                                        whileTap={{
                                            scale: 0.96,
                                        }}
                                        onClick={() =>
                                            setCreateOrderTaskOpen(
                                                true
                                            )
                                        }
                                        className="flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-[12px] font-extrabold text-white shadow-lg shadow-indigo-500/10"
                                        style={{
                                            background:
                                                "linear-gradient(135deg,#6366f1,#8b5cf6)",
                                        }}
                                    >
                                        <Plus size={15} />
                                        ثبت وظیفه برای انبار
                                    </motion.button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {paginatedTasks.items
                                    .length
                                    ? paginatedTasks.items.map(
                                        (
                                            task,
                                            index
                                        ) => (
                                            <WarehouseEmployeeTaskCard
                                                key={
                                                    task.id
                                                }
                                                task={
                                                    task
                                                }
                                                index={
                                                    index
                                                }
                                                employeeId={
                                                    myStaff?.employee_id ??
                                                    myStaff?.employee ??
                                                    null
                                                }
                                                onUpdated={
                                                    handleTaskUpdated
                                                }
                                            />
                                        )
                                    )
                                    : renderEmpty(
                                        "وظیفه‌ای برای شما وجود ندارد"
                                    )}
                            </div>

                            <Pagination
                                currentPage={
                                    currentPage
                                }
                                totalPages={
                                    paginatedTasks.totalPages
                                }
                                onPageChange={
                                    setCurrentPage
                                }
                                isDark={isDark}
                            />
                        </div>
                    )}

                    {tab === "stock" && (
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {paginatedStock.items
                                    .length
                                    ? paginatedStock.items.map(
                                        (
                                            stock,
                                            index
                                        ) => (
                                            <StockCard
                                                key={
                                                    stock.id
                                                }
                                                stock={
                                                    stock
                                                }
                                                index={
                                                    index
                                                }
                                                isDark={
                                                    isDark
                                                }
                                            />
                                        )
                                    )
                                    : renderEmpty(
                                        "موجودی‌ای برای نمایش وجود ندارد"
                                    )}
                            </div>

                            <Pagination
                                currentPage={
                                    currentPage
                                }
                                totalPages={
                                    paginatedStock.totalPages
                                }
                                onPageChange={
                                    setCurrentPage
                                }
                                isDark={isDark}
                            />
                        </>
                    )}

                    {tab === "transactions" && (
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {paginatedTransactions
                                    .items.length
                                    ? paginatedTransactions.items.map(
                                        (transaction) => (
                                            <WarehouseEmployeeTransactionCard
                                                key={
                                                    transaction.id
                                                }
                                                transaction={
                                                    transaction
                                                }
                                            />
                                        )
                                    )
                                    : renderEmpty(
                                        "تراکنشی برای نمایش وجود ندارد"
                                    )}
                            </div>

                            <Pagination
                                currentPage={
                                    currentPage
                                }
                                totalPages={
                                    paginatedTransactions.totalPages
                                }
                                onPageChange={
                                    setCurrentPage
                                }
                                isDark={isDark}
                            />
                        </>
                    )}

                    {tab === "orders" && (
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {paginatedOrders.items.length
                                    ? paginatedOrders.items.map((orderTask, index) => (
                                        <WarehouseEmployeeOrderTaskCard
                                            key={orderTask.id}
                                            orderTask={orderTask}
                                            index={index}
                                            isStaff={!!myStaff}
                                            staffId={myStaff?.id ?? null}
                                            canChangeStatus={true}
                                            onUpdate={() => refresh()}
                                        />
                                    ))
                                    : renderEmpty(
                                        "درخواست داخلی‌ای برای انبار ثبت نشده است"
                                    )}
                            </div>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={paginatedOrders.totalPages}
                                onPageChange={setCurrentPage}
                                isDark={isDark}
                            />
                        </>
                    )}

                    {tab === "deadlines" && (
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {paginatedDeadlines
                                    .items.length
                                    ? paginatedDeadlines.items.map(
                                        (
                                            deadline,
                                            index
                                        ) => {
                                            const order =
                                                orderTasks.find(
                                                    (item) =>
                                                        item.id ===
                                                        deadline.order_task
                                                );

                                            return (
                                                <DeadlineCard
                                                    key={
                                                        deadline.id
                                                    }
                                                    deadline={
                                                        deadline
                                                    }
                                                    orderTitle={
                                                        order
                                                            ? getOrderTaskTitle(
                                                                order
                                                            )
                                                            : `سفارش #${deadline.order_task ??
                                                            "—"
                                                            }`
                                                    }
                                                    index={
                                                        index
                                                    }
                                                    isDark={
                                                        isDark
                                                    }
                                                />
                                            );
                                        }
                                    )
                                    : renderEmpty(
                                        "مهلتی برای نمایش وجود ندارد"
                                    )}
                            </div>

                            <Pagination
                                currentPage={
                                    currentPage
                                }
                                totalPages={
                                    paginatedDeadlines.totalPages
                                }
                                onPageChange={
                                    setCurrentPage
                                }
                                isDark={isDark}
                            />
                        </>
                    )}
                </motion.div>
            </AnimatePresence>

            <WarehouseEmployeeProductWizardModal
                isOpen={productWizardOpen}
                onClose={() =>
                    setProductWizardOpen(false)
                }
                categories={categories}
                staff={
                    myStaff
                        ? [myStaff]
                        : []
                }
                performedById={
                    myStaff?.id ?? null
                }
                onCreated={
                    handleProductCreated
                }
            />

            <CreateOrderTaskModal
                isOpen={createOrderTaskOpen}
                onClose={() =>
                    setCreateOrderTaskOpen(false)
                }
                onCreated={
                    handleOrderTaskCreated
                }
            />
        </div>
    );
}

