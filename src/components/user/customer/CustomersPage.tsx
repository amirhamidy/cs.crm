"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import CustomerCard from "./CustomerCard";
import AddCustomerModal from "./AddCustomerModal";
import { Customer } from "@/types/customer";
import axiosInstance from "@/lib/axiosInstance";

export default function CustomersPage() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get<Customer[]>(
                "/customers/api/v1/customers/"
            );
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

    // ✅ اضافه شد
    const handleEdited = useCallback((updated: Customer) => {
        setCustomers((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
        );
    }, []);

    return (
        <div className="min-h-screen p-4 sm:p-6 font-vazir transition-colors">
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-6"
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                            background: isDark
                                ? "rgba(139,92,246,0.15)"
                                : "rgba(99,102,241,0.1)",
                        }}
                    >
                        <Users
                            size={20}
                            style={{ color: isDark ? "#a78bfa" : "#6366f1" }}
                        />
                    </div>
                    <div>
                        <h1
                            className="text-[16px] font-extrabold"
                            style={{ color: isDark ? "#f1f5f9" : "#1e293b" }}
                        >
                            مدیریت مشتریان
                        </h1>
                        <p
                            className="text-[12px]"
                            style={{ color: isDark ? "#475569" : "#94a3b8" }}
                        >
                            {customers.length} مشتری ثبت شده
                        </p>
                    </div>
                </div>

                <motion.button
                    onClick={() => setShowAdd(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-bold text-white"
                    style={{
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        boxShadow: isDark
                            ? "0 4px 14px rgba(99,102,241,0.3)"
                            : "0 4px 14px rgba(99,102,241,0.2)",
                    }}
                >
                    <Plus size={14} />
                    افزودن مشتری
                </motion.button>
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2
                        size={26}
                        className="animate-spin"
                        style={{ color: isDark ? "#8b5cf6" : "#6366f1" }}
                    />
                </div>
            ) : (
                <AnimatePresence>
                    {customers.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-24 text-[13px]"
                            style={{ color: isDark ? "#475569" : "#94a3b8" }}
                        >
                            هنوز مشتری‌ای ثبت نشده
                        </motion.div>
                    ) : (
                        <div key="grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {customers.map((customer, i) => (
                                <CustomerCard
                                    key={customer.id}
                                    customer={customer}
                                    index={i}
                                    onDelete={() => handleDelete(customer.id)}
                                    onEdited={handleEdited} // ✅ جایگزین onEdit شد
                                />
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            )}

            <AddCustomerModal
                isOpen={showAdd}
                onClose={() => setShowAdd(false)}
                onAdded={handleAdded}
            />
        </div>
    );
}
