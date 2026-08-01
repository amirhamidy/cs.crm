"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Shield, Key, Smartphone, Eye, EyeOff, Check } from "lucide-react";

export default function ProfileSecurityCard() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [mounted, setMounted] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [passForm, setPassForm] = useState({ current: "", next: "", confirm: "" });
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [twoFa, setTwoFa] = useState(true);

    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;

    const handleSave = () => {
        if (!passForm.current || !passForm.next || passForm.next !== passForm.confirm) return;
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            setSaved(true);
            setPassForm({ current: "", next: "", confirm: "" });
            setTimeout(() => setSaved(false), 2500);
        }, 900);
    };

    const inputClass =
        "w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl pr-9 pl-10 py-2.5 text-[13.5px] text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none transition-all duration-200 focus:border-indigo-400 dark:focus:border-indigo-500/60 focus:bg-white dark:focus:bg-white/[0.06]";

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
                    <Shield size={14} className="text-indigo-500" />
                </div>
                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">امنیت حساب</h3>
            </div>

            <div className="p-5 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05]">
                    <div className="flex items-center gap-2.5">
                        <Smartphone size={15} className="text-indigo-500" />
                        <div>
                            <p className="text-[13px] font-bold text-gray-800 dark:text-gray-200">احراز هویت دو مرحله‌ای</p>
                            <p className="text-[11.5px] text-gray-400 dark:text-gray-500 mt-0.5">
                                {twoFa ? "فعال است" : "غیرفعال است"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setTwoFa((v) => !v)}
                        className="relative flex-shrink-0"
                        style={{ width: 40, height: 22 }}
                    >
                        <div
                            className="absolute inset-0 rounded-full transition-colors duration-300"
                            style={{
                                background: twoFa
                                    ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                                    : isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0",
                            }}
                        />
                        <motion.div
                            animate={{ x: twoFa ? 20 : 2 }}
                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                            className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm"
                        />
                    </button>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Key size={13} className="text-gray-400" />
                        <p className="text-[13px] font-bold text-gray-700 dark:text-gray-300">تغییر رمز عبور</p>
                    </div>

                    {[
                        { id: "current", placeholder: "رمز فعلی" },
                        { id: "next", placeholder: "رمز جدید" },
                        { id: "confirm", placeholder: "تکرار رمز جدید" },
                    ].map((f) => (
                        <div key={f.id} className="relative">
                            <Key
                                size={14}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
                            />
                            <input
                                type={showPass ? "text" : "password"}
                                placeholder={f.placeholder}
                                value={passForm[f.id as keyof typeof passForm]}
                                onChange={(e) => setPassForm((p) => ({ ...p, [f.id]: e.target.value }))}
                                className={inputClass}
                            />
                            {f.id === "current" && (
                                <button
                                    type="button"
                                    onClick={() => setShowPass((v) => !v)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            )}
                        </div>
                    ))}

                    <div className="flex items-center justify-between pt-1">
                        <AnimatePresence>
                            {saved && (
                                <motion.div
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -8 }}
                                    className="flex items-center gap-1.5 text-emerald-500 text-[13px] font-semibold"
                                >
                                    <Check size={15} />
                                    رمز عبور تغییر کرد
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            onClick={handleSave}
                            disabled={
                                saving ||
                                !passForm.current ||
                                !passForm.next ||
                                passForm.next !== passForm.confirm
                            }
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
                            style={{
                                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                boxShadow: saving ? "none" : "0 3px 12px rgba(99,102,241,0.3)",
                            }}
                        >
                            {saving ? (
                                <>
                                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    در حال ذخیره...
                                </>
                            ) : (
                                <>
                                    <Key size={13} />
                                    تغییر رمز
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
