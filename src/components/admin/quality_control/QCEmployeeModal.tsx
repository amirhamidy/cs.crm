"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Loader2, Search, UserPlus, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiQualityControlEmployee, ApiUser } from "@/types/quality_control";
import { gradientOf, initialOf } from "./qcUtils";

interface Props {
    isOpen: boolean;
    existingEmployees: ApiQualityControlEmployee[];
    names: Record<string, string>;
    onClose: () => void;
    onCreated: () => void;
}

const getList = (data: unknown): ApiUser[] =>
    Array.isArray(data) ? data : ((data as { results?: ApiUser[]; data?: ApiUser[] } | null)?.results ?? (data as { data?: ApiUser[] } | null)?.data ?? []);

export default function QCEmployeeModal({ isOpen, existingEmployees, names, onClose, onCreated }: Props) {
    const [users, setUsers] = useState<ApiUser[]>([]);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<number | null>(null);
    const [fetching, setFetching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        let mounted = true;
        setSearch("");
        setSelected(null);
        setError("");
        setFetching(true);
        axiosInstance
            .get("/accounts/api/v1/user/list/")
            .then((r) => mounted && setUsers(getList(r.data)))
            .catch(() => mounted && setError("دریافت لیست کاربران انجام نشد"))
            .finally(() => mounted && setFetching(false));
        return () => {
            mounted = false;
        };
    }, [isOpen]);

    const available = useMemo(() => {
        const used = new Set(existingEmployees.map((x) => x.user));
        const q = search.trim().toLowerCase();
        return users.filter(
            (u) =>
                u.is_active &&
                !used.has(u.id) &&
                (!q || u.username.toLowerCase().includes(q) || (names[u.username] || "").toLowerCase().includes(q))
        );
    }, [users, existingEmployees, names, search]);

    const close = () => !loading && onClose();

    async function create() {
        if (!selected) return setError("یک کاربر را انتخاب کنید");
        setLoading(true);
        setError("");
        try {
            await axiosInstance.post("/quality_control/api/v1/employee/create/", { user: selected, is_active: true });
            onCreated();
        } catch (err: unknown) {
            const data = (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data;
            setError(data?.detail || data?.message || "افزودن کارمند انجام نشد");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center px-4"
                    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
                    onMouseDown={close}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.98 }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-2xl shadow-black/10 dark:border-white/[0.06] dark:bg-[#0f172a]"
                        dir="rtl"
                    >
                        <div className="flex shrink-0 items-center justify-between px-8 pb-6 pt-8">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                                    <UserPlus size={15} className="text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-[14px] font-extrabold text-gray-900 dark:text-white">افزودن عضو کنترل کیفی</h2>
                                    <p className="mt-0.5 text-[11px] text-gray-400">کاربر موردنظر را به تیم اضافه کنید</p>
                                </div>
                            </div>
                            <button type="button" onClick={close} disabled={loading} className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300">
                                <X size={15} />
                            </button>
                        </div>

                        <div className="flex min-h-0 flex-1 flex-col gap-3 px-8 pb-2">
                            <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-3.5 py-3 transition-colors focus-within:border-blue-500 dark:border-white/[0.06] dark:bg-white/[0.03]">
                                <Search size={13} className="shrink-0 text-gray-400" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="جستجوی نام یا نام کاربری..."
                                    className="w-full bg-transparent text-[12px] font-semibold text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                                />
                            </div>

                            <div className="max-h-[280px] space-y-1.5 overflow-y-auto">
                                {fetching ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 size={18} className="animate-spin text-blue-500" />
                                    </div>
                                ) : available.length === 0 ? (
                                    <p className="py-8 text-center text-[11px] text-gray-400">کاربری برای افزودن یافت نشد</p>
                                ) : (
                                    available.map((u, i) => {
                                        const active = selected === u.id;
                                        const name = names[u.username] || u.username;
                                        return (
                                            <motion.button
                                                key={u.id}
                                                type="button"
                                                initial={{ opacity: 0, x: 6 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: Math.min(i, 8) * 0.02 }}
                                                onClick={() => {
                                                    setSelected(u.id);
                                                    setError("");
                                                }}
                                                className={`flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-right transition-colors ${active ? "bg-blue-50 dark:bg-blue-500/10" : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"}`}
                                            >
                                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradientOf(u.id)} text-[12px] font-extrabold text-white`}>
                                                    {initialOf(name)}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className={`block truncate text-[12.5px] font-bold ${active ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>{name}</span>
                                                    <span className="mt-0.5 block text-[10px] text-gray-400" dir="ltr">@{u.username}</span>
                                                </span>
                                                {active && (
                                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600">
                                                        <Check size={11} className="text-white" strokeWidth={3} />
                                                    </span>
                                                )}
                                            </motion.button>
                                        );
                                    })
                                )}
                            </div>

                            {error && (
                                <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10">
                                    <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
                                    <p className="text-[11.5px] font-semibold leading-5 text-red-500 dark:text-red-400">{error}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex shrink-0 px-8 pb-8 pt-5">
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.97 }}
                                onClick={create}
                                disabled={loading || !selected}
                                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-blue-600 text-[13px] font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {loading ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={14} />}
                                افزودن به تیم
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}