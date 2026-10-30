"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Plus, Trash2, KeyRound, Power, Loader, UserX } from "lucide-react";
import { customerPortalApi } from "@/lib/api";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import Pagination from "@/components/ui/Pagination";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { FloatingInput } from "@/components/ui/FloatingField";
import CreatePortalAccountModal from "./CreatePortalAccountModal";
import OneTimePasswordModal from "./OneTimePasswordModal";
import SetPortalPasswordModal from "./SetPortalPasswordModal";
import { apiMessage } from "@/lib/apiMessage";
import { toast } from "@/components/notifications/toast";
import type { AdminPortalAccount, CreatePortalAccountResponse } from "@/types/portal";

type ActiveFilter = "all" | "active" | "inactive";

const FILTERS: { id: ActiveFilter; label: string }[] = [
    { id: "all", label: "همه" },
    { id: "active", label: "فعال" },
    { id: "inactive", label: "غیرفعال" },
];

export default function CustomerPortalPage() {
    const [active, setActive] = useState<ActiveFilter>("all");
    const [create, setCreate] = useState(false);
    const [password, setPassword] = useState("");
    const [passwordAccount, setPasswordAccount] = useState<number | null>(null);
    const [toDelete, setToDelete] = useState<AdminPortalAccount | null>(null);
    const [deleteError, setDeleteError] = useState("");
    const [busyId, setBusyId] = useState<number | null>(null);

    const list = usePaginatedList<AdminPortalAccount, { is_active?: boolean }>(
        (params, signal) => customerPortalApi.accounts.page(params, signal),
        { pageSize: 15 },
    );

    const changeFilter = (id: ActiveFilter) => {
        setActive(id);
        list.setFilters({ is_active: id === "all" ? undefined : id === "active" });
    };

    const handleCreated = (r: CreatePortalAccountResponse) => {
        setCreate(false);
        list.refetch();
        if (r.generated_password) setPassword(r.generated_password);
        else toast.success("حساب پرتال ساخته شد");
    };

    const toggle = async (a: AdminPortalAccount) => {
        setBusyId(a.id);
        try {
            await customerPortalApi.accounts.update(a.id, { is_active: !a.is_active });
            toast.success(a.is_active ? "حساب غیرفعال شد" : "حساب فعال شد");
            list.refetch();
        } catch (e) {
            toast.error(apiMessage(e, "تغییر وضعیت انجام نشد"));
        } finally {
            setBusyId(null);
        }
    };

    const remove = async () => {
        if (!toDelete) return;
        setBusyId(toDelete.id);
        setDeleteError("");
        try {
            await customerPortalApi.accounts.remove(toDelete.id);
            toast.success("حساب حذف شد");
            setToDelete(null);
            list.refetch();
        } catch (e) {
            setDeleteError(apiMessage(e, "حذف حساب انجام نشد"));
        } finally {
            setBusyId(null);
        }
    };

    return (
        <section dir="rtl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-[15px] font-black text-gray-900 dark:text-white">حساب‌های پرتال مشتریان</h1>
                    <p className="mt-1 text-[11.5px] text-gray-500 dark:text-gray-400">
                        مدیریت دسترسی مشتریان به ثبت سفارش
                    </p>
                </div>
                <button
                    onClick={() => setCreate(true)}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-[11.5px] font-bold text-white"
                >
                    <Plus size={16} /> ساخت دسترسی
                </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
                <div className="min-w-[220px] flex-1">
                    <FloatingInput
                        id="portal-search"
                        label="جستجوی نام، شرکت، موبایل یا نام کاربری"
                        value={list.search}
                        onChange={(e) => list.setSearch(e.target.value)}
                        autoComplete="off"
                    />
                </div>
                {FILTERS.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => changeFilter(f.id)}
                        className={`rounded-xl px-4 py-2 text-[11.5px] font-bold ${
                            active === f.id
                                ? "bg-indigo-600 text-white"
                                : "bg-white text-gray-500 dark:bg-white/5"
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {list.loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader size={24} className="animate-spin text-indigo-500" />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">در حال دریافت حساب‌ها...</p>
                </div>
            ) : list.error ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                    <p className="text-[12.5px] text-rose-500">خطا در دریافت حساب‌ها</p>
                    <button onClick={list.refetch} className="text-[12.5px] font-bold text-indigo-600 underline">
                        تلاش مجدد
                    </button>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {list.data.length === 0 ? (
                        <m.div
                            key="empty"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="flex flex-col items-center justify-center gap-2 py-16"
                        >
                            <UserX size={28} className="text-gray-300 dark:text-gray-700" />
                            <p className="text-[12.5px] text-gray-500 dark:text-gray-400">حسابی ثبت نشده است</p>
                        </m.div>
                    ) : (
                        <m.div
                            key={`grid-${active}-${list.page}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
                        >
                            {list.data.map((a) => (
                                <AccountCard
                                    key={a.id}
                                    account={a}
                                    busy={busyId === a.id}
                                    onToggle={() => void toggle(a)}
                                    onPassword={() => setPasswordAccount(a.id)}
                                    onDelete={() => {
                                        setDeleteError("");
                                        setToDelete(a);
                                    }}
                                />
                            ))}
                        </m.div>
                    )}
                </AnimatePresence>
            )}

            {!list.loading && list.totalPages > 1 && (
                <div className="mt-6">
                    <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />
                </div>
            )}

            {create && <CreatePortalAccountModal onClose={() => setCreate(false)} onCreated={handleCreated} />}
            {passwordAccount !== null && (
                <SetPortalPasswordModal
                    accountId={passwordAccount}
                    onClose={() => setPasswordAccount(null)}
                    onGenerated={(value) => {
                        setPasswordAccount(null);
                        setPassword(value);
                    }}
                />
            )}
            {password && <OneTimePasswordModal password={password} onClose={() => setPassword("")} />}

            <ConfirmModal
                open={!!toDelete}
                title="حذف حساب پرتال"
                message={`حساب ${toDelete?.username ?? ""} حذف شود؟ این کار قابل بازگشت نیست.`}
                confirmLabel="حذف"
                cancelLabel="انصراف"
                danger
                loading={busyId === toDelete?.id}
                error={deleteError || undefined}
                onConfirm={() => void remove()}
                onClose={() => setToDelete(null)}
            />
        </section>
    );
}

