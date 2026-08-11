"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader, Eye, EyeOff } from "lucide-react";
import { useLogin } from "@/hooks/useLogin";
import { Notification } from "@/components/Notification";
import { FloatingInput } from "@/components/login/login";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const { login, loading, error } = useLogin();

    useEffect(() => {
        if (error) setErrorMsg(error);
    }, [error]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            setErrorMsg("لطفاً همه فیلدها را پر کنید");
            return;
        }
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

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 w-full max-w-sm"
            >
                <form onSubmit={handleLogin} autoComplete="off" className="flex flex-col gap-6">
                    <FloatingInput
                        label="نام کاربری"
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <div className="relative">
                        <FloatingInput
                            label="رمز عبور"
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((p) => !p)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileTap={!loading ? { scale: 0.97 } : {}}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-70 text-white font-bold rounded-full py-3 text-sm transition-all flex items-center justify-center min-h-[44px]"
                    >
                        {loading ? (
                            <Loader size={18} className="animate-spin" />
                        ) : (
                            "ورود"
                        )}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
}
