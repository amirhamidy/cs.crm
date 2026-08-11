"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Users, UserPlus, RefreshCw, Loader } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import type { ApiEmployee } from "@/types/users";
import UserCard from "@/components/admin/users/UserCard";
import AddUserModal from "@/components/admin/users/AddUserPage";

export default function UsersPage() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [employees, setEmployees] = useState<ApiEmployee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);

    async function fetchEmployees() {
        setLoading(true);
        setError("");
        try {
            const { data } = await axiosInstance.get<ApiEmployee[]>(
                "/accounts/api/v1/employee/list/"
            );
            setEmployees(data);
        } catch (err) {
            const e = err as AxiosError<{ detail?: string }>;
            setError(e.response?.data?.detail ?? "خطا در دریافت لیست کارمندان");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchEmployees();
    }, []);

    const filtered = employees.filter((emp) =>
        emp.full_name.toLowerCase().includes(search.toLowerCase()) ||
        emp.username.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl"
                        style={{
                            background: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
                        }}
                    >
                        <Users size={16} className="text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                            مدیریت کاربران
                        </h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-400 dark:text-gray-500">
                            {loading ? "در حال بارگذاری..." : `${employees.length} کارمند ثبت‌شده`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                    <button
                        onClick={fetchEmployees}
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
                        onClick={() => setShowAddModal(true)}
                        className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-[12.5px] bg-blue-600 hover:bg-blue-100 hover:text-blue-500 transition-all duration-200  font-bold text-white hover:opacity-90 sm:flex-none"
                        type="button"
                    >
                        <UserPlus size={13} />
                        <span className="whitespace-nowrap">افزودن کاربر</span>
                    </button>
                </div>
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader size={22} className="text-indigo-500 animate-spin" />
                    <p className="text-[12.5px] text-gray-400 dark:text-gray-500">
                        در حال دریافت لیست کارمندان...
                    </p>
                </div>
            )}

            {!loading && error && (
                <div
                    className="flex flex-col items-center gap-3 py-12 rounded-2xl border"
                    style={{
                        background: isDark
                            ? "rgba(239,68,68,0.04)"
                            : "rgba(239,68,68,0.03)",
                        borderColor: isDark
                            ? "rgba(239,68,68,0.12)"
                            : "rgba(239,68,68,0.1)",
                    }}
                >
                    <p className="text-[12.5px] text-red-500 dark:text-red-400 font-semibold">
                        {error}
                    </p>
                    <button
                        onClick={fetchEmployees}
                        className="text-[12px] font-bold text-indigo-500 hover:underline"
                    >
                        تلاش مجدد
                    </button>
                </div>
            )}

            {!loading && !error && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                    <Users size={28} className="text-gray-300 dark:text-gray-700" />
                    <p className="text-[12.5px] text-gray-400 dark:text-gray-500">
                        {search ? "کارمندی با این مشخصات یافت نشد" : "هنوز کارمندی ثبت نشده"}
                    </p>
                </div>
            )}

            {!loading && !error && filtered.length > 0 && (
                <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                >
                    <AnimatePresence mode="popLayout">
                        {filtered.map((emp, i) => (
                            <UserCard
                                key={emp.id}
                                employee={emp}
                                index={i}
                                onDelete={(id) =>
                                    setEmployees((prev) => prev.filter((e) => e.id !== id))
                                }
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            <AnimatePresence>
                {showAddModal && (
                    <AddUserModal
                        onClose={() => setShowAddModal(false)}
                        onSuccess={() => {
                            setShowAddModal(false);
                            fetchEmployees();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
