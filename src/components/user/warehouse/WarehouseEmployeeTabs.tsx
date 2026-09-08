"use client";

import {
    ClipboardList,
    Clock3,
    History,
    Package,
    ShoppingCart,
    Boxes,
} from "lucide-react";
import { motion } from "framer-motion";

export type WarehouseEmployeeTab =
    | "products"
    | "overview"
    | "tasks"
    | "stock"
    | "transactions"
    | "orders"
    | "deadlines";

interface WarehouseEmployeeTabsProps {
    activeTab: WarehouseEmployeeTab;
    onChange: (tab: WarehouseEmployeeTab) => void;
    counts?: {
        products?: number;
        tasks?: number;
        stock?: number;
        transactions?: number;
        orders?: number;
        deadlines?: number;
    };
}

export default function WarehouseEmployeeTabs({
    activeTab,
    onChange,
    counts = {},
}: WarehouseEmployeeTabsProps) {
    const tabs = [
        {
            id: "products" as const,
            label: "محصولات",
            icon: Package,
            count: counts.products,
        },
        {
            id: "overview" as const,
            label: "نمای کلی",
            icon: Boxes,
        },
        {
            id: "tasks" as const,
            label: "وظایف",
            icon: ClipboardList,
            count: counts.tasks,
        },
        {
            id: "stock" as const,
            label: "موجودی",
            icon: Boxes,
            count: counts.stock,
        },
        {
            id: "transactions" as const,
            label: "تراکنش‌ها",
            icon: History,
            count: counts.transactions,
        },
        {
            id: "orders" as const,
            label: "سفارش‌ها",
            icon: ShoppingCart,
            count: counts.orders,
        },
        {
            id: "deadlines" as const,
            label: "مهلت‌ها",
            icon: Clock3,
            count: counts.deadlines,
        },
    ];

    return (
        <div
            dir="rtl"
            className="flex w-full gap-2 overflow-x-auto pb-1 scrollbar-none"
        >
            {tabs.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onChange(tab.id)}
                        className="relative flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-[12px] font-bold transition"
                        style={{
                            color: active ? "#fff" : undefined,
                        }}
                    >
                        {active && (
                            <motion.div
                                layoutId="warehouse-employee-active-tab"
                                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/10"
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30,
                                }}
                            />
                        )}

                        <span className="relative z-10 flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <Icon
                                size={15}
                                className={
                                    active
                                        ? "text-white"
                                        : "text-slate-400"
                                }
                            />

                            <span className={active ? "text-white" : ""}>
                                {tab.label}
                            </span>

                            {tab.count !== undefined && (
                                <span
                                    className="rounded-full px-2 py-0.5 text-[9px] font-extrabold"
                                    style={{
                                        background: active
                                            ? "rgba(255,255,255,.16)"
                                            : "rgba(99,102,241,.08)",
                                        color: active
                                            ? "#fff"
                                            : "#6366f1",
                                    }}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}