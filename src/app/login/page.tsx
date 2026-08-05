"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Loader } from "lucide-react";
import { useLogin } from "@/hooks/useLogin";
import { Notification } from "@/components/Notification";
import { FloatingInput } from "@/components/login/login";

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
        <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
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
                <form onSubmit={handleLogin} autoComplete="off" className="flex flex-col gap-6 !text-black">
                    <FloatingInput
                        label="نام کاربری"
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <FloatingInput
                        label="رمز عبور"
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-4xl py-3 text-sm transition-all active:scale-[0.98] flex items-center justify-center"
                    >
                        {loading ? (
                            <Loader className="animate-spin" size={18} />
                        ) : (
                            "ورود"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}