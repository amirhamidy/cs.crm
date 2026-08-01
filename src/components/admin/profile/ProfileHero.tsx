"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
    Mail, Phone, MapPin, Clock, BadgeCheck,
    ChevronDown, Check, Camera, Loader2,
} from "lucide-react";

const STATUSES = [
    { key: "online", label: "آنلاین", color: "#22c55e" },
    { key: "busy", label: "مشغول", color: "#f59e0b" },
    { key: "away", label: "دور", color: "#94a3b8" },
] as const;

type StatusKey = (typeof STATUSES)[number]["key"];

const COMPLETION_ITEMS = [
    { label: "نام و نام خانوادگی", done: true },
    { label: "ایمیل", done: true },
    { label: "شماره تماس", done: true },
    { label: "شهر", done: true },
    { label: "بیوگرافی", done: true },
    { label: "تصویر پروفایل", done: true },
    { label: "احراز هویت دو مرحله‌ای", done: false },
    { label: "آخرین ورود تأیید شده", done: false },
];

const DONE_COUNT = COMPLETION_ITEMS.filter((i) => i.done).length;
const TOTAL_COUNT = COMPLETION_ITEMS.length;
const PERCENT = Math.round((DONE_COUNT / TOTAL_COUNT) * 100);

interface ProfileHeroProps {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    city?: string;
    lastSeen?: string;
    role?: string;
    avatarUrl?: string | null;
    status?: StatusKey;
    onStatusChange?: (s: StatusKey) => void;
    onAvatarChange?: (file: File) => Promise<void>;
}

