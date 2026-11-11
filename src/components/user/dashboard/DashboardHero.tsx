"use client";

import { motion, Variants } from "framer-motion";
import { useState, useEffect } from "react";
import {
    CheckCircle2,
    Clock,
    TrendingUp,
    AlertCircle,
    Sun,
    Sunset,
    Moon,
} from "lucide-react";

interface UserStats {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTask: number;
}

interface UserProfile {
    name: string;
    role: string;
    avatarUrl?: string;
}

interface DashboardHeroProps {
    user?: UserProfile;
    stats?: UserStats;
}

const defaultUser: UserProfile = {
    name: "",
    role: "",
    avatarUrl: undefined,
};

const defaultStats: UserStats = {
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTask: 0,
};

function getGreeting(): { text: string; icon: React.ReactNode } {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12)
        return { text: "صبح بخیر", icon: <Sun className="w-5 h-5 text-amber-400" /> };
    if (hour >= 12 && hour < 18)
        return { text: "ظهر بخیر", icon: <Sunset className="w-5 h-5 text-orange-400" /> };
    return { text: "شب بخیر", icon: <Moon className="w-5 h-5 text-indigo-400" /> };
}

function getPersianDate(): string {
    return new Intl.DateTimeFormat("fa-IR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(new Date());
}

const statCards = (stats: UserStats) => [
    {
        label: "کل وظایف",
        value: stats.totalTasks,
        icon: <TrendingUp className="w-5 h-5" />,
        color: "from-violet-500/20 to-violet-600/10 border-violet-500/20",
        iconBg: "bg-violet-500/20 text-violet-400",
        textColor: "text-violet-400",
    },
    {
        label: "انجام‌شده",
        value: stats.completedTasks,
        icon: <CheckCircle2 className="w-5 h-5" />,
        color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20",
        iconBg: "bg-emerald-500/20 text-emerald-400",
        textColor: "text-emerald-400",
    },
    {
        label: "در انتظار",
        value: stats.pendingTasks,
        icon: <Clock className="w-5 h-5" />,
        color: "from-amber-500/20 to-amber-600/10 border-amber-500/20",
        iconBg: "bg-amber-500/20 text-amber-400",
        textColor: "text-amber-400",
    },
    {
        label: "عقب‌افتاده",
        value: stats.overdueTask,
        icon: <AlertCircle className="w-5 h-5" />,
        color: "from-rose-500/20 to-rose-600/10 border-rose-500/20",
        iconBg: "bg-rose-500/20 text-rose-400",
        textColor: "text-rose-400",
    },
];

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function DashboardHero({
    user = defaultUser,
    stats = defaultStats,
}: DashboardHeroProps) {
    const greeting = getGreeting();
    const persianDate = getPersianDate();
    const completionRate =
        stats.totalTasks > 0
            ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
            : 0;

    const [animatedRate, setAnimatedRate] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setAnimatedRate(completionRate), 300);
        return () => clearTimeout(timer);
    }, [completionRate]);

    const initials = user.name
        ? user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
        : "؟";

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full space-y-5"
        >
            <motion.div
                variants={itemVariants}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f0f1a] via-[#13131f] to-[#0f0f1a] p-6"
            >
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-violet-600/10 blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-indigo-600/10 blur-3xl" />
                </div>

                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            {user.avatarUrl ? (
                                <img
                                    src={user.avatarUrl}
                                    alt={user.name}
                                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-violet-500/30"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl ring-2 ring-violet-500/30">
                                    {initials}
                                </div>
                            )}
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0f0f1a]" />
                        </div>

                        <div>
                            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                                {greeting.icon}
                                <span>{greeting.text}</span>
                            </div>
                            <h1 className="text-xl font-bold text-white">
                                {user.name || "کاربر"}
                            </h1>
                            <p className="text-sm text-gray-400 mt-0.5">{user.role || "—"}</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <p className="text-sm text-gray-400">{persianDate}</p>

                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">تکمیل وظایف</span>
                                <span className="text-sm font-bold text-violet-400">
                                    {animatedRate}٪
                                </span>
                            </div>
                            <div className="w-40 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${animatedRate}%` }}
                                    transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards(stats).map((card, index) => (
                    <motion.div
                        key={card.label}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, translateY: -2 }}
                        className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${card.color} p-4 cursor-default`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs text-gray-400 mb-2">{card.label}</p>
                                <motion.p
                                    className={`text-2xl font-bold ${card.textColor}`}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
                                >
                                    {card.value != null ? card.value.toLocaleString("fa-IR") : "۰"}
                                </motion.p>
                            </div>
                            <div className={`p-2 rounded-lg ${card.iconBg}`}>{card.icon}</div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
