"use client";

import { useMemo, useState } from "react";
import {
    AlertCircle,
    Loader2,
    Warehouse,
} from "lucide-react";
import {
    ApiWarehouseTask,
} from "@/types/warehouse";
import useWarehouseEmployee from "@/hooks/useWarehouseEmployee";
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
import {
    WarehouseTab,
} from "@/utils/warehouseEmployee";

export default function WarehouseEmployeePage() {
    const warehouse = useWarehouseEmployee();

    const [activeTab, setActiveTab] =
        useState<WarehouseTab>("overview");

    const [selectedTask, setSelectedTask] =
        useState<ApiWarehouseTask | null>(null);

    const employeeData =
        warehouse.employee as unknown as Record<string, unknown> | null;

    const staffData =
        warehouse.myStaff as unknown as Record<string, unknown> | null;

    const employeeName = useMemo(() => {
        if (!employeeData) return undefined;

        return String(
            employeeData.full_name ??
                employeeData.name ??
                employeeData.first_name ??
                ""
        ) || undefined;
    }, [employeeData]);

    const staffCode = useMemo(() => {
        if (!staffData) return undefined;

        return (
            staffData.code ??
            staffData.staff_code ??
            staffData.employee_code
        ) as string | number | undefined;
    }, [staffData]);

    if (warehouse.employeeLoading || warehouse.loading) {
        return (
            <div
                dir="rtl"
                className="min-h-[500px] w-full rounded-[28px] border border-white/[0.07] bg-[#0b0c0e] p-6"
            >
                <div className="flex min-h-[460px] flex-col items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-400/15 bg-orange-400/10">
                        <Warehouse className="h-7 w-7 animate-pulse text-orange-300" />
                    </div>

                    <p className="mt-5 text-sm font-bold text-white/75">
                        در حال بررسی دسترسی انبار...
                    </p>

                    <p className="mt-2 text-xs text-white/30">
                        اطلاعات پرسنل و وضعیت انبار در حال دریافت است
                    </p>

                    <Loader2 className="mt-5 h-5 w-5 animate-spin text-white/25" />
                </div>
            </div>
        );
    }

    if (!warehouse.warehouseAccess) {
        return (
            <div
                dir="rtl"
                className="flex min-h-[500px] items-center justify-center rounded-[28px] border border-white/[0.07] bg-[#0b0c0e] p-6"
            >
                <div className="max-w-md text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035]">
                        <Warehouse className="h-7 w-7 text-white/30" />
                    </div>

                    <h2 className="mt-5 text-base font-bold text-white">
                        دسترسی انبار فعال نیست
                    </h2>

                    <p className="mt-2 text-sm leading-7 text-white/35">
                        حساب کاربری شما در حال حاضر به عنوان کارمند فعال
                        انبار شناسایی نشده است.
                    </p>
                </div>
            </div>
        );
    }

    if (warehouse.error) {
        return (
            <div
                dir="rtl"
                className="flex min-h-[500px] items-center justify-center rounded-[28px] border border-red-400/10 bg-[#0b0c0e] p-6"
            >
                <div className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10 text-red-300">
                        <AlertCircle className="h-6 w-6" />
                    </div>

                    <h2 className="mt-4 text-base font-bold text-white">
                        دریافت اطلاعات ناموفق بود
                    </h2>

                    <p className="mt-2 text-sm text-white/35">
                        {warehouse.error}
                    </p>

                    <button
                        type="button"
                        onClick={warehouse.refresh}
                        className="mt-5 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black"
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
            className="w-full space-y-4 pb-8"
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
                    tasks: warehouse.myTasks.length,
                    stock: warehouse.stockInfos.length,
                    transactions: warehouse.transactions.length,
                    orders: warehouse.orderTasks.length,
                    deadlines:
                        warehouse.orderTaskDeadlines.length,
                }}
            />

            <div className="min-h-[400px]">
                {activeTab === "overview" && (
                    <WarehouseEmployeeOverview
                        tasks={warehouse.myTasks}
                        stockInfos={warehouse.stockInfos}
                        onSelectTask={setSelectedTask}
                        onNavigate={setActiveTab}
                    />
                )}

                {activeTab === "tasks" && (
                    <WarehouseEmployeeTasks
                        tasks={warehouse.myTasks}
                        onSelectTask={setSelectedTask}
                    />
                )}

                {activeTab === "stock" && (
                    <WarehouseEmployeeStock
                        stockInfos={warehouse.stockInfos}
                    />
                )}

                {activeTab === "transactions" && (
                    <WarehouseEmployeeTransactions
                        transactions={warehouse.transactions}
                    />
                )}

                {activeTab === "orders" && (
                    <WarehouseEmployeeOrderTasks
                        orderTasks={warehouse.orderTasks}
                    />
                )}

                {activeTab === "deadlines" && (
                    <WarehouseEmployeeDeadlines
                        deadlines={warehouse.orderTaskDeadlines}
                    />
                )}
            </div>

            <WarehouseEmployeeTaskDetails
                task={selectedTask}
                open={Boolean(selectedTask)}
                onClose={() => setSelectedTask(null)}
            />
        </div>
    );
}