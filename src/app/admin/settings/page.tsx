"use client";

import { useState } from "react";
import { Settings, Bell, Lock, Globe, Palette } from "lucide-react";

const tabs = [
    { key: "general", label: "عمومی", icon: Settings },
    { key: "notifications", label: "اعلان‌ها", icon: Bell },
    { key: "security", label: "امنیت", icon: Lock },
    { key: "appearance", label: "ظاهر", icon: Palette },
    { key: "localization", label: "منطقه‌ای", icon: Globe },
];

const notifItems = [
    "اعلان ثبت سفارش جدید",
    "اعلان کاربر جدید",
    "اعلان خطاهای سیستمی",
    "گزارش روزانه ایمیل",
    "اعلان موجودی کم محصول",
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("general");
    const [notifs, setNotifs] = useState<Record<string, boolean>>(
        Object.fromEntries(notifItems.map((n) => [n, true]))
    );
    const [darkMode, setDarkMode] = useState(false);
    const [twoFA, setTwoFA] = useState(false);

    const toggleNotif = (key: string) =>
        setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">تنظیمات</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    پیکربندی سیستم و اولویت‌های شخصی
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="lg:w-52 shrink-0">
                    <nav className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-2 space-y-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-right transition-colors ${activeTab === tab.key
                                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 font-medium"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        }`}
                                >
                                    <Icon size={16} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
                    {activeTab === "general" && (
                        <div className="space-y-5">
                            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 pb-3">
                                تنظیمات عمومی
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { label: "نام سایت", value: "ویز مارکت", type: "text" },
                                    { label: "ایمیل پشتیبانی", value: "support@wizmarket.ir", type: "email" },
                                    { label: "شماره تماس", value: "۰۵۱-۳۴۵۶۷۸۹۰", type: "text" },
                                    { label: "آدرس", value: "سبزوار، خراسان رضوی", type: "text" },
                                ].map((field, i) => (
                                    <div key={i}>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                                            {field.label}
                                        </label>
                                        <input
                                            type={field.type}
                                            defaultValue={field.value}
                                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-700 dark:text-gray-200"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end pt-2">
                                <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-lg transition-colors">
                                    ذخیره تغییرات
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "notifications" && (
                        <div className="space-y-5">
                            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 pb-3">
                                تنظیمات اعلان‌ها
                            </h2>
                            <div className="space-y-3">
                                {notifItems.map((item) => (
                                    <div
                                        key={item}
                                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                                    >
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                                        <button
                                            onClick={() => toggleNotif(item)}
                                            className={`relative w-10 h-5 rounded-full transition-colors ${notifs[item] ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                                                }`}
                                        >
                                            <span
                                                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${notifs[item] ? "right-0.5" : "left-0.5"
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "security" && (
                        <div className="space-y-5">
                            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 pb-3">
                                تنظیمات امنیتی
                            </h2>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">احراز هویت دو مرحله‌ای</p>
                                    <p className="text-xs text-gray-400 mt-0.5">افزایش امنیت حساب با کد یکبار مصرف</p>
                                </div>
                                <button
                                    onClick={() => setTwoFA(!twoFA)}
                                    className={`relative w-10 h-5 rounded-full transition-colors ${twoFA ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                                        }`}
                                >
                                    <span
                                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${twoFA ? "right-0.5" : "left-0.5"
                                            }`}
                                    />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400">تغییر رمز عبور</h3>
                                {["رمز عبور فعلی", "رمز عبور جدید", "تکرار رمز عبور جدید"].map((label, i) => (
                                    <div key={i}>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                                            {label}
                                        </label>
                                        <input
                                            type="password"
                                            className="w-full max-w-sm px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-700 dark:text-gray-200"
                                        />
                                    </div>
                                ))}
                                <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-lg transition-colors">
                                    تغییر رمز عبور
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "appearance" && (
                        <div className="space-y-5">
                            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 pb-3">
                                تنظیمات ظاهری
                            </h2>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">حالت تاریک</p>
                                    <p className="text-xs text-gray-400 mt-0.5">تغییر تم رابط کاربری</p>
                                </div>
                                <button
                                    onClick={() => setDarkMode(!darkMode)}
                                    className={`relative w-10 h-5 rounded-full transition-colors ${darkMode ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                                        }`}
                                >
                                    <span
                                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${darkMode ? "right-0.5" : "left-0.5"
                                            }`}
                                    />
                                </button>
                            </div>
                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">رنگ اصلی سیستم</h3>
                                <div className="flex gap-3">
                                    {[
                                        { color: "bg-blue-600", label: "آبی" },
                                        { color: "bg-purple-600", label: "بنفش" },
                                        { color: "bg-green-600", label: "سبز" },
                                        { color: "bg-orange-500", label: "نارنجی" },
                                        { color: "bg-rose-600", label: "قرمز" },
                                    ].map((c) => (
                                        <button
                                            key={c.label}
                                            title={c.label}
                                            className={`w-8 h-8 rounded-full ${c.color} ring-2 ring-offset-2 ring-transparent hover:ring-gray-300 dark:ring-offset-gray-900 transition-all`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "localization" && (
                        <div className="space-y-5">
                            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 pb-3">
                                تنظیمات منطقه‌ای
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { label: "زبان", options: ["فارسی", "English"] },
                                    { label: "تقویم", options: ["شمسی", "میلادی", "قمری"] },
                                    { label: "واحد پول", options: ["تومان", "ریال", "دلار"] },
                                    { label: "منطقه زمانی", options: ["Asia/Tehran"] },
                                ].map((field, i) => (
                                    <div key={i}>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                                            {field.label}
                                        </label>
                                        <select className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-700 dark:text-gray-200">
                                            {field.options.map((opt) => (
                                                <option key={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end pt-2">
                                <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-lg transition-colors">
                                    ذخیره تغییرات
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