interface AccountCardProps {
    account: AdminPortalAccount;
    busy: boolean;
    onToggle: () => void;
    onPassword: () => void;
    onDelete: () => void;
}

function AccountCard({ account: a, busy, onToggle, onPassword, onDelete }: AccountCardProps) {
    return (
        <article className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-[15px] font-extrabold">{a.customer_name}</h2>
                    <p className="mt-1 text-[11.5px] text-gray-500">{a.company_name}</p>
                </div>
                <span
                    className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${
                        a.is_active
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300"
                    }`}
                >
                    {a.is_active ? "فعال" : "غیرفعال"}
                </span>
            </div>

            <div className="mt-4 space-y-1 text-[11.5px] text-gray-500">
                <p>
                    نام کاربری: <b className="text-gray-800 dark:text-gray-200">{a.username}</b>
                </p>
                <p>موبایل: {a.customer_phone || "—"}</p>
                <p>آخرین ورود: {a.last_login ? new Date(a.last_login).toLocaleString("fa-IR") : "هنوز وارد نشده"}</p>
                <p>ایجادکننده: {a.granted_by_username || "—"}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <button
                    disabled={busy}
                    onClick={onToggle}
                    className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-[11.5px] font-bold disabled:opacity-50 dark:bg-white/10"
                >
                    <Power size={13} />
                    {a.is_active ? "غیرفعال‌سازی" : "فعال‌سازی"}
                </button>
                <button
                    disabled={busy}
                    onClick={onPassword}
                    className="flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-2 text-[11.5px] font-bold text-indigo-700 disabled:opacity-50 dark:bg-indigo-500/10 dark:text-indigo-300"
                >
                    <KeyRound size={13} /> تغییر رمز
                </button>
                <button
                    disabled={busy}
                    onClick={onDelete}
                    className="flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-2 text-[11.5px] font-bold text-rose-600 disabled:opacity-50 dark:bg-rose-500/10"
                >
                    <Trash2 size={13} /> حذف
                </button>
            </div>
        </article>
    );
}
