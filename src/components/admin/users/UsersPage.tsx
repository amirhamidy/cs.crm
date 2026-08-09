"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus } from "lucide-react";
import UserCard from "./UserCard";
import AddUserModal from "./AddUserPage";
import type { ApiEmployee } from "@/types/users";
import axiosInstance from "@/lib/axiosInstance";

type EmployeeListResponse =
    | ApiEmployee[]
    | {
        results?: ApiEmployee[];
        data?: ApiEmployee[];
        employees?: ApiEmployee[];
    };

function extractEmployeeList(data: EmployeeListResponse): ApiEmployee[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
        if (Array.isArray(data.results)) return data.results;
        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data.employees)) return data.employees;
    }
    return [];
}

function isValidEmployee(emp: unknown): emp is ApiEmployee {
    if (!emp || typeof emp !== "object") return false;
    const item = emp as Record<string, unknown>;

    return (
        typeof item.id === "number" &&
        typeof item.full_name === "string" &&
        typeof item.username === "string" &&
        typeof item.created_at === "string"
    );
}

export default function UsersPage() {
    const [employees, setEmployees] = useState<ApiEmployee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const fetchEmployees = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get<EmployeeListResponse>(
                "/accounts/api/v1/employee/list/"
            );
            const list = extractEmployeeList(res.data);
            const validList = list.filter(isValidEmployee);
            setEmployees(validList);
        } catch {
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    function handleDelete(id: number) {
        setEmployees((prev) => prev.filter((e) => e.id !== id));
    }

    function handleUpdate(updatedEmployee: ApiEmployee) {
        setEmployees((prev) =>
            prev.map((emp) =>
                emp.id === updatedEmployee.id ? updatedEmployee : emp
            )
        );
    }

    function handleCreateSuccess() {
        setShowModal(false);
        fetchEmployees();
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6" dir="rtl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[22px] font-extrabold text-gray-900 dark:text-white leading-tight">
                        کارمندان
                    </h1>
                    <p className="text-[12.5px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {employees.length} نفر در سیستم
                    </p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 text-[13px] font-bold text-white px-4 py-2 rounded-xl"
                    style={{
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
                    }}
                    type="button"
                >
                    <UserPlus size={15} />
                    افزودن
                </motion.button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                </div>
            ) : employees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <p className="text-[13px] text-gray-400 dark:text-gray-500">
                        هنوز کارمندی ثبت نشده
                    </p>
                </div>
            ) : (
                <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                >
                    <AnimatePresence mode="popLayout">
                        {employees.map((emp, i) => (
                            <UserCard
                                key={emp.id}
                                employee={emp}
                                index={i}
                                onDelete={handleDelete}
                                onUpdate={handleUpdate}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            <AnimatePresence>
                {showModal && (
                    <AddUserModal
                        onClose={() => setShowModal(false)}
                        onSuccess={handleCreateSuccess}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
