"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    BellRing,
    Boxes,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    FileText,
    LayoutGrid,
    Loader2,
    Package,
    PackagePlus,
    PackageSearch,
    Plus,
    ReceiptText,
    ShieldCheck,
    ShoppingBag,
    UsersRound,
} from "lucide-react";
import { useTheme } from "next-themes";

import WarehouseOverview from "@/components/admin/warehouse/Warehouseoverview";
import AddCategoryModal from "@/components/admin/warehouse/AddCategoryModal";
import WarehouseCategoryCard from "@/components/admin/warehouse/WarehouseCategoryCard";
import WarehouseStaffCard from "@/components/admin/warehouse/WarehouseStaffCard";
import AddWarehouseStaffModal from "@/components/admin/warehouse/AddWarehouseStaffModal";
import CreateOrderTaskModal from "@/components/user/warehouse/CreateOrderTaskModal";
import WarehouseEmployeeTransactionCard from "@/components/user/warehouse/WarehouseEmployeeTransactionCard";
import WarehouseEmployeeProductCard from "@/components/user/warehouse/WarehouseEmployeeProductCard";
import WarehouseEmployeeProductWizardModal from "@/components/user/warehouse/WarehouseEmployeeProductWizardModal";
import WarehouseEmployeeTaskCard from "@/components/user/warehouse/WarehouseEmployeeTaskCard";
import WarehouseEmployeeOrderTaskCard from "@/components/user/warehouse/WarehouseEmployeeOrderTaskCard";
import WarehouseEmployeeStockLedger from "@/components/user/warehouse/Warehouseemployeestockledger";
import OrderInvoiceCard from "@/components/user/warehouse/OrderInvoiceCard";
import OrderInvoiceModal from "@/components/user/warehouse/OrderInvoiceModal";

import {
    buildSalesInvoices,
    formatDate,
    formatNumber,
    getDeadlineDate,
    getOrderTaskTitle,
    getQuantityFromStock,
    getStockProductName,
    getStockStatus,
    PAGE_SIZE,
    paginate,
} from "@/utils/warehouseEmployee";
import type { SalesInvoice } from "@/utils/warehouseEmployee";
import useWarehouseEmployee from "@/hooks/useWarehouseEmployee";
import axiosInstance from "@/lib/axiosInstance";
import type {
    ApiArchivedOrderTask,
    ApiOrderTaskDeadline,
    ApiStockInfo,
    ApiWarehouseTask,
} from "@/types/warehouse";

interface AdminCategory {
    id: number;
    name: string;
}

interface WarehouseStaff {
    id: number;
    employee: number;
    employee_id: number;
    full_name: string;
    is_active: boolean;
    joined_at: string;
}

type Tab =
    | "overview"
    | "products"
    | "tasks"
    | "stock"
    | "transactions"
    | "orders"
    | "deadlines"
    | "ledger"
    | "categories"
    | "staff"
    | "invoices";

const TABS: Array<
    [Tab, string, React.ComponentType<{ size?: number }>]
> = [
        ["overview", "نمای کلی", LayoutGrid],
        ["products", "محصولات", ShoppingBag],
        ["tasks", "وظایف انبار", ClipboardList],
        ["stock", "موجودی انبار", Boxes],
        ["transactions", "تراکنش‌ها", ReceiptText],
        ["orders", "درخواست‌های داخلی", PackageSearch],
        ["deadlines", "مهلت‌ها", BellRing],
        ["ledger", "گردش محصول", BellRing],
        ["categories", "دسته‌بندی‌ها", Package],
        ["invoices", "فاکتور فروش", FileText],
        ["staff", "انباردارها", UsersRound],
    ];

const AVATAR_GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#ec4899", "#8b5cf6"],
    ["#06b6d4", "#3b82f6"],
    ["#10b981", "#14b8a6"],
    ["#f59e0b", "#ef4444"],
] as const;

const cardBg = (dark: boolean) =>
    dark ? "rgba(255,255,255,0.03)" : "#fafafa";

const cardBorder = (dark: boolean) =>
    dark
        ? "1px solid rgba(255,255,255,0.06)"
        : "1px solid rgba(15,23,42,0.06)";

const cardShadow = (dark: boolean) =>
    dark
        ? "0 8px 30px rgba(0,0,0,0.22)"
        : "0 8px 24px rgba(15,23,42,0.05)";

const muted = (dark: boolean) =>
    dark ? "#94a3b8" : "#64748b";

function getStockColors(percentage: number, dark: boolean) {
    if (percentage >= 80) {
        return {
            gradient: ["#4ade80", "#10b981"],
            text: dark ? "#6ee7b7" : "#10b981",
            ring: "#10b981",
            glow: "#10b981",
            badgeBg: dark
                ? "rgba(16,185,129,.14)"
                : "rgba(16,185,129,.1)",
        };
    }

    if (percentage >= 40) {
        return {
            gradient: ["#facc15", "#22c55e"],
            text: dark ? "#fde047" : "#ca8a04",
            ring: "#eab308",
            glow: "#eab308",
            badgeBg: dark
                ? "rgba(234,179,8,.14)"
                : "rgba(234,179,8,.1)",
        };
    }

    return {
        gradient: ["#f97316", "#ef4444"],
        text: dark ? "#fca5a5" : "#ef4444",
        ring: "#ef4444",
        glow: "#ef4444",
        badgeBg: dark
            ? "rgba(239,68,68,.14)"
            : "rgba(239,68,68,.1)",
    };
}

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
        { length: Math.min(5, totalPages) },
        (_, index) =>
            totalPages <= 5
                ? index + 1
                : currentPage <= 3
                    ? index + 1
                    : currentPage >= totalPages - 2
                        ? totalPages - 4 + index
                        : currentPage - 2 + index,
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
                            color: active ? "#fff" : buttonStyle.color,
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

