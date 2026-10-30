"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Loader } from "lucide-react";
import { m } from "framer-motion";
import { customerPortalApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import { toast } from "@/components/notifications/toast";
import { FloatingInput } from "@/components/ui/FloatingField";
import { ModalShell } from "@/components/ui/ModalShell";

interface SetPortalPasswordModalProps {
    accountId: number;
    onClose: () => void;
    onGenerated: (password: string) => void;
}

export default function SetPortalPasswordModal({
    accountId,
    onClose,
    onGenerated,
}: SetPortalPasswordModalProps) {
    const [password, setPassword] = useState("");
    const [visible, setVisible] = useState(false);
    const [random, setRandom] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!random && !password.trim()) {
            setError("رمز عبور را وارد کنید یا ساخت رمز تصادفی را فعال کنید");
            return;
        }
        setBusy(true);
        setError("");
        try {
            const result = await customerPortalApi.accounts.setPassword(
                accountId,
                random ? undefined : password,
            );
            if (result.generated_password) {
                onGenerated(result.generated_password);
            } else {
                toast.success("رمز عبور تغییر کرد");
                onClose();
            }
        } catch (err) {
            setError(apiMessage(err, "تغییر رمز انجام نشد"));
        } finally {
            setBusy(false);
        }
    };

    return (
        <ModalShell
            open
            onClose={onClose}
            busy={busy}
            title="تغییر رمز پرتال"
            subtitle="رمز جدید برای ورود مشتری"
            icon={<KeyRound size={18} />}
            maxWidth="max-w-md"
        >
            <form autoComplete="off" onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
                <label className="flex items-center gap-2 text-[11.5px] text-gray-600 dark:text-gray-300">
                    <input
                        type="checkbox"
                        checked={random}
                        onChange={(e) => setRandom(e.target.checked)}
                    />
                    ساخت رمز تصادفی توسط سرور
                </label>

                {!random && (
                    <div className="relative">
                        <FloatingInput
                            id="portal-new-password"
                            label="رمز جدید"
                            type={visible ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            className="pl-12"
                        />
                        <button
                            type="button"
                            onClick={() => setVisible(!visible)}
                            aria-label="نمایش رمز"
                            className="absolute inset-y-0 left-4 my-auto flex h-8 w-8 items-center justify-center text-gray-400"
                        >
                            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                    </div>
                )}

                {error && (
                    <p role="alert" className="rounded-2xl bg-red-50 p-3 text-[11.5px] text-red-600 dark:bg-red-500/10 dark:text-red-300">
                        {error}
                    </p>
                )}

                <m.button
                    type="submit"
                    disabled={busy}
                    whileTap={{ scale: 0.97 }}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                >
                    {busy ? <Loader size={18} className="animate-spin" /> : "ثبت رمز جدید"}
                </m.button>
            </form>
        </ModalShell>
    );
}
