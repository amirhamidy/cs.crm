"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ActivityType = "task" | "note" | "login" | "comment" | "update" | "alert";

interface Activity {
    id: string;
    type: ActivityType;
    title: string;
    description?: string;
    time: string;
    isNew?: boolean;
    actor?: string;
}

const typeConfig: Record<ActivityType, { icon: React.ReactNode; color: string; bg: string }> = {
    task: {
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        color: "text-emerald-500",
        bg: "bg-emerald-500/15",
    },
    note: {
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        ),
        color: "text-amber-500",
        bg: "bg-amber-500/15",
    },
    login: {
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
        ),
        color: "text-blue-500",
        bg: "bg-blue-500/15",
    },
    comment: {
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
        ),
        color: "text-violet-500",
        bg: "bg-violet-500/15",
    },
    update: {
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
        color: "text-cyan-500",
        bg: "bg-cyan-500/15",
    },
    alert: {
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        color: "text-rose-500",
        bg: "bg-rose-500/15",
    },
};

const MOCK_ACTIVITIES: Activity[] = [
    { id: "1", type: "task", title: "وظیفه تکمیل شد", description: "بررسی گزارش ماهانه مشتریان", time: "۲ دقیقه پیش", isNew: true },
    { id: "2", type: "comment", title: "نظر جدید", description: "مصطفی روی پرونده #۱۲۴ کامنت گذاشت", time: "۱۵ دقیقه پیش", isNew: true, actor: "مصطفی" },
    { id: "3", type: "alert", title: "وظیفه سررسید گذشته", description: "پیگیری قرارداد مشتری تهران", time: "۱ ساعت پیش", isNew: true },
    { id: "4", type: "update", title: "پروفایل بروزرسانی شد", description: "اطلاعات تماس ویرایش شد", time: "۳ ساعت پیش" },
    { id: "5", type: "note", title: "یادداشت اضافه شد", description: "جزئیات جلسه با تیم بازاریابی", time: "دیروز، ۱۶:۳۰" },
    { id: "6", type: "login", title: "ورود موفق", description: "از دستگاه جدید — Chrome / Windows", time: "دیروز، ۰۹:۱۵" },
    { id: "7", type: "task", title: "وظیفه جدید اختصاص یافت", description: "آماده‌سازی پرزنتیشن Q3", time: "۲ روز پیش", actor: "امیر" },
    { id: "8", type: "comment", title: "نظر جدید", description: "امیر روی پرونده #۱۱۸ پاسخ داد", time: "۳ روز پیش", actor: "امیر" },
];

const FILTERS: { label: string; value: ActivityType | "all" }[] = [
    { label: "همه", value: "all" },
    { label: "وظایف", value: "task" },
    { label: "نظرات", value: "comment" },
    { label: "هشدارها", value: "alert" },
];

export default function ActivityFeed() {
    const [activeFilter, setActiveFilter] = useState<ActivityType | "all">("all");
    const [showAll, setShowAll] = useState(false);

    const filtered = MOCK_ACTIVITIES.filter(
        (a) => activeFilter === "all" || a.type === activeFilter
    );

    const displayed = showAll ? filtered : filtered.slice(0, 5);
    const newCount = MOCK_ACTIVITIES.filter((a) => a.isNew).length;

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
                        <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">فعالیت‌های اخیر</h3>
                        <p className="text-xs text-zinc-400">{MOCK_ACTIVITIES.length} رویداد</p>
                    </div>
                </div>
                {newCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-500 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                        {newCount} جدید
                    </span>
                )}
            </div>

            <div className="flex gap-2 px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 overflow-x-auto scrollbar-none">
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setActiveFilter(f.value)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${activeFilter === f.value
                                ? "bg-violet-500 text-white"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <AnimatePresence mode="popLayout">
                    {displayed.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-10 gap-2"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                <svg className="w-6 h-6 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <p className="text-xs text-zinc-400">فعالیتی در این دسته وجود نداره</p>
                        </motion.div>
                    )}

                    {displayed.map((activity, index) => {
                        const cfg = typeConfig[activity.type];
                        return (
                            <motion.div
                                key={activity.id}
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.18, delay: index * 0.04 }}
                                className="flex items-start gap-3.5 px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                            >
                                <div className="relative flex-shrink-0 mt-0.5">
                                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${cfg.bg} ${cfg.color}`}>
                                        {cfg.icon}
                                    </div>
                                    {activity.isNew && (
                                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-violet-500 ring-2 ring-white dark:ring-zinc-900" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
                                            {activity.title}
                                        </p>
                                        <span className="flex-shrink-0 text-xs text-zinc-400">{activity.time}</span>
                                    </div>
                                    {activity.description && (
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                                            {activity.description}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {filtered.length > 5 && (
                <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                        onClick={() => setShowAll((p) => !p)}
                        className="w-full py-2 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-1.5"
                    >
                        {showAll ? "کمتر نشان بده" : `${filtered.length - 5} مورد دیگه`}
                        <motion.svg
                            animate={{ rotate: showAll ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </motion.svg>
                    </button>
                </div>
            )}
        </div>
    );
}
