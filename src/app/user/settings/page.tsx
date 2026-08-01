"use client"

import { useState } from "react"
import { Settings, User, Bell, Lock, Palette, Globe, Save, Shield, Eye, EyeOff } from "lucide-react"

type TabKey = "profile" | "notifications" | "security" | "appearance" | "regional"

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "profile", label: "پروفایل", icon: User },
    { key: "notifications", label: "اعلان‌ها", icon: Bell },
    { key: "security", label: "امنیت", icon: Lock },
    { key: "appearance", label: "ظاهر", icon: Palette },
    { key: "regional", label: "منطقه‌ای", icon: Globe },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-blue-500" : "bg-zinc-700"}`}
        >
            <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${checked ? "right-0.5" : "left-0.5"
                    }`}
            />
        </button>
    )
}

function SettingRow({
    label,
    description,
    children,
}: {
    label: string
    description?: string
    children: React.ReactNode
}) {
    return (
        <div className="flex items-center justify-between py-4 border-b border-zinc-800 last:border-0">
            <div>
                <p className="text-sm text-white">{label}</p>
                {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
            </div>
            {children}
        </div>
    )
}

const sessionHistory = [
    { id: 1, device: "Chrome /ویندوز", ip: "192.168.1.10", date: "۱۴۰۵/۰۵/۰۸", active: true },
    { id: 2, device: "Firefox / اندروید", ip: "10.0.0.5", date: "۱۴۰۵/۰۵/۰۶", active: false },
    { id: 3, device: "Safari / iOS", ip: "172.16.0.2", date: "۱۴۰۵/۰۵/۰۳", active: false },
]

export default function UserSettingsPage() {
    const [activeTab, setActiveTab] = useState<TabKey>("profile")
    const [showPassword, setShowPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)

    const [profile, setProfile] = useState({
        name: "علی رضایی",
        email: "ali@example.com",
        phone: "09123456789",
        role: "کارمند",
        bio: "",
    })

    const [passwords, setPasswords] = useState({
        current: "",
        newPass: "",
        confirm: "",
    })

    const [notifications, setNotifications] = useState({
        email: true,
        push: false,
        sms: true,
        weeklyReport: true,
        processUpdate: true,
        taskReminder: false,
    })

    const [security, setSecurity] = useState({
        twoFactor: false,
        sessionLog: true,
    })

    const [appearance, setAppearance] = useState({
        darkMode: true,
        compactView: false,
        animations: true,
        sidebarCollapsed: false,
    })

    const [regional, setRegional] = useState({
        language: "fa",
        timezone: "Asia/Tehran",
        calendar: "jalali", dateFormat: "YYYY/MM/DD",
    })

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-zinc-800">
                    <Settings size={22} className="text-zinc-300" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white">تنظیمات</h1>
                    <p className="text-sm text-zinc-400">مدیریت حساب کاربری وترجیحات</p>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {tabs.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-colors ${activeTab === key
                                ? "bg-blue-500 text-white"
                                : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600"
                            }`}
                    >
                        <Icon size={15} />
                        {label}
                    </button>
                ))}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                {activeTab === "profile" && (
                    <div className="space-y-5">
                        <div className="flex items-center gap-4 pb-5 border-b border-zinc-800">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center text-2xl font-bold text-blue-400">
                                {profile.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-white font-medium">{profile.name}</p>
                                <p className="text-sm text-zinc-500">{profile.role}</p>
                            </div>
                            <button className="mr-auto text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-2 rounded-xl transition-colors">
                                تغییر تصویر
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: "نام و نام خانوادگی", key: "name", type: "text" },
                                { label: "ایمیل", key: "email", type: "email" },
                                { label: "شماره موبایل", key: "phone", type: "tel" },
                                { label: "نقش", key: "role", type: "text" },
                            ].map((field) => (
                                <div key={field.key} className="space-y-1.5">
                                    <label className="text-xs text-zinc-500">{field.label}</label>
                                    <input
                                        type={field.type}
                                        value={profile[field.key as keyof typeof profile]}
                                        onChange={(e) =>
                                            setProfile((prev) => ({ ...prev, [field.key]: e.target.value }))
                                        }
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs text-zinc-500">بیوگرافی</label>
                            <textarea
                                rows={3}
                                value={profile.bio}
                                onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                                placeholder="چند خط درباره خودت بنویس..."
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                            />
                        </div>

                        <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2.5 rounded-xl transition-colors">
                            <Save size={15} />
                            ذخیره تغییرات
                        </button>
                    </div>
                )}

                {activeTab === "notifications" && (
                    <div>
                        <p className="text-xs text-zinc-500 mb-4">کانال‌های دریافت اعلان</p>
                        <SettingRow label="اعلان ایمیل" description="دریافت ایمیل برای رویدادهای مهم">
                            <Toggle
                                checked={notifications.email}
                                onChange={() => setNotifications((p) => ({ ...p, email: !p.email }))}
                            />
                        </SettingRow>
                        <SettingRow label="پوش نوتیفیکیشن" description="اعلان‌های مرورگر">
                            <Toggle
                                checked={notifications.push}
                                onChange={() => setNotifications((p) => ({ ...p, push: !p.push }))}
                            />
                        </SettingRow>
                        <SettingRow label="پیامک" description="دریافت پیامک برای موارد حیاتی">
                            <Toggle
                                checked={notifications.sms}
                                onChange={() => setNotifications((p) => ({ ...p, sms: !p.sms }))}
                            />
                        </SettingRow>
                        <p className="text-xs text-zinc-500 mb-1mt-5">نوع اعلان‌ها</p>
                        <SettingRow label="گزارش هفتگی" description="خلاصه فعالیت‌های هفته">
                            <Toggle
                                checked={notifications.weeklyReport}
                                onChange={() => setNotifications((p) => ({ ...p, weeklyReport: !p.weeklyReport }))}
                            />
                        </SettingRow>
                        <SettingRow label="به‌روزرسانی فرآیندها" description="اطلاع از تغییر وضعیت فرآیندها">
                            <Toggle
                                checked={notifications.processUpdate}
                                onChange={() => setNotifications((p) => ({ ...p, processUpdate: !p.processUpdate }))}
                            />
                        </SettingRow>
                        <SettingRow label="یادآور وظایف" description="یادآوری قبل از موعد مقرر وظایف">
                            <Toggle
                                checked={notifications.taskReminder}
                                onChange={() => setNotifications((p) => ({ ...p, taskReminder: !p.taskReminder }))}
                            />
                        </SettingRow>
                    </div>
                )}

                {activeTab === "security" && (
                    <div className="space-y-5">
                        <div>
                            <p className="text-xs text-zinc-500 mb-3">تنظیمات امنیتی</p>
                            <SettingRow
                                label="احراز هویت دو مرحله‌ای"
                                description="لایه امنیتی اضافه برای ورود"
                            >
                                <Toggle
                                    checked={security.twoFactor}
                                    onChange={() => setSecurity((p) => ({ ...p, twoFactor: !p.twoFactor }))}
                                />
                            </SettingRow>
                            <SettingRow
                                label="ثبت تاریخچه نشست‌ها"
                                description="ذخیره اطلاعات ورودهای اخیر"
                            >
                                <Toggle
                                    checked={security.sessionLog}
                                    onChange={() => setSecurity((p) => ({ ...p, sessionLog: !p.sessionLog }))}
                                />
                            </SettingRow>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-zinc-800">
                            <p className="text-xs text-zinc-500">تغییر رمز عبور</p>
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs text-zinc-500">رمز فعلی</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={passwords.current}
                                            onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors pl-10"
                                        />
                                        <button
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-zinc-500">رمز جدید</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            value={passwords.newPass}
                                            onChange={(e) => setPasswords((p) => ({ ...p, newPass: e.target.value }))}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors pl-10"
                                        />
                                        <button
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                        >
                                            {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div><div className="space-y-1.5">
                                    <label className="text-xs text-zinc-500">تکرار رمز جدید</label>
                                    <input
                                        type="password"
                                        value={passwords.confirm}
                                        onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>
                            <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2.5 rounded-xl transition-colors">
                                <Shield size={15} />
                                به‌روزرسانی رمز
                            </button>
                        </div>

                        <div className="space-y-3pt-4 border-t border-zinc-800">
                            <p className="text-xs text-zinc-500">نشست‌های فعال</p>
                            {sessionHistory.map((session) => (
                                <div
                                    key={session.id}
                                    className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-3"
                                >
                                    <div>
                                        <p className="text-sm text-white">{session.device}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            {session.ip} · {session.date}
                                        </p>
                                    </div>
                                    {session.active ? (
                                        <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">
                                            فعال
                                        </span>
                                    ) : (
                                        <button className="text-xs text-red-400 hover:text-red-300 transition-colors">
                                            پایان نشست
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "appearance" && (
                    <div>
                        <p className="text-xs text-zinc-500 mb-3">تنظیمات ظاهری</p>
                        <SettingRow label="حالت تاریک" description="نمایش رابط با پس‌زمینه تیره">
                            <Toggle
                                checked={appearance.darkMode}
                                onChange={() => setAppearance((p) => ({ ...p, darkMode: !p.darkMode }))}
                            />
                        </SettingRow>
                        <SettingRow label="نمایش فشرده" description="کاهش فاصله‌های عناصر رابط">
                            <Toggle
                                checked={appearance.compactView}
                                onChange={() => setAppearance((p) => ({ ...p, compactView: !p.compactView }))}
                            />
                        </SettingRow>
                        <SettingRow label="انیمیشن‌ها" description="فعال‌سازی ترنزیشن‌ها و افکت‌ها">
                            <Toggle
                                checked={appearance.animations}
                                onChange={() => setAppearance((p) => ({ ...p, animations: !p.animations }))}
                            />
                        </SettingRow>
                        <SettingRow label="سایدبار جمع‌شونده" description="نمایش آیکون‌محور سایدبار در حالت پیش‌فرض">
                            <Toggle
                                checked={appearance.sidebarCollapsed}
                                onChange={() => setAppearance((p) => ({ ...p, sidebarCollapsed: !p.sidebarCollapsed }))}
                            />
                        </SettingRow>

                        <div className="mt-5 pt-5 border-t border-zinc-800 space-y-3">
                            <p className="text-xs text-zinc-500">رنگ اصلی</p>
                            <div className="flex gap-3">
                                {[
                                    { color: "bg-blue-500", label: "آبی" },
                                    { color: "bg-purple-500", label: "بنفش" },
                                    { color: "bg-emerald-500", label: "سبز" },
                                    { color: "bg-orange-500", label: "نارنجی" },
                                    { color: "bg-rose-500", label: "قرمز" },
                                ].map((item) => (
                                    <button
                                        key={item.label}
                                        title={item.label}
                                        className={`w-8 h-8 rounded-full ${item.color} ring-2 ring-offset-2 ring-offset-zinc-900 ${item.color === "bg-blue-500" ? "ring-blue-500" : "ring-transparent"
                                            } hover:scale-110 transition-transform`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "regional" && (
                    <div className="space-y-5">
                        <p className="text-xs text-zinc-500">تنظیمات زبان و منطقه</p>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs text-zinc-500">زبان رابط</label>
                                <select
                                    value={regional.language}
                                    onChange={(e) => setRegional((p) => ({ ...p, language: e.target.value }))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                                >
                                    <option value="fa">فارسی</option>
                                    <option value="en">English</option>
                                    <option value="ar">العربية</option></select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs text-zinc-500">منطقه زمانی</label>
                                <select
                                    value={regional.timezone}
                                    onChange={(e) => setRegional((p) => ({ ...p, timezone: e.target.value }))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                                >
                                    <option value="Asia/Tehran">تهران (UTC+3:30)</option>
                                    <option value="UTC">UTC (UTC+0)</option>
                                    <option value="Europe/London">لندن (UTC+1)</option>
                                    <option value="America/New_York">نیویورک (UTC-5)</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs text-zinc-500">نوع تقویم</label>
                                <select
                                    value={regional.calendar}
                                    onChange={(e) => setRegional((p) => ({ ...p, calendar: e.target.value }))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                                >
                                    <option value="jalali">شمسی (جلالی)</option>
                                    <option value="gregorian">میلادی (گرگوری)</option>
                                    <option value="hijri">قمری (هجری)</option></select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs text-zinc-500">فرمت تاریخ</label>
                                <select
                                    value={regional.dateFormat}
                                    onChange={(e) => setRegional((p) => ({ ...p, dateFormat: e.target.value }))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                                >
                                    <option value="YYYY/MM/DD">۱۴۰۵/۰۵/۰۸</option>
                                    <option value="DD/MM/YYYY">۰۸/۰۵/۱۴۰۵</option>
                                    <option value="MM-DD-YYYY">۰۵-۰۸-۱۴۰۵</option>
                                </select>
                            </div>
                        </div>

                        <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2.5 rounded-xl transition-colors">
                            <Save size={15} />
                            ذخیره تنظیمات
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
