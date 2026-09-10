"use client";

import { ReactNode, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
    AlertTriangle,
    ArrowDownCircle,
    ArrowUpCircle,
    Boxes,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock3,
    History,
    Package,
    User,
    Wallet,
    XCircle,
} from "lucide-react";
import { toPersianDigits } from "@/lib/jalali";
import type {
    ApiOrderTask,
    ApiProduct,
    ApiStockInfo,
    ApiStockTransaction,
    ApiWarehouseTask,
} from "@/types/warehouse";

interface WarehouseOverviewProps {
    products: ApiProduct[];
    stockInfos: ApiStockInfo[];
    transactions: ApiStockTransaction[];
    tasks: ApiWarehouseTask[];
    orderTasks: ApiOrderTask[];
}

function CriticalProductsTooltip({
    products,
    stockByProduct,
    children,
}: {
    products: ApiProduct[];
    stockByProduct: Map<number, ApiStockInfo>;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const criticalProducts = products.filter((p) => {
        const s = stockByProduct.get(p.id);
        return s ? s.current_quantity <= s.minimum_stock : false;
    });

    return (
        <div
            className="relative inline-flex"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            {children}
            <AnimatePresence>
                {open && criticalProducts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="pointer-events-none absolute bottom-full right-0 z-50 mb-2 w-[280px] rounded-2xl border border-red-400/15 bg-slate-950 p-3 shadow-2xl"
                        dir="rtl"
                    >
                        <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
                            <div className="flex items-center gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                                <span className="text-[11px] font-extrabold text-white">
                                    محصولات نیازمند تامین
                                </span>
                            </div>
                            <span className="rounded-md bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-300">
                                {toPersianDigits(criticalProducts.length)}
                            </span>
                        </div>
                        <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto">
                            {criticalProducts.map((p) => {
                                const s = stockByProduct.get(p.id);
                                return (
                                    <div
                                        key={p.id}
                                        className="rounded-xl bg-white/[0.04] px-2.5 py-2"
                                    >
                                        <p className="truncate text-[11px] font-bold text-white">
                                            {p.name}
                                        </p>
                                        <div className="mt-1.5 grid grid-cols-3 gap-2">
                                            <div>
                                                <p className="text-[9px] text-white/40">فعلی</p>
                                                <p className="text-[11px] font-black text-red-300">
                                                    {toPersianDigits(s?.current_quantity ?? 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-white/40">حداقل</p>
                                                <p className="text-[11px] font-black text-amber-300">
                                                    {toPersianDigits(s?.minimum_stock ?? 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-white/40">حداکثر</p>
                                                <p className="text-[11px] font-black text-blue-300">
                                                    {toPersianDigits(s?.maximum_stock ?? 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <span className="absolute right-4 top-full h-0 w-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-950" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function OrderTaskCompactCard({
    orderTask,
    productName,
    requesterName,
    index,
}: {
    orderTask: ApiOrderTask;
    productName: string;
    requesterName: string;
    index: number;
}) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const statusTone =
        orderTask.status === "completed"
            ? "success"
            : orderTask.status === "cancelled"
                ? "danger"
                : "warning";

    const statusLabel =
        orderTask.status === "completed"
            ? "تکمیل"
            : orderTask.status === "cancelled"
                ? "لغو"
                : "در حال انجام";

    const statusStyle = {
        success: {
            bg: isDark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.08)",
            text: "#22c55e",
            icon: CheckCircle2,
        },
        danger: {
            bg: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)",
            text: "#ef4444",
            icon: XCircle,
        },
        warning: {
            bg: isDark ? "rgba(245,158,11,0.14)" : "rgba(245,158,11,0.08)",
            text: "#f59e0b",
            icon: Clock3,
        },
    }[statusTone];

    const StatusIcon = statusStyle.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            className="flex flex-col justify-between rounded-2xl p-2.5 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
            style={{
                background: isDark
                    ? "rgba(255,255,255,0.025)"
                    : "rgba(15,23,42,0.025)",
            }}
        >
            <div className="flex items-start justify-between gap-1.5">
                <p className="line-clamp-2 text-[11px] font-bold leading-4 text-gray-800 dark:text-white" title={orderTask.title}>
                    {orderTask.title || "بدون عنوان"}
                </p>
                <div
                    className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5"
                    style={{
                        background: statusStyle.bg,
                        color: statusStyle.text,
                    }}
                >
                    <StatusIcon size={9} />
                    <span className="text-[9px] font-bold">{statusLabel}</span>
                </div>
            </div>

            <div className="mt-2 flex items-center gap-2">
                <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                    style={{
                        background: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
                    }}
                >
                    <Package size={11} className="text-indigo-500" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold text-gray-700 dark:text-gray-200">
                        {productName}
                    </p>
                    <p className="text-[9.5px] text-gray-400 dark:text-gray-500">
                        تعداد: {toPersianDigits(orderTask.quantity ?? 0)}
                    </p>
                </div>
            </div>

            <div
                className="mt-2 flex items-center justify-between border-t pt-2"
                style={{
                    borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)",
                }}
            >
                <div className="flex min-w-0 items-center gap-1">
                    <User size={9} className="shrink-0 text-gray-400" />
                    <span className="truncate text-[9.5px] text-gray-500 dark:text-gray-400" title={requesterName}>
                        {requesterName}
                    </span>
                </div>
                {orderTask.created_at && (
                    <div className="flex items-center gap-1 shrink-0">
                        <CalendarDays size={9} className="text-gray-400" />
                        <span className="text-[9.5px] text-gray-400 dark:text-gray-500">
                            {new Date(orderTask.created_at).toLocaleDateString("fa-IR")}
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function StatsBar({
    products,
    stockByProduct,
    criticalCount,
    totalValue,
    pendingCount,
}: {
    products: ApiProduct[];
    stockByProduct: Map<number, ApiStockInfo>;
    criticalCount: number;
    totalValue: number;
    pendingCount: number;
}) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const stats = [
        {
            icon: Boxes,
            label: "تعداد محصولات",
            value: toPersianDigits(products.length),
            color: isDark ? "#a5b4fc" : "#6366f1",
            bg: isDark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)",
        },
        {
            icon: AlertTriangle,
            label: "نیاز به تامین",
            value: toPersianDigits(criticalCount),
            color: isDark ? "#fca5a5" : "#ef4444",
            bg: isDark ? "rgba(239,68,68,0.14)" : "rgba(239,68,68,0.08)",
            danger: criticalCount > 0,
            hasTooltip: true,
        },
        {
            icon: Wallet,
            label: "ارزش موجودی",
            value: toPersianDigits(totalValue.toLocaleString("fa-IR")),
            suffix: "تومان",
            color: isDark ? "#6ee7b7" : "#10b981",
            bg: isDark ? "rgba(16,185,129,0.14)" : "rgba(16,185,129,0.08)",
        },
        {
            icon: ClipboardList,
            label: "وظایف در انتظار",
            value: toPersianDigits(pendingCount),
            color: isDark ? "#fcd34d" : "#f59e0b",
            bg: isDark ? "rgba(245,158,11,0.14)" : "rgba(245,158,11,0.08)",
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-2 overflow-hidden rounded-3xl sm:grid-cols-4"
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
            {stats.map((stat, i) => {
                const Icon = stat.icon;
                const content = (
                    <div
                        className="relative flex items-center gap-2.5 px-4 py-3.5 sm:px-5 sm:py-4"
                        style={{
                            cursor: stat.hasTooltip ? "pointer" : "default",
                        }}
                    >
                        {i > 0 && (
                            <div
                                className="absolute right-0 top-1/2 h-10 w-px -translate-y-1/2"
                                style={{
                                    background: isDark
                                        ? "rgba(255,255,255,0.06)"
                                        : "rgba(15,23,42,0.06)",
                                }}
                            />
                        )}

                        <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                            style={{ background: stat.bg }}
                        >
                            <Icon size={15} style={{ color: stat.color }} />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[10.5px] font-semibold text-gray-500 dark:text-white/45">
                                {stat.label}
                            </p>
                            <div className="mt-0.5 flex items-baseline gap-1">
                                <p
                                    className={`truncate text-[15px] font-black tracking-tight ${stat.danger
                                            ? "text-red-500 dark:text-red-400"
                                            : "text-gray-900 dark:text-white"
                                        }`}
                                >
                                    {stat.value}
                                </p>
                                {stat.suffix && (
                                    <span className="truncate text-[10px] font-bold text-gray-400 dark:text-white/40">
                                        {stat.suffix}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );

                if (stat.hasTooltip) {
                    return (
                        <CriticalProductsTooltip
                            key={stat.label}
                            products={products}
                            stockByProduct={stockByProduct}
                        >
                            {content}
                        </CriticalProductsTooltip>
                    );
                }

                return <div key={stat.label}>{content}</div>;
            })}
        </motion.div>
    );
}

function Panel({
    icon: Icon,
    iconColor,
    title,
    count,
    children,
    index,
}: {
    icon: typeof Boxes;
    iconColor: string;
    title: string;
    count?: number;
    children: React.ReactNode;
    index: number;
}) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            className="flex flex-col overflow-hidden rounded-3xl"
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
            <div
                className="flex items-center justify-between gap-2 px-4 py-3"
                style={{
                    borderBottom: isDark
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "1px solid rgba(15,23,42,0.06)",
                }}
            >
                <div className="flex items-center gap-2">
                    <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{
                            background: isDark
                                ? `${iconColor}20`
                                : `${iconColor}12`,
                        }}
                    >
                        <Icon size={13} style={{ color: iconColor }} />
                    </div>
                    <h3 className="text-[12.5px] font-extrabold text-gray-900 dark:text-white">
                        {title}
                    </h3>
                </div>
                {typeof count === "number" && (
                    <span
                        className="flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 text-[10.5px] font-extrabold"
                        style={{
                            background: isDark
                                ? `${iconColor}18`
                                : `${iconColor}10`,
                            color: iconColor,
                        }}
                    >
                        {toPersianDigits(count)}
                    </span>
                )}
            </div>

            <div className="max-h-[320px] flex-1 overflow-y-auto p-2.5">
                {children}
            </div>
        </motion.div>
    );
}

export default function WarehouseOverview({
    products,
    stockInfos,
    transactions,
    tasks,
    orderTasks,
}: WarehouseOverviewProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const stockByProduct = useMemo(
        () => new Map(stockInfos.map((s) => [s.product, s])),
        [stockInfos]
    );

    const productNames = useMemo(() => {
        const map = new Map<number, string>();
        products.forEach((p) => map.set(p.id, p.name));
        return map;
    }, [products]);

    const criticalProducts = products.filter((p) => {
        const s = stockByProduct.get(p.id);
        return s ? s.current_quantity <= s.minimum_stock : false;
    });

    const totalStockValue = products.reduce((sum, p) => {
        const s = stockByProduct.get(p.id);
        if (!s) return sum;
        return sum + Number(p.sale_price) * s.current_quantity;
    }, 0);

    const pendingWarehouseTasks = tasks.filter((t) => t.status !== "completed").length;
    const pendingOrderTasks = orderTasks.filter((t) => t.status !== "completed").length;

    const recentTransactions = [...transactions]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20);

    const activeOrderTasks = [...orderTasks]
        .filter((t) => t.status !== "completed" && t.status !== "cancelled")
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20);

    return (
        <div className="flex flex-col gap-4">
            <StatsBar
                products={products}
                stockByProduct={stockByProduct}
                criticalCount={criticalProducts.length}
                totalValue={totalStockValue}
                pendingCount={pendingWarehouseTasks + pendingOrderTasks}
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Panel
                    index={0}
                    icon={Package}
                    iconColor="#6366f1"
                    title="درخواست‌های داخلی"
                    count={activeOrderTasks.length}
                >
                    {activeOrderTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-10">
                            <div
                                className="flex h-10 w-10 items-center justify-center rounded-2xl"
                                style={{
                                    background: isDark
                                        ? "rgba(99,102,241,0.12)"
                                        : "rgba(99,102,241,0.08)",
                                }}
                            >
                                <Package
                                    size={16}
                                    className={isDark ? "text-indigo-400" : "text-indigo-500"}
                                />
                            </div>
                            <p className="text-[11.5px] font-semibold text-gray-400">
                                درخواست داخلی‌ای ثبت نشده است
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {activeOrderTasks.map((orderTask, i) => {
                                const rawProduct = (orderTask as any).product;
                                const productId = typeof rawProduct === "object" ? rawProduct?.id : rawProduct;
                                const productName = productNames.get(Number(productId)) || "نامشخص";

                                const performedBy = (orderTask as any).performed_by;
                                const assignedEmployee = Array.isArray((orderTask as any).assigned_employee)
                                    ? (orderTask as any).assigned_employee[0]
                                    : (orderTask as any).assigned_employee;
                                const createdBy = (orderTask as any).created_by;

                                const requesterName =
                                    performedBy?.full_name ||
                                    assignedEmployee?.full_name ||
                                    createdBy?.full_name ||
                                    createdBy?.username ||
                                    "نامشخص";

                                return (
                                    <OrderTaskCompactCard
                                        key={orderTask.id}
                                        orderTask={orderTask}
                                        productName={productName}
                                        requesterName={requesterName}
                                        index={i}
                                    />
                                );
                            })}
                        </div>
                    )}
                </Panel>

                <Panel
                    index={1}
                    icon={History}
                    iconColor="#6366f1"
                    title="آخرین تراکنش‌های انبار"
                    count={recentTransactions.length}
                >
                    {recentTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-10">
                            <div
                                className="flex h-10 w-10 items-center justify-center rounded-2xl"
                                style={{
                                    background: isDark
                                        ? "rgba(99,102,241,0.12)"
                                        : "rgba(99,102,241,0.08)",
                                }}
                            >
                                <History
                                    size={16}
                                    className={isDark ? "text-indigo-400" : "text-indigo-500"}
                                />
                            </div>
                            <p className="text-[11.5px] font-semibold text-gray-400">
                                هنوز تراکنشی ثبت نشده است
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {recentTransactions.map((tx, i) => {
                                const isIn = tx.transaction_type !== "stock_out";
                                const Icon = isIn ? ArrowDownCircle : ArrowUpCircle;
                                return (
                                    <motion.div
                                        key={tx.id}
                                        initial={{ opacity: 0, x: 6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.025 }}
                                        className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                                    >
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <div
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                                                style={{
                                                    background: isIn
                                                        ? isDark
                                                            ? "rgba(16,185,129,0.12)"
                                                            : "rgba(16,185,129,0.08)"
                                                        : isDark
                                                            ? "rgba(239,68,68,0.12)"
                                                            : "rgba(239,68,68,0.08)",
                                                }}
                                            >
                                                <Icon
                                                    size={13}
                                                    className={
                                                        isIn
                                                            ? "text-emerald-500"
                                                            : "text-red-500"
                                                    }
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-[12px] font-bold text-gray-800 dark:text-white">
                                                    {tx.product_name}
                                                </p>
                                                <p className="mt-0.5 truncate text-[10.5px] font-medium text-gray-400">
                                                    {tx.transaction_type_display} ·{" "}
                                                    {new Date(tx.created_at).toLocaleDateString("fa-IR")}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`shrink-0 rounded-lg px-2 py-1 text-[11.5px] font-black ${isIn
                                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                                    : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                                                }`}
                                        >
                                            {isIn ? "+" : "-"}
                                            {toPersianDigits(tx.quantity_changed)}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </Panel>
            </div>
        </div>
    );
}