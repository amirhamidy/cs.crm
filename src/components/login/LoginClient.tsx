"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useLogin } from "@/hooks/useLogin";
import { useLogout } from "@/hooks/useLogout";
import { FloatingInput } from "@/components/login/login";

import { BusyContent } from "@/components/ui/Button";
export default function LoginClient() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [typedSlogan, setTypedSlogan] = useState("");

    const { login: staffLogin, loading, error: staffError } = useLogin();
    const { silentLogout } = useLogout();

    useEffect(() => {
        if (staffError) setErrorMsg(staffError);
    }, [staffError]);

    useEffect(() => {
        const slogan = "رادکو، سکان کسب‌وکار تو";
        let index = 0;
        setTypedSlogan("");
        const interval = window.setInterval(() => {
            index += 1;
            setTypedSlogan(slogan.slice(0, index));
            if (index >= slogan.length) window.clearInterval(interval);
        }, 70);
        return () => window.clearInterval(interval);
    }, []);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMsg("");

        if (!username.trim() || !password) {
            setErrorMsg("لطفاً نام کاربری و رمز عبور را وارد کنید");
            return;
        }

        await silentLogout();
        await staffLogin(username.trim(), password);
    };

    return (
        <div dir="rtl" className="flex min-h-screen items-center justify-center p-4">
            <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full max-w-sm rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm"
            >
                <div className="mb-8 flex items-center justify-between gap-3 p-2">
                    <div>
                        <p className="text-sm font-bold text-gray-800">{typedSlogan}</p>
                        <span className="mt-1 block h-4 text-[11px] text-gray-400">
                            ورود به سامانه مدیریت رادکو
                        </span>
                    </div>
                    <Image src="/radco.png" alt="رادکو" width={100} height={100} priority className="rounded-xl object-cover" />
                </div>

                <form onSubmit={handleLogin} autoComplete="off" className="flex flex-col gap-5">
                    <FloatingInput
                        label="نام کاربری"
                        id="staff-username"
                        type="text"
                        autoComplete="new-password" name="radco-staff-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <div className="relative">
                        <FloatingInput
                            label="رمز عبور"
                            id="staff-password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password" name="radco-staff-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute inset-y-0 left-3 my-auto flex size-8 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                            aria-label={showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    {errorMsg && (
                        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-6 text-rose-700">
                            {errorMsg}
                        </p>
                    )}

                    <m.button
                        type="submit"
                        disabled={loading}
                        whileTap={loading ? undefined : { scale: 0.98 }}
                        className="relative flex min-h-11 items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <BusyContent busy={loading}>
                            ورود به پنل
                        </BusyContent>
                    </m.button>
                </form>

                <p className="mt-6 text-center text-[11px] leading-5 text-gray-400">
                    ورود ویژه کاربران و مدیران سامانه رادکو
                </p>
            </m.div>
        </div>
    );
}
