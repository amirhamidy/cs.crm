"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertCircle,
    LayoutDashboard,
    Loader2,
    Warehouse,
    ClipboardList,
    Boxes,
    ReceiptText,
    PackageSearch,
    BellRing,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import { ApiWarehouseTask } from "@/types/warehouse";
import useWarehouseEmployee from "@/hooks/useWarehouseEmployee";
import { WarehouseTab } from "@/utils/warehouseEmployee";

// Import all components
import WarehouseEmployeeHeader from "./WarehouseEmployeeHeader";
import WarehouseEmployeeStats from "./WarehouseEmployeeStats";
import WarehouseEmployeeTabs from "./WarehouseEmployeeTabs";
import WarehouseEmployeeOverview from "./WarehouseEmployeeOverview";
import WarehouseEmployeeTasks from "./WarehouseEmployeeTasks";
import WarehouseEmployeeTaskDetails from "./WarehouseEmployeeTaskDetails";
import WarehouseEmployeeStock from "./WarehouseEmployeeStock";
import WarehouseEmployeeTransactions from "./WarehouseEmployeeTransactions";
import WarehouseEmployeeOrderTasks from "./WarehouseEmployeeOrderTasks";
import WarehouseEmployeeDeadlines from "./WarehouseEmployeeDeadlines";

const ITEMS_PER_PAGE = 8;

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

    const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        if (totalPages <= 5) return i + 1;
        if (currentPage <= 3) return i + 1;
        if (currentPage >= totalPages - 2) return totalPages - 4 + i;
        return currentPage - 2 + i;
    });

    return (
        <div className="flex items-center justify-center gap-1.5 mt-4">
            <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors disabled:opacity-40"
                style={{
                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)",
                    color: isDark ? "#94a3b8" : "#475569",
                }}
            >
                <ChevronRight size={15} />
            </button>

            {pages.map((page) => {
                const isActive = page === currentPage;
                return (
                    <button
                        key={page}
                        type="button"
                        onClick={() => onPageChange(page)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-[12px] font-extrabold transition-all"
                        style={{
                            background: isActive
                                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                                : isDark
                                    ? "rgba(255,255,255,0.04)"
                                    : "rgba(15,23,42,0.04)",
                            color: isActive ? "#ffffff" : isDark ? "#94a3b8" : "#475569",
                            boxShadow: isActive ? "0 4px 12px rgba(99,102,241,0.25)" : "none",
                        }}
                    >
                        {page}
                    </button>
                );
            })}

            <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors disabled:opacity-40"
                style={{
                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)",
                    color: isDark ? "#94a3b8" : "#475569",
                }}
            >
                <ChevronLeft size={15} />
            </button>
        </div>
    );
}

