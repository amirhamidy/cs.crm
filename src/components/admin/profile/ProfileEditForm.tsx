"use client";

import { useState, useEffect } from "react";
import type { ElementType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
    User, Mail, Phone, MapPin, FileText,
    Check, Save, Activity, UserPlus,
    CheckCircle2, TrendingUp, StickyNote, FileUp,
} from "lucide-react";

interface ProfileData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city: string;
    bio: string;
}

interface ActivityItem {
    icon: ElementType;
    color: string;
    bg: string;
    text: string;
    time: string;
}

const INITIAL: ProfileData = {
    firstName: "امیر",
    lastName: "محمدی",
    email: "amir@example.com",
    phone: "۰۹۱۵-۱۲۳-۴۵۶۷",
    city: "سبزوار",
    bio: "مدیر سیستم CRM با بیش از ۵ سال تجربه در مدیریت ارتباط با مشتریان.",
};

const ACTIVITIES: ActivityItem[] = [
    {
        icon: UserPlus,
        color: "#6366f1",
        bg: "rgba(99,102,241,0.1)",
        text: "مشتری جدید اضافه کردی",
        time: "۱۰ دقیقه پیش",
    },
    {
        icon: CheckCircle2,
        color: "#22c55e",
        bg: "rgba(34,197,94,0.1)",
        text: "وظیفه «پیگیری قرارداد» بسته شد",
        time: "۴۵ دقیقه پیش",
    },
    {
        icon: TrendingUp,
        color: "#8b5cf6",
        bg: "rgba(139,92,246,0.1)",
        text: "معامله جدید ثبت شد",
        time: "۲ ساعت پیش",
    },
    {
        icon: StickyNote,
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.1)",
        text: "یادداشت جدید روی پرونده رضایی",
        time: "۳ ساعت پیش",
    },
    {
        icon: FileUp,
        color: "#ec4899",
        bg: "rgba(236,72,153,0.1)",
        text: "گزارش ماهانه آپلود شد",
        time: "دیروز",
    },
];

const TABS = [
    { key: "info", label: "اطلاعات" },
    { key: "activity", label: "فعالیت" },
] as const;

type Tab = (typeof TABS)[number]["key"];
type FormKey = keyof ProfileData;

interface ProfileEditFormProps {
    initialData?: ProfileData;
    activities?: ActivityItem[];
    onSave?: (data: ProfileData) => Promise<void>;
    activeTab?: Tab;
    onTabChange?: (t: Tab) => void;
}

