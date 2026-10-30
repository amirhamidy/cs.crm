"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLogin } from "@/hooks/useLogin";
import { useLogout } from "@/hooks/useLogout";
import { usePortalLogin } from "@/hooks/usePortalLogin";
import { FloatingInput } from "@/components/login/login";

type LoginMode = "staff" | "customer";

interface LoginClientProps {
    initialMode?: LoginMode;
}

export default function LoginClient({ initialMode = "staff" }: LoginClientProps) {
    const [mode, setMode] = useState<LoginMode>(initialMode);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [typedSlogan, setTypedSlogan] = useState("");

    const router = useRouter();
    const { login: staffLogin, loading: staffLoading, error: staffError } = useLogin();
    const { login: customerLogin, loading: customerLoading } = usePortalLogin();
    const { silentLogout } = useLogout();
    const loading = mode === "staff" ? staffLoading : customerLoading;

    useEffect(() => {
        if (staffError && mode === "staff") setErrorMsg(staffError);
    }, [staffError, mode]);

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

    const changeMode = (nextMode: LoginMode) => {
        if (nextMode === mode) return;
        setMode(nextMode);
        setErrorMsg("");
        setUsername("");
        setPassword("");
        setShowPassword(false);
    };

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMsg("");

        if (!username.trim() || !password) {
            setErrorMsg("لطفاً نام کاربری و رمز عبور را وارد کنید");
            return;
        }

        if (mode === "customer") {
            const result = await customerLogin(username.trim(), password);
            if (result.ok) router.replace("/portal/products/");
            else setErrorMsg(result.message);
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
                            {mode === "customer" ? "سامانه ثبت و پیگیری سفارش مشتریان" : "ورود به سامانه مدیریت رادکو"}
                        </span>
                    </div>
                    <Image src="/radco.png" alt="رادکو" width={100} height={100} priority className="rounded-xl object-cover" />
                </div>

                <div role="tablist" aria-label="نوع ورود" className="mb-6 grid grid-cols-2 rounded-2xl bg-gray-100 p-1">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === "staff"}
                        onClick={() => changeMode("staff")}
                        className={`min-h-10 rounded-xl px-3 text-xs font-bold transition-all ${mode === "staff" ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200" : "text-gray-500 hover:text-gray-800"}`}
                    >
                        کارکنان و ادمین
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === "customer"}
                        onClick={() => changeMode("customer")}
                        className={`min-h-10 rounded-xl px-3 text-xs font-bold transition-all ${mode === "customer" ? "bg-white text-indigo-700 shadow-sm ring-1 ring-gray-200" : "text-gray-500 hover:text-gray-800"}`}
                    >
                        مشتریان
                    </button>
                </div>

                <form onSubmit={handleLogin} autoComplete="off" className="flex flex-col gap-5">
                    <FloatingInput
                        label="نام کاربری"
                        id={`${mode}-username`}
                        type="text"
                        autoComplete="new-password" name={`radco-${mode}-username`}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <div className="relative">
                        <FloatingInput
                            label="رمز عبور"
                            id={`${mode}-password`}
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password" name={`radco-${mode}-password`}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute left-3 top-1/2 flex size-8 -trangray-y-1/2 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
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
                        className={`flex min-h-11 items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${mode === "customer" ? "bg-indigo-600 hover:bg-indigo-500" : "bg-blue-600 hover:bg-blue-500"}`}
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" aria-label="در حال ورود" /> : null}
                        {loading ? "در حال ورود..." : mode === "customer" ? "ورود به پرتال مشتریان" : "ورود به پنل"}
                    </m.button>
                </form>

                <p className="mt-6 text-center text-[11px] leading-5 text-gray-400">
                    {mode === "customer"
                        ? "اطلاعات ورود پرتال را از واحد فروش یا مدیر حساب خود دریافت کنید."
                        : "ورود ویژه کاربران و مدیران سامانه رادکو"}
                </p>
            </m.div>
        </div>
    );
}