export default function ProfileHero({
    firstName = "امیر",
    lastName = "محمدی",
    email = "amir@example.com",
    phone = "۰۹۱۵-۱۲۳-۴۵۶۷",
    city = "سبزوار",
    lastSeen = "۱۰ دقیقه پیش",
    role = "Super Admin",
    avatarUrl = null,
    status: externalStatus,
    onStatusChange,
    onAvatarChange,
}: ProfileHeroProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [mounted, setMounted] = useState(false);
    const [status, setStatus] = useState<StatusKey>(externalStatus ?? "online");
    const [statusOpen, setStatusOpen] = useState(false);
    const [completionOpen, setCompletionOpen] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl);
    const [uploading, setUploading] = useState(false);
    const statusRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentStatus = STATUSES.find((s) => s.key === status)!;
    const initials = `${firstName.charAt(0)} ${lastName.charAt(0)}`;

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
                setStatusOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    if (!mounted) return null;

    const handleStatusChange = (s: StatusKey) => {
        setStatus(s);
        setStatusOpen(false);
        onStatusChange?.(s);
    };

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setAvatarPreview(preview);
        if (onAvatarChange) {
            setUploading(true);
            try {
                await onAvatarChange(file);
            } finally {
                setUploading(false);
            }
        }
        e.target.value = "";
    };

    return (
        <div
            className="rounded-2xl border border-gray-100 dark:border-white/[0.06] overflow-visible relative"
            style={{
                boxShadow: isDark
                    ? "0 0 0 1px rgba(99,102,241,0.08), 0 4px 24px rgba(99,102,241,0.06)"
                    : "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
                background: isDark
                    ? "linear-gradient(135deg, #0f172a 0%, rgba(30,27,75,0.4) 100%)"
                    : "linear-gradient(135deg, #ffffff 0%, rgba(238,242,255,0.5) 100%)",
            }}
        >
            <div
                className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
                aria-hidden
            >
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: isDark
                            ? "radial-gradient(circle at 15% 50%, rgba(99,102,241,0.07) 0%, transparent 55%), radial-gradient(circle at 85% 20%, rgba(139,92,246,0.05) 0%, transparent 50%)"
                            : "radial-gradient(circle at 15% 50%, rgba(99,102,241,0.04) 0%, transparent 55%), radial-gradient(circle at 85% 20%, rgba(139,92,246,0.03) 0%, transparent 50%)",
                    }}
                />
            </div>

            <div className="relative px-5 py-4 flex flex-col gap-3">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative flex-shrink-0 group">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <button
                            onClick={handleAvatarClick}
                            className="relative w-14 h-14 rounded-2xl overflow-hidden focus:outline-none"
                            title="تغییر تصویر پروفایل"
                        >
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="پروفایل"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div
                                    className="w-full h-full flex items-center justify-center text-white text-[17px] font-black select-none"
                                    style={{
                                        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                                        boxShadow: "0 4px 16px rgba(99,102,241,0.4)",
                                    }}
                                >
                                    {initials}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-2xl">
                                {uploading ? (
                                    <Loader2 size={16} className="text-white animate-spin" />
                                ) : (
                                    <Camera size={16} className="text-white" />
                                )}
                            </div>
                        </button>
                        <div
                            className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 transition-colors duration-300 pointer-events-none"
                            style={{ background: currentStatus.color }}
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-[15px] font-black text-gray-900 dark:text-gray-100 leading-none">
                                {firstName} {lastName}
                            </h1>
                            <BadgeCheck size={15} className="text-indigo-500 flex-shrink-0" />
                            <span
                                className="text-[10.5px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                                style={{
                                    background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))",
                                    color: isDark ? "#a5b4fc" : "#6366f1",
                                    border: "1px solid rgba(99,102,241,0.2)",
                                }}
                            >
                                {role}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {[
                                { icon: Mail, value: email },
                                { icon: Phone, value: phone },
                                { icon: MapPin, value: city },
                                { icon: Clock, value: lastSeen },
                            ].map(({ icon: Icon, value }) => (
                                <span key={value} className="flex items-center gap-1 text-[11.5px] text-gray-400 dark:text-gray-500">
                                    <Icon size={11} />
                                    {value}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="relative flex-shrink-0" ref={statusRef}>
                        <button
                            onClick={() => setStatusOpen((v) => !v)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-bold transition-all duration-200 focus:outline-none"
                            style={{
                                background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                                color: currentStatus.color,
                            }}
                        >
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: currentStatus.color }} />
                            {currentStatus.label}
                            <ChevronDown
                                size={11}
                                className="transition-transform duration-200"
                                style={{
                                    transform: statusOpen ? "rotate(180deg)" : "rotate(0deg)",
                                    color: isDark ? "#64748b" : "#94a3b8",
                                }}
                            />
                        </button>

                        <AnimatePresence>
                            {statusOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute left-0 top-full mt-1.5 w-36 rounded-xl border overflow-hidden z-50"
                                    style={{
                                        background: isDark ? "#1e293b" : "#ffffff",
                                        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                                        boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.4)" : "0 8px 24px rgba(0,0,0,0.1)",
                                    }}
                                >
                                    {STATUSES.map((s) => (
                                        <button
                                            key={s.key}
                                            onClick={() => handleStatusChange(s.key)}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12.5px] font-semibold transition-colors duration-150 focus:outline-none"
                                            style={{
                                                color: isDark ? "#e2e8f0" : "#374151",
                                                background: status === s.key
                                                    ? isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.06)"
                                                    : "transparent",
                                            }}
                                            onMouseEnter={(e) => {
                                                if (status !== s.key)
                                                    (e.currentTarget as HTMLButtonElement).style.background =
                                                        isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
                                            }}
                                            onMouseLeave={(e) => {
                                                if (status !== s.key)
                                                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                                            }}
                                        >
                                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                                            {s.label}
                                            {status === s.key && (
                                                <Check size={11} className="mr-auto" style={{ color: s.color }} />
                                            )}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div>
                    <button
                        onClick={() => setCompletionOpen((v) => !v)}
                        className="w-full focus:outline-none"
                    >
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11.5px] font-bold text-gray-500 dark:text-gray-400">
                                تکمیل پروفایل
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="text-[11.5px] font-black"
                                    style={{ color: isDark ? "#a5b4fc" : "#6366f1" }}
                                >
                                    {PERCENT}٪
                                </span>
                                <span className="text-[10.5px] text-gray-400 dark:text-gray-500">
                                    ({DONE_COUNT}/{TOTAL_COUNT})
                                </span>
                                <ChevronDown
                                    size={12}
                                    className="text-gray-400 transition-transform duration-200"
                                    style={{ transform: completionOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                                />
                            </div>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${PERCENT}%` }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                                className="h-full rounded-full"
                                style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }}
                            />
                        </div>
                    </button>

                    <AnimatePresence>
                        {completionOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                    {COMPLETION_ITEMS.map((item) => (
                                        <div
                                            key={item.label}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
                                            style={{
                                                background: item.done
                                                    ? isDark ? "rgba(34,197,94,0.08)" : "rgba(34,197,94,0.06)"
                                                    : isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                                                color: item.done ? "#22c55e" : isDark ? "#64748b" : "#94a3b8",
                                            }}
                                        >
                                            <div
                                                className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0"
                                                style={{
                                                    background: item.done
                                                        ? "rgba(34,197,94,0.15)"
                                                        : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                                                }}
                                            >
                                                {item.done ? (
                                                    <Check size={8} style={{ color: "#22c55e" }} />
                                                ) : (
                                                    <span
                                                        className="w-1.5 h-1.5 rounded-full"
                                                        style={{ background: isDark ? "#334155" : "#cbd5e1" }}
                                                    />
                                                )}
                                            </div>
                                            <span className="truncate">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
