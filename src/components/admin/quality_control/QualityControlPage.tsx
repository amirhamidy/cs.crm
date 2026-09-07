"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardCheck, LayoutGrid, Loader2, Plus, ShieldCheck } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { ApiQualityControlEmployee, ApiQualityControlItem } from "@/types/quality_control";
import QCEmployeeModal from "@/components/admin/quality_control/QCEmployeeModal";
import QCEmployeeCard from "@/components/admin/quality_control/QCEmployeeCard";
import QCItemCard from "@/components/admin/quality_control/QCItemCard";
import QCOverview from "@/components/admin/quality_control/QCOverview";

type Tab = "overview" | "items" | "employees";

const TABS: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
    { id: "overview", label: "نمای کلی", icon: LayoutGrid },
    { id: "items", label: "بررسی‌های کنترل کیفی", icon: ClipboardCheck },
    { id: "employees", label: "کارمندان کنترل کیفی", icon: ShieldCheck },
];

function extractList<T>(data: unknown): T[] {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === "object") {
        const record = data as Record<string, unknown>;
        if (Array.isArray(record.results)) return record.results as T[];
        if (Array.isArray(record.data)) return record.data as T[];
    }
    return [];
}

export default function QualityControlPage() {
    const [tab, setTab] = useState<Tab>("overview");

    const [items, setItems] = useState<ApiQualityControlItem[]>([]);
    const [employees, setEmployees] = useState<ApiQualityControlEmployee[]>([]);

    const [loading, setLoading] = useState(true);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [itemsRes, employeesRes] = await Promise.all([
                axiosInstance.get("/quality_control/api/v1/").catch(() => null),
                axiosInstance.get("/quality_control/api/v1/employee/").catch(() => null),
            ]);

            setItems(itemsRes ? extractList<ApiQualityControlItem>(itemsRes.data) : []);
            setEmployees(employeesRes ? extractList<ApiQualityControlEmployee>(employeesRes.data) : []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const pendingCount = items.filter((i) => i.status === "pending").length;

    return (
        <div dir="rtl" className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[18px] font-extrabold text-gray-900 dark:text-white">کنترل کیفی</h1>
                    <p className="mt-1 text-[12px] text-gray-400">
                        بررسی، تایید و رد محصولات دریافتی از فرآیند خرید
                    </p>
                </div>

                {tab === "employees" && (
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setShowEmployeeModal(true)}
                        className="flex items-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-2.5 text-[12.5px] font-bold text-white transition-colors hover:bg-blue-500"
                    >
                        <Plus size={15} />
                        افزودن کارمند
                    </motion.button>
                )}
            </div>

            <div className="flex flex-wrap gap-2 rounded-2xl bg-gray-100 p-1.5 dark:bg-white/[0.05]">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        className={`relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-extrabold transition-colors ${tab === t.id
                            ? "bg-white text-blue-600 shadow-sm dark:bg-[#1e293b]"
                            : "text-gray-400 dark:text-gray-500"
                            }`}
                    >
                        <t.icon size={14} />
                        {t.label}
                        {t.id === "items" && pendingCount > 0 && (
                            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-extrabold text-white">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 text-gray-400">
                    <Loader2 size={22} className="animate-spin" />
                </div>
            ) : (
                <>
                    {tab === "overview" && <QCOverview items={items} employees={employees} />}

                    {tab === "items" && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {items.length === 0 ? (
                                <p className="col-span-full py-16 text-center text-[12.5px] text-gray-400">
                                    موردی برای بررسی کنترل کیفی وجود ندارد
                                </p>
                            ) : (
                                items.map((item, index) => (
                                    <QCItemCard
                                        key={item.id}
                                        item={item}
                                        index={index}
                                        employees={employees}
                                        onUpdated={() => loadAll()}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {tab === "employees" && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {employees.length === 0 ? (
                                <p className="col-span-full py-16 text-center text-[12.5px] text-gray-400">
                                    هنوز کارمندی به تیم کنترل کیفی اضافه نشده است
                                </p>
                            ) : (
                                employees.map((emp, index) => (
                                    <QCEmployeeCard
                                        key={emp.id}
                                        employee={emp}
                                        index={index}
                                        onUpdated={(updated) =>
                                            setEmployees((prev) =>
                                                prev.map((e) => (e.id === updated.id ? updated : e))
                                            )
                                        }
                                        onDeleted={(id) =>
                                            setEmployees((prev) => prev.filter((e) => e.id !== id))
                                        }
                                    />
                                ))
                            )}
                        </div>
                    )}
                </>
            )}

            <QCEmployeeModal
                isOpen={showEmployeeModal}
                onClose={() => setShowEmployeeModal(false)}
                existingEmployees={employees}
                onCreated={(emp) => setEmployees((prev) => [...prev, emp])}
            />
        </div>
    );
}