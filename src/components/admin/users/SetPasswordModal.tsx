"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { accountsApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import { toast } from "@/components/notifications/toast";
import { FloatingInput } from "@/components/ui/FloatingField";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface Props {
    open: boolean;
    userId: number;
    userName: string;
    onClose: () => void;
}

export default function SetPasswordModal({ open, userId, userName, onClose }: Props) {
    const [password, setPassword] = useState("");
    const [visible, setVisible] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

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
        <Modal
            open={open}
            onClose={onClose}
            busy={busy}
            title={`تغییر رمز ${userName}`}
            subtitle="رمز جدید برای این کاربر"
            icon={<KeyRound size={18} />}
            maxWidth="max-w-lg"
            footer={
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="primary"
                        disabled={busy}
                        loading={busy}
                        onClick={() => void submit()}
                        fullWidth
                    >
                        ثبت رمز جدید
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={busy}
                        onClick={onClose}
                    >
                        انصراف
                    </Button>
                </div>
            }
        >
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
                    className="absolute inset-y-0 left-4 my-auto flex h-11 w-11 items-center justify-center text-gray-400 hover:text-gray-600 md:h-8 md:w-8"
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
        </Modal>
    );
}
