"use client";

import { useState } from "react";
import { Shield, Check, X } from "lucide-react";

const roles = ["admin", "user"] as const;
type Role = typeof roles[number];

const permissions: { key: string; label: string; section: string }[] = [
    { key: "view_dashboard", label: "مشاهده داشبورد", section: "داشبورد" },
    { key: "view_users", label: "مشاهده کاربران", section: "کاربران" },
    { key: "edit_users", label: "ویرایش کاربران", section: "کاربران" },
    { key: "delete_users", label: "حذف کاربران", section: "کاربران" },
    { key: "view_reports", label: "مشاهده گزارشات", section: "گزارشات" },
    { key: "export_reports", label: "خروجی گزارشات", section: "گزارشات" },
    { key: "manage_access", label: "مدیریت دسترسی‌ها", section: "دسترسی" },
    { key: "view_settings", label: "مشاهده تنظیمات", section: "تنظیمات" },
    { key: "edit_settings", label: "ویرایش تنظیمات", section: "تنظیمات" },
];

const defaultMatrix: Record<Role, Record<string, boolean>> = {
    admin: Object.fromEntries(permissions.map((p) => [p.key, true])),
    user: {
        view_dashboard: true,
        view_users: false,
        edit_users: false,
        delete_users: false,
        view_reports: true,
        export_reports: false,
        manage_access: false,
        view_settings: false,
        edit_settings: false,
    },
};

export default function AccessPage() {
    const [matrix, setMatrix] = useState(defaultMatrix);

    const toggle = (role: Role, key: string) => {
        setMatrix((prev) => ({
            ...prev,
            [role]: { ...prev[role], [key]: !prev[role][key] },
        }));
    };

    const sections = [...new Set(permissions.map((p) => p.section))];

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Shield size={18} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">مدیریت دسترسی‌ها</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">تنظیم سطح دسترسی نقش‌های مختلف</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                                <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400 w-64">دسترسی</th>
                                {roles.map((role) => (
                                    <th key={role} className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400 text-center">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${role === "admin"
                                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                            }`}>
                                            {role === "admin" ? "ادمین" : "کاربر"}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sections.map((section) => (
                                <>
                                    <tr key={`section-${section}`} className="bg-gray-50/30 dark:bg-gray-800/20">
                                        <td colSpan={3} className="px-5 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                            {section}
                                        </td>
                                    </tr>
                                    {permissions
                                        .filter((p) => p.section === section)
                                        .map((perm) => (
                                            <tr key={perm.key} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{perm.label}</td>
                                                {roles.map((role) => (
                                                    <td key={role} className="px-5 py-3 text-center">
                                                        <button
                                                            onClick={() => toggle(role, perm.key)}
                                                            className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${matrix[role][perm.key]
                                                                    ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                                                                    : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                                }`}
                                                        >
                                                            {matrix[role][perm.key] ? <Check size={13} /> : <X size={13} />}
                                                        </button>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end p-4 border-t border-gray-100 dark:border-gray-800">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-lg transition-colors">
                        ذخیره تغییرات
                    </button>
                </div>
            </div>
        </div>
    );
}
