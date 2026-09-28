"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Trash2 } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiQualityControlEmployee } from "@/types/quality_control";
import { gradientOf, initialOf } from "./qcUtils";

export default function QCEmployeeCard({ employee, index, onDeleted }: { employee: ApiQualityControlEmployee; index: number; onDeleted: () => void }) {
    const [loading, setLoading] = useState(false);

    async function remove() {
        if (!confirm(`کاربر ${employee.username} از تیم کنترل کیفی حذف شود؟`)) return;
        setLoading(true);
        try {
            await axiosInstance.delete(`/quality_control/api/v1/employee/${employee.id}/delete/`);
            onDeleted();
        } catch {
            alert("حذف انجام نشد، دوباره تلاش کنید.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3 }}
            transition={{ type: "spring", damping: 24, stiffness: 260, delay: Math.min(index * 0.035, 0.3) }}
            className="overflow-hidden rounded-[1.45rem] border border-gray-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-xl hover:shadow-black/[0.04] dark:border-white/[0.06] dark:bg-[#111827] dark:hover:shadow-black/20"
            dir="rtl"
        >
            <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradientOf(employee.id)} text-[14px] font-extrabold text-white shadow-sm`}>
                    {initialOf(employee.username)}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">{employee.username}</h3>
                    <p className="mt-1 text-[10.5px] font-semibold text-gray-400">کاربر #{employee.user} · عضویت #{employee.id}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold ${employee.is_active ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10" : "bg-gray-100 text-gray-400 dark:bg-white/[0.06]"}`}>
                    {employee.is_active ? "فعال" : "غیرفعال"}
                </span>
            </div>

            <div className="mt-3 h-px bg-gray-100 dark:bg-white/[0.06]" />

            <button
                type="button"
                onClick={remove}
                disabled={loading}
                className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-full bg-red-50 text-[11.5px] font-extrabold text-red-500 transition hover:bg-red-100 disabled:opacity-40 dark:bg-red-500/10 dark:hover:bg-red-500/20"
            >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                حذف از تیم کنترل کیفی
            </button>
        </motion.div>
    );
}