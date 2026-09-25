"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Trash2, UserRound } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiQualityControlEmployee } from "@/types/quality_control";

export default function QCEmployeeCard({ employee, index, onDeleted }: { employee: ApiQualityControlEmployee; index: number; onDeleted: () => void }) {
    const [loading, setLoading] = useState(false);

    async function remove() {
        if (!confirm(`کاربر ${employee.username} از تیم کنترل کیفی حذف شود؟`)) return;
        setLoading(true);
        try {
            await axiosInstance.delete(`/quality_control/api/v1/employee/${employee.id}/delete/`);
            onDeleted();
        } finally {
            setLoading(false);
        }
    }

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * .04, .3) }} className="relative overflow-hidden rounded-[28px] border border-black/[.05] bg-white p-5 shadow-sm dark:border-white/[.06] dark:bg-white/[.025]">
            <div className="absolute right-0 top-0 h-full w-1 bg-blue-500" />
            <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500"><UserRound size={19} /></div>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-black text-gray-900 dark:text-white">{employee.username}</h3>
                    <p className="mt-1 text-[9px] font-bold text-gray-400">کاربر #{employee.user}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[8px] font-black ${employee.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-gray-500/10 text-gray-400"}`}>{employee.is_active ? "فعال" : "غیرفعال"}</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-gray-50 p-3 dark:bg-white/[.035]"><p className="text-[9px] text-gray-400">شناسه عضویت</p><p className="mt-1 text-[11px] font-black text-gray-800 dark:text-white">#{employee.id}</p></div>
                <div className="rounded-2xl bg-gray-50 p-3 dark:bg-white/[.035]"><p className="text-[9px] text-gray-400">وضعیت</p><p className="mt-1 text-[11px] font-black text-emerald-500">{employee.is_active ? "فعال" : "غیرفعال"}</p></div>
            </div>

            <button onClick={remove} disabled={loading} className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-red-500/[.07] text-[10px] font-black text-red-500 transition hover:bg-red-500/[.12] disabled:opacity-40">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} حذف از تیم کنترل کیفی
            </button>
        </motion.div>
    );
}