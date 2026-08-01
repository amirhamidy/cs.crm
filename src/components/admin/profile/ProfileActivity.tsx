"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Activity, UserPlus, FileText, CheckSquare, TrendingUp, MessageSquare } from "lucide-react";

const activities = [
    { id: 1, icon: UserPlus, label: "مشتری جدید اضافه کردی", time: "۱۰ دقیقه پیش", color: "#6366f1" },
    { id: 2, icon: CheckSquare, label: "وظیفه «پیگیری قرارداد» بسته شد", time: "۴۵ دقیقه پیش", color: "#10b981" },
    { id: 3, icon: TrendingUp, label: "معامله جدید ثبت شد", time: "۲ ساعت پیش", color: "#8b5cf6" },
    { id: 4, icon: MessageSquare, label: "یادداشت جدید روی پرونده رضایی", time: "۳ ساعت پیش", color: "#f59e0b" },
    { id: 5, icon: FileText, label: "گزارش ماهانه آپلود شد", time: "دیروز", color: "#ec4899" },
];

export default function ProfileActivity() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;

    return (
        <div
            className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/[0.06] overflow-hidden"
            style={{
                boxShadow: isDark
                    ? "0 0 0 1px rgba(99,102,241,0.08), 0 4px 24px rgba(99,102,241,0.06)"
                    : "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
            }}
        >
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                    <Activity size={14} className="text-indigo-500" />
                </div>
                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">فعالیت‌های اخیر</h3>
            </div>

            <div className="p-3 space-y-0.5">
                {activities.map((item, i) => {
                    const Icon = item.icon;
                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06, duration: 0.25, ease: "easeOut" }}
                            className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors duration-150 cursor-default group"
                        >
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: `${item.color}1A` }}
                            >
                                <Icon size={14} style={{ color: item.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200 truncate">{item.label}</p>
                                <p className="text-[11.5px] text-gray-400 dark:text-gray-500 mt-0.5">{item.time}</p>
                            </div>
                            <div
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-60"
                                style={{ background: item.color }}
                            />
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
