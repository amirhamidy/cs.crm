"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { ClipboardList, History, ListOrdered, ShoppingCart, UserCog } from "lucide-react";
import type { ApiPurchasingEmployee, ApiPurchasingStep, ApiPurchasingTask, ApiTaskAttachment } from "@/types/purchasing";

interface PurchasingOverviewProps {
    employees?: ApiPurchasingEmployee[];
    steps?: ApiPurchasingStep[];
    tasks?: ApiPurchasingTask[];
    attachments?: ApiTaskAttachment[];
}

function StatCard({ icon: Icon, label, value, color, bg, index }: {
    icon: typeof ShoppingCart; label: string; value: string | number; color: string; bg: string; index: number;
}) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.05 }}
            className="flex items-center gap-3 rounded-3xl p-4" style={{
                background: isDark ? "rgba(255,255,255,0.03)" : "#fafafa",
                border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(15,23,42,0.06)"
            }}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: bg }}>
                <Icon size={18} style={{ color }} />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40">{label}</p>
                <p className="mt-0.5 text-[16px] font-extrabold text-gray-900 dark:text-white">{value}</p>
            </div>
        </motion.div>
    );

}

export default function PurchasingOverview({ employees = [], steps = [], tasks = [], attachments = [] }: PurchasingOverviewProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const pendingTasks = tasks.filter(t => t.status === "pending").length;
    const inProgressTasks = tasks.filter(t => t.status === "in_progress").length;
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const activeEmployees = employees.filter(e => e.is_active).length;

    const recentActivity = [...attachments]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 8);

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard index={0} icon={ClipboardList} label="در انتظار بررسی" value={pendingTasks} color="#f59e0b" bg="rgba(245,158,11,0.1)" />
                <StatCard index={1} icon={ShoppingCart} label="در حال پیگیری" value={inProgressTasks} color="#6366f1" bg="rgba(99,102,241,0.1)" />
                <StatCard index={2} icon={ListOrdered} label="تکمیل شده" value={completedTasks} color="#10b981" bg="rgba(16,185,129,0.1)" />
                <StatCard index={3} icon={UserCog} label="کارمندان فعال خرید" value={`${activeEmployees} از ${employees.length}`} color="#3b82f6" bg="rgba(59,130,246,0.1)" />
            </div>

            <div className="flex flex-col gap-3 rounded-3xl p-5" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#fafafa", border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(15,23,42,0.06)" }}>
                <div className="flex items-center gap-2">
                    <ListOrdered size={15} className="text-indigo-500" />
                    <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">مراحل تعریف‌شده فرآیند خرید ({steps.length})</h3>
                </div>
                {steps.length === 0 ? <p className="py-6 text-center text-[11.5px] text-gray-400">هنوز مرحله‌ای تعریف نشده است</p> : (
                    <div className="flex flex-wrap gap-2">
                        {[...steps].sort((a, b) => a.order - b.order).map(step => (
                            <span key={step.id} className="rounded-xl bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                                {step.order}. {step.title}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3 rounded-3xl p-5" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#fafafa", border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(15,23,42,0.06)" }}>
                <div className="flex items-center gap-2">
                    <History size={15} className="text-blue-500" />
                    <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">آخرین فعالیت‌های فرآیند خرید</h3>
                </div>
                {recentActivity.length === 0 ? <p className="py-6 text-center text-[11.5px] text-gray-400">هنوز فعالیتی ثبت نشده است</p> : (
                    <div className="flex flex-col gap-2">
                        {recentActivity.map(item => (
                            <div key={item.id} className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]">
                                <div className="min-w-0">
                                    <p className="truncate text-[11.5px] font-bold text-gray-800 dark:text-white">{item.type_display} توسط {item.created_by_name}</p>
                                    {item.note && <p className="truncate text-[10px] text-gray-400">{item.note}</p>}
                                </div>
                                <span className="shrink-0 text-[10px] font-semibold text-gray-400">مرحله #{item.process_step_order ?? "-"}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

}
