"use client";

import {
    BellRing,
    Boxes,
    ClipboardList,
    LayoutDashboard,
    PackageSearch,
    ReceiptText,
} from "lucide-react";
import {
    WarehouseTab,
} from "@/utils/warehouseEmployee";

interface Props {
    activeTab: WarehouseTab;
    onChange: (tab: WarehouseTab) => void;
    counts?: {
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
    counts,
}: Props) {
    const tabs = [
        {
            id: "overview" as WarehouseTab,
            label: "نمای کلی",
            icon: LayoutDashboard,
        },
        {
            id: "tasks" as WarehouseTab,
            label: "وظایف من",
            icon: ClipboardList,
            count: counts?.tasks,
        },
        {
            id: "stock" as WarehouseTab,
            label: "موجودی",
            icon: Boxes,
            count: counts?.stock,
        },
        {
            id: "transactions" as WarehouseTab,
            label: "تراکنش‌ها",
            icon: ReceiptText,
            count: counts?.transactions,
        },
        {
            id: "orders" as WarehouseTab,
            label: "سفارش‌ها",
            icon: PackageSearch,
            count: counts?.orders,
        },
        {
            id: "deadlines" as WarehouseTab,
            label: "مهلت‌ها",
            icon: BellRing,
            count: counts?.deadlines,
        },
    ];

    return (
        <div className="overflow-x-auto rounded-2xl border border-white/[0.07] bg-[#101114] p-1.5">
            <div className="flex min-w-max gap-1">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onChange(tab.id)}
                            className={`flex h-11 items-center gap-2 rounded-xl px-3.5 text-sm font-medium transition ${active
                                    ? "bg-white text-black shadow-lg shadow-white/5"
                                    : "text-white/45 hover:bg-white/[0.045] hover:text-white"
                                }`}
                        >
                            <Icon className="h-4 w-4" />

                            <span>{tab.label}</span>

                            {typeof tab.count === "number" && (
                                <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] ${active
                                            ? "bg-black/10 text-black/60"
                                            : "bg-white/[0.06] text-white/35"
                                        }`}
                                >
                                    {tab.count.toLocaleString("fa-IR")}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}