function ActivityTab({ activities }: { activities: ActivityItem[] }) {
    return (
        <div className="p-5">
            <div className="relative">
                <div className="absolute right-[19px] top-5 bottom-5 w-px bg-gray-100 dark:bg-white/[0.05]" />
                <div className="space-y-1">
                    {activities.map((act, i) => {
                        const Icon = act.icon;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.07, duration: 0.25 }}
                                className="relative flex items-start gap-3 py-2.5 pr-1 group"
                            >
                                <div
                                    className="relative z-10 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                                    style={{ background: act.bg }}
                                >
                                    <Icon size={15} style={{ color: act.color }} />
                                </div>
                                <div className="flex-1 min-w-0 pt-1.5">
                                    <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 leading-snug">
                                        {act.text}
                                    </p>
                                    <p className="text-[11.5px] text-gray-400 dark:text-gray-500 mt-0.5">
                                        {act.time}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function ProfileEditForm({
    initialData = INITIAL,
    activities = ACTIVITIES,
    onSave,
    activeTab: externalTab,
    onTabChange,
}: ProfileEditFormProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>(externalTab ?? "info");
    const [form, setForm] = useState<ProfileData>(initialData);
    const [dirty, setDirty] = useState<Partial<Record<FormKey, boolean>>>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (externalTab) setActiveTab(externalTab);
    }, [externalTab]);

    if (!mounted) return null;

    const handleTabChange = (t: Tab) => {
        setActiveTab(t);
        onTabChange?.(t);
    };

    const handleChange = (key: FormKey, value: string) => {
        setForm((p) => ({ ...p, [key]: value }));
        setDirty((p) => ({ ...p, [key]: value !== initialData[key] }));
    };

    const hasDirty = Object.values(dirty).some(Boolean);

    const handleSave = async () => {
        if (!hasDirty || saving) return;
        setSaving(true);
        try {
            if (onSave) {
                await onSave(form);
            } else {
                await new Promise((r) => setTimeout(r, 900));
            }
            setSaved(true);
            setDirty({});
            setTimeout(() => setSaved(false), 2500);
        } finally {
            setSaving(false);
        }
    };

    const inputBase =
        "w-full rounded-xl text-[13.5px] py-2.5 pl-4 pr-10 outline-none transition-all duration-200 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600";

    const inputClass = (key: FormKey) =>
        `${inputBase} border ${dirty[key]
            ? "border-indigo-400 dark:border-indigo-500/70 bg-indigo-50/40 dark:bg-indigo-500/[0.06]"
            : "border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] focus:border-indigo-400 dark:focus:border-indigo-500/60 focus:bg-white dark:focus:bg-white/[0.06]"
        }`;

    const INFO_FIELDS: {
        key: FormKey;
        label: string;
        icon: ElementType;
        placeholder: string;
    }[] = [
            { key: "firstName", label: "نام", icon: User, placeholder: "نام" },
            { key: "lastName", label: "نام خانوادگی", icon: User, placeholder: "نام خانوادگی" },
            { key: "email", label: "ایمیل", icon: Mail, placeholder: "email@example.com" },
            { key: "phone", label: "شماره تماس", icon: Phone, placeholder: "۰۹۱۵-XXX-XXXX" },
            { key: "city", label: "شهر", icon: MapPin, placeholder: "شهر محل سکونت" },
        ];

    return (
        <div
            className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/[0.06] overflow-hidden flex flex-col"
            style={{
                boxShadow: isDark
                    ? "0 0 0 1px rgba(99,102,241,0.08), 0 4px 24px rgba(99,102,241,0.06)"
                    : "0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)",
            }}
        >
            <div className="flex items-center gap-1 px-5 pt-4 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => handleTabChange(t.key)}
                        className="relative pb-3 px-3 text-[13px] font-bold transition-colors duration-200 focus:outline-none flex items-center gap-1.5"
                        style={{
                            color:
                                activeTab === t.key
                                    ? isDark ? "#a5b4fc" : "#6366f1"
                                    : isDark ? "#64748b" : "#94a3b8",
                        }}
                    >
                        {t.key === "activity" && (
                            <Activity size={12} />
                        )}
                        {t.label}
                        {activeTab === t.key && (
                            <motion.div
                                layoutId="tab-indicator"
                                className="absolute bottom-0 right-0 left-0 h-0.5 rounded-full"
                                style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }}
                            />
                        )}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-auto">
                <AnimatePresence mode="wait">
                    {activeTab === "info" && (
                        <motion.div
                            key="info"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.22 }}
                            className="p-5 space-y-4"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {INFO_FIELDS.map(({ key, label, icon: Icon, placeholder }) => (
                                    <div key={key}>
                                        <label className="block text-[11.5px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 pr-1">
                                            {label}
                                            {dirty[key] && (
                                                <span className="mr-1.5 text-indigo-400 text-[10px]">
                                                    ● تغییر یافته
                                                </span>
                                            )}
                                        </label>
                                        <div className="relative">
                                            <Icon
                                                size={14}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
                                            />
                                            <input
                                                type="text"
                                                value={form[key]}
                                                onChange={(e) => handleChange(key, e.target.value)}
                                                placeholder={placeholder}
                                                dir="rtl"
                                                className={inputClass(key)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="block text-[11.5px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 pr-1">
                                    بیوگرافی
                                    {dirty.bio && (
                                        <span className="mr-1.5 text-indigo-400 text-[10px]">
                                            ● تغییر یافته
                                        </span>
                                    )}
                                </label>
                                <div className="relative">
                                    <FileText
                                        size={14}
                                        className="absolute right-3 top-3.5 text-gray-400 dark:text-gray-500 pointer-events-none"
                                    />
                                    <textarea
                                        value={form.bio}
                                        onChange={(e) => handleChange("bio", e.target.value)}
                                        placeholder="درباره خودت بنویس..."
                                        rows={3}
                                        dir="rtl"
                                        className={`${inputClass("bio")} resize-none pr-10 pt-2.5`}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <AnimatePresence>
                                    {saved && (
                                        <motion.div
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="flex items-center gap-1.5 text-emerald-500 text-[12.5px] font-bold"
                                        >
                                            <Check size={14} />
                                            تغییرات ذخیره شد
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <button
                                    onClick={handleSave}
                                    disabled={!hasDirty || saving}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed mr-auto"
                                    style={{
                                        background:
                                            hasDirty && !saving
                                                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                                                : "#94a3b8",
                                        boxShadow:
                                            hasDirty && !saving
                                                ? "0 4px 14px rgba(99,102,241,0.35)"
                                                : "none",
                                    }}
                                >
                                    {saving ? (
                                        <>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                                className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full"
                                            />
                                            در حال ذخیره...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={14} />
                                            ذخیره تغییرات
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "activity" && (
                        <motion.div
                            key="activity"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.22 }}
                        >
                            <ActivityTab activities={activities} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
