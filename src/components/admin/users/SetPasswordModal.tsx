"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { accountsApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import { toast } from "@/components/notifications/toast";
import { FloatingInput } from "@/components/ui/FloatingField";

interface Props {
    userId: number;
    userName: string;
    onClose: () => void;
}

export default function SetPasswordModal({ userId, userName, onClose }: Props) {
    const [password, setPassword] = useState("");
    const [visible, setVisible] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    // Escape closes unless a request is running
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !busy) onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [busy, onClose]);

    const submit = async () => {
        if (busy) return;
        if (password.length < 8) {
            setError("رمز عبور باید حداقل ۸ کاراکتر باشد");
            return;
        }
        setBusy(true);
        setError("");
        try {
            await accountsApi.users.setPassword(userId, password);
            toast.success("رمز عبور کاربر تغییر کرد");
            onClose();
        } catch (e) {
            setError(apiMessage(e, "تغییر رمز عبور انجام نشد"));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            dir="rtl"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{
                backgroundColor: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(4px)",
            }}
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !busy) onClose();
            }}
        >
            <div className="w-full max-w-lg rounded-[2.5rem] bg-white p-8 shadow-2xl dark:bg-[#111827]">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                        تغییر رمز {userName}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        aria-label="بستن"
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="relative">
                    <FloatingInput
                        id="set-user-password"
                        name="radco-new-user-password"
                        label="رمز جدید (حداقل ۸ کاراکتر)"
                        type={visible ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError("");
                        }}
                        autoComplete="new-password"
                    />
                    <button
                        type="button"
                        onClick={() => setVisible((v) => !v)}
                        aria-label={visible ? "پنهان کردن رمز" : "نمایش رمز"}
                        className="absolute inset-y-0 left-4 my-auto flex h-8 w-8 items-center justify-center text-gray-400 hover:text-gray-600"
                    >
                        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <p className="mt-3 text-[11.5px] text-amber-600">
                    نشست‌های فعلی کاربر تا زمان انقضا معتبر می‌مانند.
                </p>
                {error && (
                    <p
                        role="alert"
                        className="mt-3 rounded-2xl bg-red-50 px-4 py-2.5 text-[11.5px] text-red-600 dark:bg-red-500/10 dark:text-red-400"
                    >
                        {error}
                    </p>
                )}

                <div className="mt-6 flex gap-2">
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => void submit()}
                        className="h-11 flex-1 rounded-2xl bg-indigo-600 text-[12.5px] font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                        {busy ? "در حال ثبت..." : "ثبت رمز جدید"}
                    </button>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={onClose}
                        className="h-11 rounded-2xl bg-gray-100 px-5 text-[12.5px] font-bold text-gray-600 hover:bg-gray-200 disabled:opacity-50 dark:bg-white/10 dark:text-gray-300"
                    >
                        انصراف
                    </button>
                </div>
            </div>
        </div>
    );
}
