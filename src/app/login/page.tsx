"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useLogin } from "@/hooks/useLogin";
import { Notification } from "@/components/Notification";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const { login, loading, error } = useLogin();

    useEffect(() => {
        if (error) {
            setErrorMsg(error);
        }
    }, [error]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        await login(username, password);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
             <AnimatePresence>
                {errorMsg && (
                    <Notification
                        message={errorMsg}
                        type="error"
                        onClose={() => setErrorMsg("")}
                    />
                )}
            </AnimatePresence>

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 w-full max-w-sm">
                <div className="mb-8 text-center">
                    <h1 className="text-xl font-bold text-gray-900">ویز مارکت</h1>
                    <p className="text-sm text-gray-500 mt-1">پنل مدیریت</p>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-4 !text-black">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition-all"
                        placeholder="نام کاربری"
                        required
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition-all"
                        placeholder="رمز عبور"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-black hover:bg-neutral-800 disabled:opacity-50 text-white font-semibold rounded-2xl py-3.5 text-sm transition-all active:scale-[0.98]"
                    >
                        {loading ? "در حال تایید..." : "ورود"}
                    </button>
                </form>
            </div>
        </div>
    );
}
