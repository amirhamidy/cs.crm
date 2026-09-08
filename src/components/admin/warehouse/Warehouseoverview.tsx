"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
    AlertTriangle,
    ArrowDownCircle,
    ArrowUpCircle,
    Boxes,
    ClipboardList,
    History,
    PackageCheck,
    Wallet,
} from "lucide-react";
import { toJalali, toPersianDigits, JALALI_MONTHS, pad2 } from "@/lib/jalali";
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

function formatJalaliShort(value?: string | null) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const [jy, jm, jd] = toJalali(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    ) as [number, number, number];
    return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} - ${toPersianDigits(pad2(date.getHours()))}:${toPersianDigits(pad2(date.getMinutes()))}`;
}

function StatCard({
    icon: Icon,
    label,
    value,
    color,
    bg,
    index,
}: {
    icon: typeof Boxes;
    label: string;
    value: string | number;
    color: string;
    bg: string;
    index: number;
}) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="flex items-center gap-3 rounded-3xl p-4"
            style={{
                background: isDark ? "rgba(255,255,255,0.03)" : "#fafafa",
                border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(15,23,42,0.06)",
            }}
        >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: bg }}>
                <Icon size={18} style={{ color }} />
            </div>
            <div className="min-w-0">
                <p className="text-[12px] font-semibold text-gray-400 dark:text-white/45">{label}</p>
                <p className="mt-0.5 text-[16px] font-extrabold text-gray-900 dark:text-white">{value}</p>
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

    const stockByProduct = new Map(stockInfos.map((s) => [s.product, s]));

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
        .slice(0, 8);

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    index={0}
                    icon={Boxes}
                    label="تعداد محصولات"
                    value={products.length}
                    color="#6366f1"
                    bg="rgba(99,102,241,0.1)"
                />
                <StatCard
                    index={1}
                    icon={AlertTriangle}
                    label="نیاز به تامین"
                    value={criticalProducts.length}
                    color="#ef4444"
                    bg="rgba(239,68,68,0.1)"
                />
                <StatCard
                    index={2}
                    icon={Wallet}
                    label="ارزش تقریبی موجودی"
                    value={`${totalStockValue.toLocaleString("fa-IR")} تومان`}
                    color="#10b981"
                    bg="rgba(16,185,129,0.1)"
                />
                <StatCard
                    index={3}
                    icon={ClipboardList}
                    label="وظایف در انتظار"
                    value={pendingWarehouseTasks + pendingOrderTasks}
                    color="#f59e0b"
                    bg="rgba(245,158,11,0.1)"
                />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div
                    className="flex flex-col gap-3 rounded-3xl p-5"
                    style={{
                        background: isDark ? "rgba(255,255,255,0.03)" : "#fafafa",
                        border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(15,23,42,0.06)",
                    }}
                >
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={15} className="text-red-500" />
                        <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                            محصولات نیازمند تامین
                        </h3>
                    </div>

                    {criticalProducts.length === 0 ? (
                        <p className="py-6 text-center text-[12.5px] font-medium text-gray-400">
                            همه محصولات موجودی مناسبی دارند
                        </p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {criticalProducts.map((product) => {
                                const s = stockByProduct.get(product.id);
                                return (
                                    <div
                                        key={product.id}
                                        className="flex items-center justify-between rounded-2xl bg-red-50 px-3 py-2.5 dark:bg-red-500/10"
                                    >
                                        <span className="text-[12.5px] font-bold text-gray-800 dark:text-white">
                                            {product.name}
                                        </span>
                                        <span className="text-[12px] font-extrabold text-red-500">
                                            {s?.current_quantity} از حداقل {s?.minimum_stock}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div
                    className="flex flex-col gap-3 rounded-3xl p-5"
                    style={{
                        background: isDark ? "rgba(255,255,255,0.03)" : "#fafafa",
                        border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(15,23,42,0.06)",
                    }}
                >
                    <div className="flex items-center gap-2">
                        <History size={15} className="text-indigo-500" />
                        <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                            آخرین تراکنش‌های انبار
                        </h3>
                    </div>

                    {recentTransactions.length === 0 ? (
                        <p className="py-6 text-center text-[12.5px] font-medium text-gray-400">
                            هنوز تراکنشی ثبت نشده است
                        </p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {recentTransactions.map((tx) => {
                                const isIn = tx.transaction_type !== "stock_out";
                                const Icon = tx.transaction_type === "stock_out" ? ArrowUpCircle : ArrowDownCircle;
                                return (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]"
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <Icon
                                                size={14}
                                                className={isIn ? "text-emerald-500" : "text-red-500"}
                                            />
                                            <div className="min-w-0">
                                                <p className="truncate text-[12.5px] font-bold text-gray-800 dark:text-white">
                                                    {tx.product_name}
                                                </p>
                                                <p className="text-[12px] font-medium text-gray-400">
                                                    {tx.transaction_type_display} · {formatJalaliShort(tx.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`text-[12px] font-extrabold ${isIn ? "text-emerald-500" : "text-red-500"
                                                }`}
                                        >
                                            {isIn ? "+" : "-"}
                                            {tx.quantity_changed}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div
                className="flex items-center justify-between rounded-3xl p-5"
                style={{
                    background: isDark ? "rgba(255,255,255,0.03)" : "#fafafa",
                    border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(15,23,42,0.06)",
                }}
            >
                <div className="flex items-center gap-2">
                    <PackageCheck size={15} className="text-emerald-500" />
                    <span className="text-[12.5px] font-bold text-gray-700 dark:text-gray-200">
                        {pendingWarehouseTasks} وظیفه دریافت کالا و {pendingOrderTasks} درخواست داخلی در انتظار انجام است
                    </span>
                </div>
            </div>
        </div>
    );
}