"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Loader, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";
import CustomerCard from "./CustomerCard";
import AddCustomerModal from "./AddCustomerModal";
import CustomerEditModal from "./CustomerEditModal";
import { Customer } from "@/types/customer";
import axiosInstance from "@/lib/axiosInstance";

export default function CustomersPage() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get<Customer[]>("/customers/api/v1/customers/");
            setCustomers(res.data);
        } catch {
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleDelete = async (id: number) => {
        await axiosInstance.delete(`/customers/api/v1/customers/${id}/delete/`);
        setCustomers((prev) => prev.filter((c) => c.id !== id));
    };

    const handleAdded = (c: Customer) => {
        setCustomers((prev) => [c, ...prev]);
    };

    const handleEdited = useCallback((updated: Customer) => {
        setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setEditingCustomer(null);
    }, []);

    const handleOpenEdit = (customer: Customer) => {
        setEditingCustomer(customer);
    };

    return (
        <div className="flex flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl"
                        style={{
                            background: isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.08)",
                        }}
                    >
                        <Users size={16} className="text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                            مدیریت مشتریان
                        </h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-400 dark:text-gray-500">
                            {loading ? "در حال بارگذاری..." : `${customers.length} مشتری ثبت شده`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                    <button
                        onClick={fetchCustomers}
                        disabled={loading}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:hover:text-gray-300"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                        }}
                        title="بارگذاری مجدد"
                        type="button"
                    >
                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                    </button>

                    <button
                        onClick={() => setShowAdd(true)}
                        className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl px-3.5 py-2 bg-blue-600 hover:bg-blue-100 hover:text-blue-500 transition-all duration-200 text-[12.5px] font-bold text-white  hover:opacity-90 sm:flex-none"
                        type="button"
                    >
                        <Plus size={13} />
                        <span className="whitespace-nowrap">افزودن مشتری</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader size={22} className="text-indigo-500 animate-spin" />
                    <p className="text-[12.5px] !text-gray-400 dark:!text-gray-500">
                        در حال دریافت لیست  مشتریان...
                    </p>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {customers.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="flex flex-col items-center justify-center gap-2 py-16"
                        >
                            <Users size={28} className="text-gray-300 dark:text-gray-700" />
                            <p className="text-[12.5px] text-gray-400 dark:text-gray-500">
                                هنوز مشتری‌ای ثبت نشده
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            layout
                            key="grid"
                            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        >
                            <AnimatePresence mode="popLayout">
                                {customers.map((customer, i) => (
                                    <CustomerCard
                                        key={customer.id}
                                        customer={customer}
                                        index={i}
                                        onDelete={() => handleDelete(customer.id)}
                                        onEdited={handleEdited}
                                        onEdit={() => handleOpenEdit(customer)}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            <AddCustomerModal
                isOpen={showAdd}
                onClose={() => setShowAdd(false)}
                onAdded={handleAdded}
            />

            {editingCustomer && (
                <CustomerEditModal
                    customer={editingCustomer}
                    isOpen={!!editingCustomer}
                    onClose={() => setEditingCustomer(null)}
                    onEdited={handleEdited}
                />
            )}
        </div>
    );
}
