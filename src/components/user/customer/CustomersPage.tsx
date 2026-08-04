"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus } from "lucide-react";
import CustomerCard from "./CustomerCard";
import DeleteModal from "./DeleteModal";
import AddCustomerDrawer from "./AddCustomerDrawer";
import { Customer, MOCK_CUSTOMERS } from "./types";

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
    const [search, setSearch] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const filtered = customers.filter(
        (c) =>
            `${c.firstName} ${c.lastName}`.includes(search) ||
            c.company.includes(search) ||
            c.phone.includes(search)
    );

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setDeleteTarget(null);
    };

    const handleView = (customer: Customer) => {
        window.location.href = `/admin/customers/${customer.id}`;
    };

    return (
        <div className="min-h-screen p-2" dir="rtl">
            <DeleteModal
                customer={deleteTarget}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteTarget(null)}
            />

            <AddCustomerDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onAdd={(customer) => {
                    setCustomers((prev) => [customer, ...prev]);
                    setDrawerOpen(false);
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mx-auto"
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                            <Users size={20} className="text-indigo-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                مشتریان
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {customers.length} مشتری ثبت شده
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setDrawerOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                                bg-indigo-500 hover:bg-indigo-600 text-white
                                transition-colors shadow-lg shadow-indigo-500/25"
                        >
                            <Plus size={15} />
                            افزودن مشتری
                        </motion.button>
                    </div>
                </div>

                <AnimatePresence mode="popLayout">
                    {filtered.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center text-gray-400"
                        >
                            <Users size={40} className="mb-3 opacity-30" />
                            <p className="text-sm">
                                {search ? "نتیجه‌ای برای جستجو یافت نشد" : "مشتری‌ای ثبت نشده"}
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="grid"
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            {filtered.map((customer, i) => (
                                <CustomerCard
                                    key={customer.id}
                                    customer={customer}
                                    index={i}
                                    onDelete={setDeleteTarget}
                                    onView={handleView}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