export default function WarehouseEmployeePage() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const warehouse = useWarehouseEmployee();

    const [activeTab, setActiveTab] = useState<WarehouseTab>("overview");
    const [selectedTask, setSelectedTask] = useState<ApiWarehouseTask | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const employeeData = warehouse.employee as unknown as Record<string, unknown> | null;
    const staffData = warehouse.myStaff as unknown as Record<string, unknown> | null;

    const employeeName = useMemo(() => {
        if (!employeeData) return undefined;
        return String(employeeData.full_name ?? employeeData.name ?? employeeData.first_name ?? "") || undefined;
    }, [employeeData]);

    const staffCode = useMemo(() => {
        if (!staffData) return undefined;
        return (staffData.code ?? staffData.staff_code ?? staffData.employee_code) as string | number | undefined;
    }, [staffData]);

    const bgColor = isDark ? "#0f172a" : "#f8fafc";
    const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)";
    const textColor = isDark ? "#ffffff" : "#1e293b";

    // Pagination logic
    const getPaginatedData = useCallback(
        <T,>(data: T[]) => {
            const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
            const start = (currentPage - 1) * ITEMS_PER_PAGE;
            const end = start + ITEMS_PER_PAGE;
            return {
                items: data.slice(start, end),
                totalPages,
            };
        },
        [currentPage]
    );

    const paginatedTasks = useMemo(
        () => getPaginatedData(warehouse.myTasks),
        [warehouse.myTasks, getPaginatedData]
    );

    const paginatedStock = useMemo(
        () => getPaginatedData(warehouse.stockInfos),
        [warehouse.stockInfos, getPaginatedData]
    );

    const paginatedTransactions = useMemo(
        () => getPaginatedData(warehouse.transactions),
        [warehouse.transactions, getPaginatedData]
    );

    const paginatedOrders = useMemo(
        () => getPaginatedData(warehouse.orderTasks),
        [warehouse.orderTasks, getPaginatedData]
    );

    const paginatedDeadlines = useMemo(
        () => getPaginatedData(warehouse.orderTaskDeadlines),
        [warehouse.orderTaskDeadlines, getPaginatedData]
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    if (warehouse.employeeLoading || warehouse.loading) {
        return (
            <div
                dir="rtl"
                className="min-h-[500px] w-full rounded-[28px] border p-6"
                style={{ borderColor, background: bgColor }}
            >
                <div className="flex min-h-[460px] flex-col items-center justify-center">
                    <div
                        className="flex h-16 w-16 items-center justify-center rounded-2xl border"
                        style={{
                            borderColor: isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.15)",
                            background: isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.08)",
                        }}
                    >
                        <Warehouse className="h-7 w-7 animate-pulse text-indigo-400" />
                    </div>

                    <p className="mt-5 text-sm font-bold" style={{ color: textColor }}>
                        در حال بررسی دسترسی انبار...
                    </p>

                    <p className="mt-2 text-xs" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "#94a3b8" }}>
                        اطلاعات پرسنل و وضعیت انبار در حال دریافت است
                    </p>

                    <Loader2 className="mt-5 h-5 w-5 animate-spin" style={{ color: isDark ? "rgba(255,255,255,0.25)" : "#94a3b8" }} />
                </div>
            </div>
        );
    }

    if (!warehouse.warehouseAccess) {
        return (
            <div
                dir="rtl"
                className="flex min-h-[500px] items-center justify-center rounded-[28px] border p-6"
                style={{ borderColor, background: bgColor }}
            >
                <div className="max-w-md text-center">
                    <div
                        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border"
                        style={{ borderColor, background: isDark ? "rgba(255,255,255,0.035)" : "rgba(15,23,42,0.035)" }}
                    >
                        <Warehouse className="h-7 w-7" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "#94a3b8" }} />
                    </div>

                    <h2 className="mt-5 text-base font-bold" style={{ color: textColor }}>
                        دسترسی انبار فعال نیست
                    </h2>

                    <p className="mt-2 text-sm leading-7" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "#94a3b8" }}>
                        حساب کاربری شما در حال حاضر به عنوان کارمند فعال انبار شناسایی نشده است.
                    </p>
                </div>
            </div>
        );
    }

    if (warehouse.error) {
        return (
            <div
                dir="rtl"
                className="flex min-h-[500px] items-center justify-center rounded-[28px] border p-6"
                style={{ borderColor: "rgba(239,68,68,0.1)", background: bgColor }}
            >
                <div className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10 text-red-400">
                        <AlertCircle className="h-6 w-6" />
                    </div>

                    <h2 className="mt-4 text-base font-bold" style={{ color: textColor }}>
                        دریافت اطلاعات ناموفق بود
                    </h2>

                    <p className="mt-2 text-sm" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "#94a3b8" }}>
                        {warehouse.error}
                    </p>

                    <button
                        type="button"
                        onClick={warehouse.refresh}
                        className="mt-5 rounded-xl px-5 py-2.5 text-sm font-bold"
                        style={{
                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                            color: "#ffffff",
                        }}
                    >
                        تلاش مجدد
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            dir="rtl"
            className="flex flex-col gap-6 p-6"
            style={{
                background: bgColor,
                minHeight: "100vh",
            }}
        >
            <WarehouseEmployeeHeader
                employeeName={employeeName}
                staffCode={staffCode}
                refreshing={warehouse.refreshing}
                onRefresh={warehouse.refresh}
            />

            <WarehouseEmployeeStats
                pending={warehouse.pendingTasks.length}
                active={warehouse.activeTasks.length}
                completed={warehouse.completedTasks.length}
                criticalStock={warehouse.criticalStock.length}
                totalTasks={warehouse.myTasks.length}
            />

            <WarehouseEmployeeTabs
                activeTab={activeTab}
                onChange={setActiveTab}
                counts={{
                    products: products.length,
                    tasks: myTasks.length,
                    stock: stockInfos.length,
                    transactions: transactions.length,
                    orders: orderTasks.length,
                    deadlines: orderTaskDeadlines.length,
                }}
            />

            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab + currentPage}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === "overview" && (
                            <WarehouseEmployeeOverview
                                tasks={warehouse.myTasks}
                                stockInfos={warehouse.stockInfos}
                                onSelectTask={setSelectedTask}
                                onNavigate={setActiveTab}
                            />
                        )}

                        {activeTab === "tasks" && (
                            <>
                                <WarehouseEmployeeTasks
                                    tasks={paginatedTasks.items}
                                    onSelectTask={setSelectedTask}
                                />
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={paginatedTasks.totalPages}
                                    onPageChange={setCurrentPage}
                                    isDark={isDark}
                                />
                            </>
                        )}

                        {activeTab === "stock" && (
                            <>
                                <WarehouseEmployeeStock
                                    stockInfos={paginatedStock.items}
                                />
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={paginatedStock.totalPages}
                                    onPageChange={setCurrentPage}
                                    isDark={isDark}
                                />
                            </>
                        )}

                        {activeTab === "transactions" && (
                            <>
                                <WarehouseEmployeeTransactions
                                    transactions={paginatedTransactions.items}
                                />
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={paginatedTransactions.totalPages}
                                    onPageChange={setCurrentPage}
                                    isDark={isDark}
                                />
                            </>
                        )}

                        {activeTab === "orders" && (
                            <>
                                <WarehouseEmployeeOrderTasks
                                    orderTasks={paginatedOrders.items}
                                />
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={paginatedOrders.totalPages}
                                    onPageChange={setCurrentPage}
                                    isDark={isDark}
                                />
                            </>
                        )}

                        {activeTab === "deadlines" && (
                            <>
                                <WarehouseEmployeeDeadlines
                                    deadlines={paginatedDeadlines.items}
                                />
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={paginatedDeadlines.totalPages}
                                    onPageChange={setCurrentPage}
                                    isDark={isDark}
                                />
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <WarehouseEmployeeTaskDetails
                task={selectedTask}
                open={Boolean(selectedTask)}
                onClose={() => setSelectedTask(null)}
            />
        </div>
    );
}