function StockCard({
    stock,
    index,
    isDark,
    productNames,
    onViewLedger,
}: {
    stock: ApiStockInfo;
    index: number;
    isDark: boolean;
    productNames?: Record<number, string>;
    onViewLedger?: (productId: number) => void;
}) {
    const [hovered, setHovered] = useState(false);

    const current = Number(
        stock.current_quantity ??
        getQuantityFromStock(stock) ??
        0,
    );
    const maximum = Number(stock.maximum_stock ?? 0);
    const minimum = Number(stock.minimum_stock ?? 0);
    const initial = Number(stock.initial_quantity ?? 0);

    const percentage =
        maximum > 0
            ? Math.min(100, Math.max(0, (current / maximum) * 100))
            : 0;

    const status = getStockStatus(stock);
    const colors = getStockColors(percentage, isDark);
    const [start, end] =
        AVATAR_GRADIENTS[stock.id % AVATAR_GRADIENTS.length];

    const productName =
        (stock as any).product_name?.trim() ||
        productNames?.[stock.product]?.trim() ||
        getStockProductName(stock) ||
        `محصول #${stock.product ?? stock.id}`;

    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const offset =
        circumference - (percentage / 100) * circumference;
    const gradientId = `stock-ring-${stock.id}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, delay: index * 0.04 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            className="relative flex min-h-[240px] flex-col overflow-visible rounded-3xl p-4"
            style={{
                background: cardBg(isDark),
                border: cardBorder(isDark),
                boxShadow: cardShadow(isDark),
            }}
        >
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
                <defs>
                    <linearGradient
                        id={`stock-border-${stock.id}`}
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
                    fill="none"
                    stroke={`url(#stock-border-${stock.id})`}
                    strokeWidth="1.4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={
                        hovered
                            ? { pathLength: 1, opacity: 1 }
                            : { pathLength: 0, opacity: 0 }
                    }
                    transition={{ duration: 0.45, ease: "easeInOut" }}
                />
            </svg>

            <div className="relative z-[1] flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                    <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[14px] font-extrabold text-white shadow-lg"
                        style={{
                            background: `linear-gradient(135deg,${start},${end})`,
                        }}
                    >
                        {productName.trim().charAt(0) || "؟"}
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">
                            {productName}
                        </h3>

                        <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] font-semibold text-gray-500 dark:text-gray-400">
                            <Boxes size={10} />
                            <span>موجودی #{stock.id}</span>

                            {stock.unit_label && (
                                <>
                                    <span className="text-gray-300 dark:text-white/20">
                                        ·
                                    </span>
                                    <span>{stock.unit_label}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <span
                    className="relative inline-flex shrink-0 items-center gap-1 rounded-xl px-2 py-1 text-[10.5px] font-extrabold"
                    style={{
                        background: colors.badgeBg,
                        color: colors.text,
                    }}
                >
                    {percentage < 40 && (
                        <span className="relative flex h-1.5 w-1.5">
                            <span
                                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                                style={{ background: colors.ring }}
                            />
                            <span
                                className="relative inline-flex h-1.5 w-1.5 rounded-full"
                                style={{ background: colors.ring }}
                            />
                        </span>
                    )}
                    {status.label}
                </span>
            </div>

            <div className="relative z-[1] mt-4 flex items-center justify-center">
                <div className="relative">
                    <svg width="110" height="110" className="-rotate-90">
                        <defs>
                            <linearGradient
                                id={gradientId}
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                            >
                                <stop
                                    offset="0%"
                                    stopColor={colors.gradient[0]}
                                />
                                <stop
                                    offset="100%"
                                    stopColor={colors.gradient[1]}
                                />
                            </linearGradient>
                        </defs>

                        <circle
                            cx="55"
                            cy="55"
                            r={radius}
                            fill="none"
                            stroke={
                                isDark
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(15,23,42,0.06)"
                            }
                            strokeWidth="8"
                        />

                        <motion.circle
                            cx="55"
                            cy="55"
                            r={radius}
                            fill="none"
                            stroke={`url(#${gradientId})`}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{
                                strokeDashoffset: circumference,
                            }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{
                                duration: 1,
                                delay: index * 0.04 + 0.2,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            style={{
                                filter: `drop-shadow(0 0 6px ${colors.glow}60)`,
                            }}
                        />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p
                            className="text-[22px] font-black leading-none tracking-tight"
                            style={{ color: colors.text }}
                        >
                            {formatNumber(Math.round(percentage))}
                            <span className="text-[11px] font-bold">٪</span>
                        </p>

                        <p className="mt-1 text-[9.5px] font-bold text-gray-400 dark:text-white/40">
                            پرشدگی
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative z-[1] mt-3 flex items-center justify-center gap-2">
                <Package size={12} style={{ color: colors.text }} />
                <span className="text-[11px] font-bold text-gray-500 dark:text-white/50">
                    موجودی فعلی:
                </span>
                <span className="text-[14px] font-black text-gray-900 dark:text-white">
                    {formatNumber(current)}
                </span>
                <span className="text-[10.5px] font-bold text-gray-400 dark:text-white/40">
                    از {formatNumber(maximum)}
                </span>
            </div>

            <div className="relative z-[1] mt-3 grid grid-cols-3 gap-1.5">
                {[
                    {
                        icon: <ShieldCheck size={11} className="text-amber-500" />,
                        label: "حداقل",
                        value: minimum,
                        bg: "rgba(245,158,11,0.08)",
                    },
                    {
                        icon: <Boxes size={11} className="text-indigo-500" />,
                        label: "اولیه",
                        value: initial,
                        bg: "rgba(99,102,241,0.08)",
                    },
                    {
                        icon: <Boxes size={11} className="text-emerald-500" />,
                        label: "حداکثر",
                        value: maximum,
                        bg: "rgba(16,185,129,0.08)",
                    },
                ].map((item, index) => (
                    <div
                        key={index}
                        className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2"
                        style={{
                            background: isDark
                                ? item.bg
                                : item.bg.replace("0.08", "0.06"),
                        }}
                    >
                        {item.icon}
                        <p className="text-[9px] font-bold text-gray-500 dark:text-white/40">
                            {item.label}
                        </p>
                        <p className="text-[12px] font-black text-gray-800 dark:text-white">
                            {formatNumber(item.value)}
                        </p>
                    </div>
                ))}
            </div>

            {onViewLedger && (
                <button
                    type="button"
                    onClick={() => onViewLedger(stock.product)}
                    className="relative z-[1] mt-3 flex items-center justify-center gap-1.5 rounded-2xl py-2 text-[11px] font-extrabold text-indigo-500 transition-colors hover:bg-indigo-500/10"
                >
                    مشاهده گردش کالا
                </button>
            )}
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
    const [hovered, setHovered] = useState(false);
    const [start, end] =
        AVATAR_GRADIENTS[deadline.id % AVATAR_GRADIENTS.length];

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, delay: index * 0.04 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            className="relative flex min-h-[148px] flex-col justify-between overflow-visible rounded-3xl p-4"
            style={{
                background: cardBg(isDark),
                border: cardBorder(isDark),
                boxShadow: cardShadow(isDark),
            }}
        >
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
                <defs>
                    <linearGradient
                        id={`deadline-border-${deadline.id}`}
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
                    fill="none"
                    stroke={`url(#deadline-border-${deadline.id})`}
                    strokeWidth="1.4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={
                        hovered
                            ? { pathLength: 1, opacity: 1 }
                            : { pathLength: 0, opacity: 0 }
                    }
                    transition={{ duration: 0.45, ease: "easeInOut" }}
                />
            </svg>

            <div className="relative z-[1] flex items-start gap-3">
                <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[15px] font-extrabold text-white shadow-lg"
                    style={{
                        background: `linear-gradient(135deg,${start},${end})`,
                    }}
                >
                    {orderTitle.trim().charAt(0) || "؟"}
                </div>

                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">
                        {orderTitle}
                    </h3>

                    <div className="mt-1 flex items-center gap-1.5 text-[10.5px] font-semibold text-gray-500 dark:text-gray-400">
                        <Package size={10} />
                        <span>
                            سفارش داخلی #{deadline.order_task ?? "—"}
                        </span>
                    </div>

                    <div className="mt-2">
                        <span
                            className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-[10.5px] font-extrabold"
                            style={{
                                background: isDark
                                    ? "rgba(99,102,241,0.12)"
                                    : "rgba(99,102,241,0.08)",
                                color: isDark ? "#a5b4fc" : "#6366f1",
                            }}
                        >
                            <BellRing size={10} />
                            مهلت: {formatDate(getDeadlineDate(deadline))}
                        </span>
                    </div>
                </div>
            </div>

            <div
                className="relative z-[1] mt-4 flex items-center justify-between rounded-2xl px-3 py-2.5"
                style={{
                    background: isDark
                        ? "rgba(99,102,241,0.08)"
                        : "rgba(99,102,241,0.05)",
                }}
            >
                <div className="flex items-center gap-2">
                    <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{
                            background: isDark
                                ? "rgba(99,102,241,0.14)"
                                : "rgba(99,102,241,0.1)",
                        }}
                    >
                        <BellRing size={12} className="text-indigo-500" />
                    </div>

                    <div>
                        <p className="text-[9.5px] font-bold text-gray-400 dark:text-white/40">
                            زمان باقی‌مانده
                        </p>
                        <p className="text-[12px] font-black text-gray-900 dark:text-white">
                            {formatDate(getDeadlineDate(deadline))}
                        </p>
                    </div>
                </div>

                <div className="text-left">
                    <p className="text-[9.5px] font-bold text-gray-400 dark:text-white/40">
                        وضعیت
                    </p>
                    <p className="text-[11.5px] font-extrabold text-indigo-500">
                        در انتظار
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

export default function WarehouseEmployeePage() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const {
        employeeId,
        employeeLoading,
        myStaff,
        warehouseAccess,
        limitedWarehouseAccess,
        isAdmin,
        isWarehouseStaff,
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
        refreshOrderTasks,
    } = useWarehouseEmployee();

    const hasFullWarehouseAccess =
        isAdmin || isWarehouseStaff;

    const [tab, setTab] = useState<Tab>(
        hasFullWarehouseAccess ? "overview" : "orders",
    );
    const [currentPage, setCurrentPage] = useState(1);
    const [taskItems, setTaskItems] =
        useState<ApiWarehouseTask[]>(myTasks);
    const [productWizardOpen, setProductWizardOpen] =
        useState(false);
    const [createOrderTaskOpen, setCreateOrderTaskOpen] =
        useState(false);
    const [ledgerProductId, setLedgerProductId] =
        useState<number | null>(null);
    const [adminCategories, setAdminCategories] =
        useState<AdminCategory[]>([]);
    const [adminLoading, setAdminLoading] = useState(false);
    const [showCategoryModal, setShowCategoryModal] =
        useState(false);
    const [archivedTasks, setArchivedTasks] =
        useState<ApiArchivedOrderTask[]>([]);
    const [archiveLoading, setArchiveLoading] = useState(false);
    const [selectedInvoice, setSelectedInvoice] =
        useState<SalesInvoice | null>(null);
    const [warehouseStaff, setWarehouseStaff] = useState<WarehouseStaff[]>([]);
    const [staffLoading, setStaffLoading] = useState(false);
    const [showAddStaffModal, setShowAddStaffModal] = useState(false);

    useEffect(() => {
        setTaskItems(myTasks);
    }, [myTasks]);

    useEffect(() => {
        setCurrentPage(1);
    }, [tab]);

    useEffect(() => {
        if (
            !hasFullWarehouseAccess &&
            !["orders", "stock", "tasks"].includes(tab)
        ) {
            setTab("orders");
        }
    }, [hasFullWarehouseAccess, tab]);

    const resolvedEmployeeId =
        myStaff?.employee_id ??
        myStaff?.employee ??
        employeeId;

    const taskEmployeeId =
        resolvedEmployeeId == null
            ? null
            : Number(resolvedEmployeeId);

    const fetchWarehouseStaff = useCallback(async () => {
        try {
            setStaffLoading(true);
            const response = await axiosInstance.get("/warehouse/api/v1/staff/");
            const data = Array.isArray(response.data)
                ? response.data
                : Array.isArray(response.data?.results)
                    ? response.data.results
                    : Array.isArray(response.data?.data)
                        ? response.data.data
                        : [];
            setWarehouseStaff(data);
        } catch {
            setWarehouseStaff([]);
        } finally {
            setStaffLoading(false);
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            setAdminLoading(true);

            const response = await axiosInstance.get(
                "/warehouse/api/v1/products/categories/",
            );

            setAdminCategories(
                Array.isArray(response.data)
                    ? response.data
                    : [],
            );
        } catch {
            setAdminCategories([]);
        } finally {
            setAdminLoading(false);
        }
    }, []);

    const fetchArchive = useCallback(async () => {
        try {
            setArchiveLoading(true);

            const response = await axiosInstance.get(
                "/warehouse/api/v1/order_task_archive/",
            );

            const data = Array.isArray(response.data)
                ? response.data
                : Array.isArray(response.data?.results)
                    ? response.data.results
                    : Array.isArray(response.data?.data)
                        ? response.data.data
                        : [];

            setArchivedTasks(data);
        } catch {
            setArchivedTasks([]);
        } finally {
            setArchiveLoading(false);
        }
    }, []);

    useEffect(() => {
        if (
            tab === "categories" &&
            hasFullWarehouseAccess
        ) {
            fetchCategories();
        }
    }, [tab, fetchCategories, hasFullWarehouseAccess]);

    useEffect(() => {
        if (tab === "staff" && hasFullWarehouseAccess) {
            fetchWarehouseStaff();
        }
    }, [tab, fetchWarehouseStaff, hasFullWarehouseAccess]);

    useEffect(() => {
        if (
            tab === "invoices" &&
            hasFullWarehouseAccess
        ) {
            fetchArchive();
        }
    }, [tab, fetchArchive, hasFullWarehouseAccess]);

    const stockByProduct = useMemo(
        () =>
            new Map(
                stockInfos.map((item) => [
                    item.product,
                    item,
                ]),
            ),
        [stockInfos],
    );

    const productNames = useMemo(
        () =>
            Object.fromEntries(
                products.map((product) => [
                    product.id,
                    product.name,
                ]),
            ),
        [products],
    );

    const initialQuantityByProduct = useMemo(
        () =>
            Object.fromEntries(
                stockInfos.map((stock) => [
                    stock.product,
                    Number(stock.initial_quantity ?? 0),
                ]),
            ),
        [stockInfos],
    );

    const pendingOrderTasks = useMemo(
        () =>
            orderTasks.filter(
                (task) =>
                    !["completed", "cancelled"].includes(
                        String(task.status ?? "").toLowerCase(),
                    ),
            ),
        [orderTasks],
    );

    const qualityTasks = useMemo(
        () =>
            taskItems.filter(
                (task) => task.quality_control_id !== null,
            ),
        [taskItems],
    );

    const pendingQualityTasks = useMemo(
        () =>
            qualityTasks.filter(
                (task) => task.status === "pending",
            ),
        [qualityTasks],
    );

    const paged = useCallback(
        (items: any[]) =>
            paginate(items, currentPage, PAGE_SIZE),
        [currentPage],
    );

    const paginatedProducts = useMemo(
        () => paged(products),
        [products, paged],
    );

    const paginatedTasks = useMemo(
        () => paged(taskItems),
        [taskItems, paged],
    );

    const paginatedStock = useMemo(
        () => paged(stockInfos),
        [stockInfos, paged],
    );

    const paginatedTransactions = useMemo(
        () => paged(transactions),
        [transactions, paged],
    );

    const paginatedOrders = useMemo(
        () => paged(orderTasks),
        [orderTasks, paged],
    );

    const paginatedDeadlines = useMemo(
        () => paged(orderTaskDeadlines),
        [orderTaskDeadlines, paged],
    );

    const paginatedCategories = useMemo(
        () => paged(adminCategories),
        [adminCategories, paged],
    );

    const paginatedStaff = useMemo(
        () => paged(warehouseStaff),
        [warehouseStaff, paged],
    );

    const salesInvoices = useMemo(
        () => buildSalesInvoices(archivedTasks),
        [archivedTasks],
    );

    const paginatedInvoices = useMemo(
        () => paged(salesInvoices),
        [salesInvoices, paged],
    );

    const handleTaskUpdated = useCallback(
        (updated: ApiWarehouseTask) => {
            setTaskItems((current) =>
                current.map((task) =>
                    task.id === updated.id
                        ? updated
                        : task,
                ),
            );
        },
        [],
    );

    const handleProductCreated = useCallback(async () => {
        setProductWizardOpen(false);
        setTab("products");
        setCurrentPage(1);
        await refresh();
    }, [refresh]);

    const handleOrderTaskCreated = useCallback(async () => {
        setCreateOrderTaskOpen(false);
        setTab("orders");
        setCurrentPage(1);
        await refresh();
    }, [refresh]);

    const handleViewLedger = useCallback((productId: number) => {
        setLedgerProductId(productId);
        setTab("ledger");
        setCurrentPage(1);
    }, []);

    const handleDeleteStaff = useCallback((id: number) => {
        setWarehouseStaff((current) => current.filter((staff) => staff.id !== id));
    }, []);

    const handleUpdateStaff = useCallback((updated: WarehouseStaff) => {
        setWarehouseStaff((current) =>
            current.map((staff) => (staff.id === updated.id ? updated : staff)),
        );
    }, []);

    const handleStaffSuccess = useCallback(() => {
        setCurrentPage(1);
        fetchWarehouseStaff();
    }, [fetchWarehouseStaff]);

    const handleDeleteCategory = useCallback((id: number) => {
        setAdminCategories((current) =>
            current.filter((category) => category.id !== id),
        );
    }, []);

    const handleUpdateCategory = useCallback(
        (updated: AdminCategory) => {
            setAdminCategories((current) =>
                current.map((category) =>
                    category.id === updated.id
                        ? updated
                        : category,
                ),
            );
        },
        [],
    );

    const handleCategorySuccess = useCallback(() => {
        setShowCategoryModal(false);
        fetchCategories();
    }, [fetchCategories]);

    const renderEmpty = useCallback(
        (text: string) => (
            <p
                className="col-span-full py-16 text-center text-[12.5px]"
                style={{ color: muted(isDark) }}
            >
                {text}
            </p>
        ),
        [isDark],
    );

    if (employeeLoading || loading) {
        return (
            <div
                dir="rtl"
                className="flex min-h-screen items-center justify-center"
                style={{
                    background: isDark ? "#0f172a" : "#f8fafc",
                }}
            >
                <Loader2
                    size={24}
                    className="animate-spin"
                    style={{ color: "#6366f1" }}
                />
            </div>
        );
    }

    if (!limitedWarehouseAccess) {
        return (
            <div
                dir="rtl"
                className="flex min-h-screen items-center justify-center p-6"
                style={{
                    background: isDark ? "#0f172a" : "#f8fafc",
                }}
            >
                <div
                    className="w-full max-w-md rounded-3xl border p-8 text-center"
                    style={{
                        background: cardBg(isDark),
                        borderColor: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(15,23,42,0.06)",
                        boxShadow: cardShadow(isDark),
                    }}
                >
                    <div
                        className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{
                            background: isDark
                                ? "rgba(99,102,241,0.12)"
                                : "rgba(99,102,241,0.08)",
                        }}
                    >
                        <Boxes
                            size={18}
                            className="text-indigo-500"
                        />
                    </div>

                    <h2 className="mt-5 text-[14px] font-extrabold text-gray-900 dark:text-white">
                        دسترسی به انبار ندارید
                    </h2>

                    <p className="mt-2 text-[11.5px] leading-7 text-gray-500 dark:text-gray-400">
                        حساب کاربری شما امکان مشاهده اطلاعات انبار را ندارد.
                    </p>
                </div>
            </div>
        );
    }

    const counts: Record<string, number> = {
        products: products.length,
        tasks: pendingTasks.length,
        orders: pendingOrderTasks.length,
        deadlines: orderTaskDeadlines.length,
        categories: adminCategories.length,
        staff: warehouseStaff.length,
        invoices: salesInvoices.length,
    };

    const visibleTabs = TABS.filter(
        ([id]) =>
            hasFullWarehouseAccess ||
            id === "orders" ||
            id === "stock" ||
            id === "tasks",
    );

    return (
        <div
            dir="rtl"
            className="flex min-h-screen flex-col gap-6 p-6"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                        style={{
                            background: isDark
                                ? "rgba(99,102,241,0.14)"
                                : "rgba(99,102,241,0.08)",
                        }}
                    >
                        <Boxes
                            size={18}
                            className="text-indigo-500"
                        />
                    </div>

                    <div>
                        <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                            انبار
                        </h1>

                        <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">
                            مدیریت وظایف، محصولات، موجودی و فرآیندهای ورود و خروج کالا
                        </p>
                    </div>
                </div>

                <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={refresh}
                    disabled={refreshing}
                    className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                    <Loader2
                        size={15}
                        className={refreshing ? "animate-spin" : ""}
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
                {visibleTabs.map(([id, label, Icon]) => {
                    const active = tab === id;
                    const count = counts[id] ?? 0;

                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setTab(id)}
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
                                pendingQualityTasks.length > 0 && (
                                    <span
                                        className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] text-white"
                                        style={{ background: "#8b5cf6" }}
                                    >
                                        {pendingQualityTasks.length}
                                    </span>
                                )}
                        </button>
                    );
                })}
            </div>

            {error && (
                <div
                    className="rounded-2xl border px-4 py-3 text-[12px] font-bold"
                    style={{
                        background: isDark
                            ? "rgba(239,68,68,.08)"
                            : "rgba(239,68,68,.05)",
                        borderColor: "rgba(239,68,68,.15)",
                        color: "#ef4444",
                    }}
                >
                    {error}
                </div>
            )}

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${tab}-${currentPage}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                >
                    {tab === "overview" &&
                        hasFullWarehouseAccess && (
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
                                            false,
                                        ],
                                        [
                                            "وظایف فعال",
                                            activeTasks.length,
                                            false,
                                        ],
                                        [
                                            "وظایف تکمیل شده",
                                            completedTasks.length,
                                            false,
                                        ],
                                        [
                                            "موجودی‌های بحرانی",
                                            criticalStock.length,
                                            criticalStock.length > 0,
                                        ],
                                    ].map(
                                        ([label, value, danger]) => (
                                            <div
                                                key={String(label)}
                                                className="rounded-3xl border p-4"
                                                style={{
                                                    background: cardBg(isDark),
                                                    border: cardBorder(isDark),
                                                    boxShadow: cardShadow(isDark),
                                                }}
                                            >
                                                <p className="text-[10.5px] text-gray-500 dark:text-gray-400">
                                                    {String(label)}
                                                </p>

                                                <p
                                                    className="mt-2 text-[22px] font-black"
                                                    style={{
                                                        color: danger
                                                            ? "#ef4444"
                                                            : isDark
                                                                ? "#fff"
                                                                : "#0f172a",
                                                    }}
                                                >
                                                    {formatNumber(
                                                        Number(value),
                                                    )}
                                                </p>
                                            </div>
                                        ),
                                    )}
                                </div>

                                {pendingQualityTasks.length > 0 && (
                                    <div
                                        className="rounded-3xl border p-4"
                                        style={{
                                            background: isDark
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
                                                    color: "#8b5cf6",
                                                }}
                                            >
                                                <ShieldCheck size={18} />
                                            </div>

                                            <div>
                                                <p className="text-[12px] font-extrabold text-gray-900 dark:text-white">
                                                    وظایف کنترل کیفیت
                                                </p>

                                                <p className="mt-1 text-[10.5px] text-gray-500 dark:text-gray-400">
                                                    {pendingQualityTasks.length}{" "}
                                                    وظیفه کنترل کیفیت در انتظار انجام است
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    {tab === "products" &&
                        hasFullWarehouseAccess && (
                            <div className="space-y-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                            محصولات انبار
                                        </h2>

                                        <p className="mt-1 text-[11.5px] text-gray-500 dark:text-gray-400">
                                            مدیریت محصولات و عملیات مربوط به موجودی
                                        </p>
                                    </div>

                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() =>
                                            setProductWizardOpen(true)
                                        }
                                        className="flex h-11 items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 text-[13px] font-bold text-white transition-colors hover:bg-indigo-500"
                                    >
                                        <PackagePlus size={16} />
                                        افزودن محصول
                                    </motion.button>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {paginatedProducts.items.length ? (
                                        paginatedProducts.items.map(
                                            (product, index) => (
                                                <WarehouseEmployeeProductCard
                                                    key={product.id}
                                                    product={product}
                                                    stockInfo={
                                                        stockByProduct.get(
                                                            product.id,
                                                        ) ?? null
                                                    }
                                                    index={index}
                                                    categories={categories}
                                                    staff={
                                                        myStaff
                                                            ? [myStaff]
                                                            : []
                                                    }
                                                    performedById={
                                                        myStaff?.id ?? null
                                                    }
                                                    onUpdated={refresh}
                                                    onStockChanged={refresh}
                                                    onDeleted={refresh}
                                                />
                                            ),
                                        )
                                    ) : (
                                        renderEmpty(
                                            "محصولی برای نمایش وجود ندارد",
                                        )
                                    )}
                                </div>

                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={
                                        paginatedProducts.totalPages
                                    }
                                    onPageChange={setCurrentPage}
                                    isDark={isDark}
                                />
                            </div>
                        )}

                    {tab === "tasks" && (
                        <div className="space-y-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        وظایف انبار
                                    </h2>

                                    <p className="mt-1 text-[11.5px] text-gray-500 dark:text-gray-400">
                                        وظایف دریافت کالا و درخواست‌های کنترل کیفیت
                                    </p>
                                </div>

                                {hasFullWarehouseAccess && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        {qualityTasks.length > 0 && (
                                            <div
                                                className="flex items-center gap-2 rounded-xl px-3 py-2"
                                                style={{
                                                    background: isDark
                                                        ? "rgba(139,92,246,.08)"
                                                        : "rgba(139,92,246,.06)",
                                                    color: "#8b5cf6",
                                                }}
                                            >
                                                <ShieldCheck size={15} />

                                                <span className="text-[10.5px] font-extrabold">
                                                    {qualityTasks.length}{" "}
                                                    وظیفه کنترل کیفیت
                                                </span>
                                            </div>
                                        )}

                                        <motion.button
                                            type="button"
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() =>
                                                setCreateOrderTaskOpen(true)
                                            }
                                            className="flex h-11 items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 text-[13px] font-bold text-white transition-colors hover:bg-indigo-500"
                                        >
                                            <Plus size={15} />
                                            ثبت وظیفه برای انبار
                                        </motion.button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {paginatedTasks.items.length ? (
                                    paginatedTasks.items.map(
                                        (task, index) => (
                                            <WarehouseEmployeeTaskCard
                                                key={task.id}
                                                task={task}
                                                index={index}
                                                employeeId={
                                                    taskEmployeeId
                                                }
                                                onUpdated={
                                                    handleTaskUpdated
                                                }
                                            />
                                        ),
                                    )
                                ) : (
                                    renderEmpty(
                                        "وظیفه‌ای برای شما وجود ندارد",
                                    )
                                )}
                            </div>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={paginatedTasks.totalPages}
                                onPageChange={setCurrentPage}
                                isDark={isDark}
                            />
                        </div>
                    )}

                    {tab === "stock" && (
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {paginatedStock.items.length ? (
                                    paginatedStock.items.map(
                                        (stock, index) => (
                                            <StockCard
                                                key={stock.id}
                                                stock={stock}
                                                index={index}
                                                isDark={isDark}
                                                productNames={productNames}
                                                onViewLedger={
                                                    hasFullWarehouseAccess
                                                        ? handleViewLedger
                                                        : undefined
                                                }
                                            />
                                        ),
                                    )
                                ) : (
                                    renderEmpty(
                                        "موجودی‌ای برای نمایش وجود ندارد",
                                    )
                                )}
                            </div>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={paginatedStock.totalPages}
                                onPageChange={setCurrentPage}
                                isDark={isDark}
                            />
                        </>
                    )}

                    {tab === "transactions" &&
                        hasFullWarehouseAccess && (
                            <>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {paginatedTransactions.items.length ? (
                                        paginatedTransactions.items.map(
                                            (transaction) => (
                                                <WarehouseEmployeeTransactionCard
                                                    key={transaction.id}
                                                    transaction={transaction}
                                                />
                                            ),
                                        )
                                    ) : (
                                        renderEmpty(
                                            "تراکنشی برای نمایش وجود ندارد",
                                        )
                                    )}
                                </div>

                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={
                                        paginatedTransactions.totalPages
                                    }
                                    onPageChange={setCurrentPage}
                                    isDark={isDark}
                                />
                            </>
                        )}

                    {tab === "orders" && (
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {paginatedOrders.items.length ? (
                                    paginatedOrders.items.map(
                                        (orderTask, index) => (
                                            <WarehouseEmployeeOrderTaskCard
                                                key={orderTask.id}
                                                orderTask={orderTask}
                                                products={products}
                                                index={index}
                                                isStaff={!!myStaff}
                                                staffId={
                                                    myStaff?.id ?? null
                                                }
                                                canChangeStatus={
                                                    hasFullWarehouseAccess
                                                }
                                                onRefresh={
                                                    refreshOrderTasks
                                                }
                                            />
                                        ),
                                    )
                                ) : (
                                    renderEmpty(
                                        "درخواست داخلی‌ای برای انبار ثبت نشده است",
                                    )
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

                    {tab === "deadlines" &&
                        hasFullWarehouseAccess && (
                            <>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {paginatedDeadlines.items.length ? (
                                        paginatedDeadlines.items.map(
                                            (deadline, index) => {
                                                const order =
                                                    orderTasks.find(
                                                        (item) =>
                                                            item.id ===
                                                            deadline.order_task,
                                                    );

                                                return (
                                                    <DeadlineCard
                                                        key={deadline.id}
                                                        deadline={deadline}
                                                        orderTitle={
                                                            order
                                                                ? getOrderTaskTitle(
                                                                    order,
                                                                )
                                                                : `سفارش #${deadline.order_task ?? "—"}`
                                                        }
                                                        index={index}
                                                        isDark={isDark}
                                                    />
                                                );
                                            },
                                        )
                                    ) : (
                                        renderEmpty(
                                            "مهلتی برای نمایش وجود ندارد",
                                        )
                                    )}
                                </div>

                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={
                                        paginatedDeadlines.totalPages
                                    }
                                    onPageChange={setCurrentPage}
                                    isDark={isDark}
                                />
                            </>
                        )}

                    {tab === "ledger" &&
                        hasFullWarehouseAccess && (
                            <WarehouseEmployeeStockLedger
                                products={products}
                                stockInfos={stockInfos}
                                transactions={transactions}
                                defaultProductId={ledgerProductId}
                            />
                        )}

                    {tab === "categories" &&
                        hasFullWarehouseAccess && (
                            <div className="space-y-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                            دسته‌بندی محصولات
                                        </h2>

                                        <p className="mt-1 text-[11.5px] text-gray-500 dark:text-gray-400">
                                            دسته‌بندی‌های موجود در انبار
                                        </p>
                                    </div>

                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() =>
                                            setShowCategoryModal(true)
                                        }
                                        className="flex h-11 items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 text-[13px] font-bold text-white transition-colors hover:bg-indigo-500"
                                    >
                                        <Package size={16} />
                                        افزودن دسته‌بندی
                                    </motion.button>
                                </div>

                                {adminLoading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2
                                            size={22}
                                            className="animate-spin"
                                            style={{
                                                color: "#6366f1",
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                            {paginatedCategories.items.length ? (
                                                paginatedCategories.items.map(
                                                    (
                                                        category,
                                                        index,
                                                    ) => (
                                                        <WarehouseCategoryCard
                                                            key={
                                                                category.id
                                                            }
                                                            category={
                                                                category
                                                            }
                                                            index={
                                                                index
                                                            }
                                                            onDelete={
                                                                handleDeleteCategory
                                                            }
                                                            onUpdated={
                                                                handleUpdateCategory
                                                            }
                                                        />
                                                    ),
                                                )
                                            ) : (
                                                renderEmpty(
                                                    "هنوز دسته‌بندی ثبت نشده",
                                                )
                                            )}
                                        </div>

                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={
                                                paginatedCategories.totalPages
                                            }
                                            onPageChange={setCurrentPage}
                                            isDark={isDark}
                                        />
                                    </>
                                )}
                            </div>
                        )}

                    {tab === "staff" &&
                        hasFullWarehouseAccess && (
                            <div className="space-y-5">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                            انباردارها
                                        </h2>
                                        <p className="mt-1 text-[11.5px] text-gray-500 dark:text-gray-400">
                                            مدیریت انباردارهای ثبت‌شده در سیستم
                                        </p>
                                    </div>
                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => setShowAddStaffModal(true)}
                                        className="flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-[11.5px] font-bold text-white transition-colors hover:bg-blue-500"
                                    >
                                        <Plus size={15} />
                                        افزودن انباردار
                                    </motion.button>
                                </div>

                                {staffLoading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2
                                            size={22}
                                            className="animate-spin"
                                            style={{ color: "#6366f1" }}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {paginatedStaff.items.length ? (
                                                paginatedStaff.items.map((staff, index) => (
                                                    <WarehouseStaffCard
                                                        key={staff.id}
                                                        staff={staff}
                                                        index={index}
                                                        onDelete={handleDeleteStaff}
                                                        onUpdated={handleUpdateStaff}
                                                    />
                                                ))
                                            ) : (
                                                renderEmpty("هنوز انبارداری ثبت نشده است")
                                            )}
                                        </div>

                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={paginatedStaff.totalPages}
                                            onPageChange={setCurrentPage}
                                            isDark={isDark}
                                        />
                                    </>
                                )}
                            </div>
                        )}

                    {tab === "invoices" &&
                        hasFullWarehouseAccess && (
                            <div className="space-y-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                                            style={{
                                                background: isDark
                                                    ? "rgba(99,102,241,0.14)"
                                                    : "rgba(99,102,241,0.08)",
                                            }}
                                        >
                                            <FileText
                                                size={18}
                                                className="text-indigo-500"
                                            />
                                        </div>

                                        <div>
                                            <h2 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                                فاکتورهای فروش
                                            </h2>

                                            <p className="mt-1 text-[11.5px] text-gray-500 dark:text-gray-400">
                                                فاکتورهای صادر شده بر اساس سفارش‌های آرشیو شده
                                            </p>
                                        </div>
                                    </div>

                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.97 }}
                                        onClick={fetchArchive}
                                        disabled={archiveLoading}
                                        className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        <Loader2
                                            size={14}
                                            className={
                                                archiveLoading
                                                    ? "animate-spin"
                                                    : ""
                                            }
                                        />
                                        بروزرسانی
                                    </motion.button>
                                </div>

                                {archiveLoading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2
                                            size={22}
                                            className="animate-spin"
                                            style={{
                                                color: "#6366f1",
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {paginatedInvoices.items.length ? (
                                                paginatedInvoices.items.map(
                                                    (
                                                        invoice: SalesInvoice,
                                                        index: number,
                                                    ) => (
                                                        <OrderInvoiceCard
                                                            key={
                                                                invoice.orderTaskId
                                                            }
                                                            invoice={
                                                                invoice
                                                            }
                                                            index={
                                                                index
                                                            }
                                                            onOpen={
                                                                setSelectedInvoice
                                                            }
                                                        />
                                                    ),
                                                )
                                            ) : (
                                                renderEmpty(
                                                    "فاکتوری برای نمایش وجود ندارد",
                                                )
                                            )}
                                        </div>

                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={
                                                paginatedInvoices.totalPages
                                            }
                                            onPageChange={setCurrentPage}
                                            isDark={isDark}
                                        />
                                    </>
                                )}
                            </div>
                        )}
                </motion.div>
            </AnimatePresence>


            {hasFullWarehouseAccess && (
                <>
                    <WarehouseEmployeeProductWizardModal
                        isOpen={productWizardOpen}
                        onClose={() => setProductWizardOpen(false)}
                        categories={categories}
                        staff={myStaff ? [myStaff] : []}
                        performedById={myStaff?.id ?? null}
                        onCreated={handleProductCreated}
                    />

                    <CreateOrderTaskModal
                        isOpen={createOrderTaskOpen}
                        onClose={() =>
                            setCreateOrderTaskOpen(false)
                        }
                        onCreated={handleOrderTaskCreated}
                    />

                    <AnimatePresence>
                        {showCategoryModal && (
                            <AddCategoryModal
                                isOpen={showCategoryModal}
                                onClose={() =>
                                    setShowCategoryModal(false)
                                }
                                onSuccess={handleCategorySuccess}
                            />
                        )}
                    </AnimatePresence>

                    <OrderInvoiceModal
                        isOpen={!!selectedInvoice}
                        onClose={() =>
                            setSelectedInvoice(null)
                        }
                        invoice={selectedInvoice}
                    />

                    <AddWarehouseStaffModal
                        isOpen={showAddStaffModal}
                        onClose={() => setShowAddStaffModal(false)}
                        onSuccess={handleStaffSuccess}
                    />
                </>
            )}

        </div>
    );
}
