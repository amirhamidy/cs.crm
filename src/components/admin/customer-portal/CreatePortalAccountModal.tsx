"use client";

import { useState } from "react";
import { Loader, UserPlus } from "lucide-react";
import { m } from "framer-motion";
import AsyncSelect, { type AsyncOption } from "@/components/ui/AsyncSelect";
import { customersApi, customerPortalApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import { FloatingInput } from "@/components/ui/FloatingField";
import { ModalShell } from "@/components/ui/ModalShell";
import type { Customer } from "@/types/customer";
import type { CreatePortalAccountResponse } from "@/types/portal";

interface CreatePortalAccountModalProps {
    onClose: () => void;
    onCreated: (r: CreatePortalAccountResponse) => void;
    initialCustomer?: Customer;
}

export default function CreatePortalAccountModal({
    onClose,
    onCreated,
    initialCustomer,
}: CreatePortalAccountModalProps) {
    const [customer, setCustomer] = useState<AsyncOption | null>(
        initialCustomer
            ? {
                  id: initialCustomer.id,
                  label: initialCustomer.full_name,
                  sub: initialCustomer.company_name,
              }
            : null,
    );
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [random, setRandom] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer) {
            setError("مشتری را انتخاب کنید");
            return;
        }
        if (!username.trim()) {
            setError("نام کاربری را وارد کنید");
            return;
        }
        if (!random && !password.trim()) {
            setError("رمز عبور را وارد کنید یا ساخت رمز تصادفی را فعال کنید");
            return;
        }
        setBusy(true);
        setError("");
        try {
            const result = await customerPortalApi.accounts.create({
                customer: customer.id,
                username: username.trim(),
                ...(random ? {} : { password }),
            });
            onCreated(result);
        } catch (err) {
            setError(apiMessage(err, "ساخت حساب انجام نشد"));
        } finally {
            setBusy(false);
        }
    };

    return (
        <ModalShell
            open
            onClose={onClose}
            busy={busy}
            title="ساخت دسترسی پرتال"
            subtitle="ایجاد حساب ورود برای مشتری"
            icon={<UserPlus size={18} />}
        >
            <form autoComplete="off" onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
                <AsyncSelect<Customer>
                    label="مشتری"
                    placeholder="جستجوی مشتری..."
                    emptyText="مشتری پیدا نشد"
                    value={customer?.id ?? null}
                    selected={customer}
                    fetcher={(params, signal) => customersApi.page(params, signal)}
                    toOption={(c) => ({ id: c.id, label: c.full_name, sub: c.company_name })}
                    onChange={setCustomer}
                />

                <FloatingInput
                    id="portal-username"
                    label="نام کاربری (مثلاً ali.rezaei)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="off"
                />

                <label className="flex items-center gap-2 text-[11.5px] text-gray-600 dark:text-gray-300">
                    <input
                        type="checkbox"
                        checked={random}
                        onChange={(e) => setRandom(e.target.checked)}
                    />
                    ساخت رمز تصادفی توسط سرور
                </label>

                {!random && (
                    <FloatingInput
                        id="portal-password"
                        label="رمز عبور"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                    />
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
                    {busy ? <Loader size={18} className="animate-spin" /> : "ساخت حساب پرتال"}
                </m.button>
            </form>
        </ModalShell>
    );
}
