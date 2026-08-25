"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Loader } from "lucide-react";
import Image from "next/image";
import { useLogin } from "@/hooks/useLogin";
import { Notification } from "@/components/Notification";
import { FloatingInput } from "@/components/login/login";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [typedSlogan, setTypedSlogan] = useState("");

    const { login, loading, error } = useLogin();

    useEffect(() => {
        if (error) {
            setErrorMsg(error);
        }
    }, [error]);

    useEffect(() => {
        const slogan = "رادکو، سکان کسب‌وکار تو";
        let index = 0;

        setTypedSlogan("");

        const interval = window.setInterval(() => {
            index += 1;
            setTypedSlogan(slogan.slice(0, index));

            if (index >= slogan.length) {
                window.clearInterval(interval);
            }
        }, 70);

        return () => window.clearInterval(interval);
    }, []);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMsg("");

        if (!username.trim() || !password.trim()) {
            setErrorMsg("لطفاً همه فیلدها را پر کنید");
            return;
        }

        await login(username.trim(), password);
    };

    return (
        <div
            dir="rtl"
            className="flex min-h-screen items-center justify-center p-4"
        >
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
                className="w-full max-w-sm rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm"
            >
                <div className="mb-8 flex items-center justify-between gap-3 p-2">
                    <p className="text-sm font-bold text-gray-800">
                        {typedSlogan}

                        <span
                            className="mr-1 inline-block h-[18px] w-[2px] animate-pulse bg-gray-900 align-middle"
                            aria-hidden="true"
                        />
                    </p>

                    <Image
                        src="/logo.jpg"
                        alt="رادکو"
                        width={70}
                        height={70}
                        priority
                        className="rounded-xl object-cover"
                    />
                </div>

                <form
                    onSubmit={handleLogin}
                    autoComplete="off"
                    className="flex flex-col gap-6"
                >
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
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute left-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-xl text-gray-400 transition-colors hover:text-gray-600"
                            aria-label={
                                showPassword
                                    ? "مخفی کردن رمز عبور"
                                    : "نمایش رمز عبور"
                            }
                        >
                            {showPassword ? (
                                <EyeOff size={16} />
                            ) : (
                                <Eye size={16} />
                            )}
                        </button>
                    </div>

                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileTap={loading ? undefined : { scale: 0.97 }}
                        className="flex min-h-11 items-center justify-center rounded-full bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {loading ? (
                            <Loader
                                size={18}
                                className="animate-spin"
                                aria-label="در حال ورود"
                            />
                        ) : (
                            "ورود"
                        )}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
}
