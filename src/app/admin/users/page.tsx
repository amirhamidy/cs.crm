"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Users, UserPlus, Search, Loader2, RefreshCw } from "lucide-react";
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
        <div className="flex flex-col gap-5 p-4 md:p-6" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-2xl flex items-center justify-center"
                        style={{
                            background: isDark
                                ? "rgba(99,102,241,0.12)"
                                : "rgba(99,102,241,0.08)",
                        }}
                    >
                        <Users size={16} className="text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                            مدیریت کاربران
                        </h1>
                        <p className="text-[11.5px] text-gray-400 dark:text-gray-500 mt-0.5">
                            {loading ? "در حال بارگذاری..." : `${employees.length} کارمند ثبت‌شده`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchEmployees}
                        disabled={loading}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-40"
                        style={{
                            background: isDark
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(0,0,0,0.04)",
                        }}
                        title="بارگذاری مجدد"
                    >
                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                    </button>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12.5px] font-bold text-white transition-opacity hover:opacity-90"
                        style={{
                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                            boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
                        }}
                    >
                        <UserPlus size={13} />
                        افزودن کاربر
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search
                    size={13}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="جستجو بر اساس نام یا نام کاربری..."
                    dir="rtl"
                    className="w-full rounded-xl text-[13px] py-2.5 pr-9 pl-4 outline-none transition-all duration-200 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 border border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.03] focus:border-indigo-400 dark:focus:border-indigo-500/60"
                />
            </div>

            {/* States */}
            {loading && (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader2 size={22} className="text-indigo-500 animate-spin" />
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

            {/* Grid */}
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

            {/* Add Modal */}
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
