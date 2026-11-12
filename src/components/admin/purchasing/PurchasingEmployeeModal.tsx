"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Loader2, Search, UserPlus, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiPurchasingEmployee } from "@/types/purchasing";

interface EmployeeItem {
    id: number;
    full_name?: string;
    username?: string;
}

interface Props {
    open: boolean;
    existingEmployees: ApiPurchasingEmployee[];
    onClose: () => void;
    onSaved: () => void;
}

const G = [
    "from-indigo-500 to-violet-500",
    "from-pink-500 to-fuchsia-500",
    "from-cyan-500 to-blue-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
];

const normalizeList = <T,>(value: unknown): T[] =>
    Array.isArray(value) ? (value as T[]) : ((value as { results?: T[] } | null)?.results ?? []);

export default function PurchasingEmployeeModal({ open, existingEmployees, onClose, onSaved }: Props) {
    const [employees, setEmployees] = useState<EmployeeItem[]>([]);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<number | null>(null);
    const [fetching, setFetching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;
        let mounted = true;
        setSearch("");
        setSelected(null);
        setError("");
        setFetching(true);
        axiosInstance
            .get("/accounts/api/v1/employee/list/")
            .then((res) => {
                if (!mounted) return;
                const existing = new Set(existingEmployees.map((x) => x.employee));
                setEmployees(normalizeList<EmployeeItem>(res.data).filter((x) => !existing.has(x.id)));
            })
            .catch(() => mounted && setError("دریافت لیست کارکنان انجام نشد."))
            .finally(() => mounted && setFetching(false));
        return () => {
            mounted = false;
        };
    }, [open, existingEmployees]);

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        return q ? employees.filter((e) => (e.full_name || "").toLowerCase().includes(q) || (e.username || "").toLowerCase().includes(q)) : employees;
    }, [employees, search]);

    const close = () => !loading && onClose();

    const submit = async () => {
        if (!selected) return setError("یک کارمند انتخاب کنید.");
        setLoading(true);
        setError("");
        try {
            await axiosInstance.post("/purchasing/api/v1/employees/create/", { employee: selected, is_active: true });
            onSaved();
            onClose();
        } catch (err: unknown) {
            const data = (err as { response?: { data?: { detail?: string; message?: string; employee?: string[] | string } } }).response?.data;
            const emp = Array.isArray(data?.employee) ? data?.employee[0] : data?.employee;
            setError(emp || data?.detail || data?.message || "افزودن کارمند انجام نشد.");
        } finally {
            setLoading(false);
        }
    };

    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[999] flex items-center justify-center px-4"
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
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
                                    <UserPlus size={15} className="text-indigo-500" />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">افزودن عضو خرید</h3>
                                    <p className="mt-0.5 text-[11px] text-gray-400">کارمند موردنظر را به تیم اضافه کنید</p>
                                </div>
                            </div>
                            <button type="button" onClick={close} disabled={loading} className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300">
                                <X size={15} />
                            </button>
                        </div>

                        <div className="flex min-h-0 flex-1 flex-col gap-3 px-8 pb-2">
                            <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-3.5 py-3 transition-colors focus-within:border-indigo-500 dark:border-white/[0.06] dark:bg-white/[0.03]">
                                <Search size={13} className="shrink-0 text-gray-400" />
                                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی نام یا نام کاربری..." className="w-full bg-transparent text-[12px] font-semibold text-gray-900 outline-none placeholder:text-gray-400 dark:text-white" />
                            </div>

                            <div className="max-h-[280px] space-y-1.5 overflow-y-auto">
                                {fetching ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 size={18} className="animate-spin text-indigo-500" />
                                    </div>
                                ) : visible.length === 0 ? (
                                    <p className="py-8 text-center text-[11px] text-gray-400">
                                        {employees.length === 0 ? "همه کارمندان قبلاً به تیم اضافه شده‌اند" : "کارمندی یافت نشد"}
                                    </p>
                                ) : (
                                    visible.map((e, i) => {
                                        const active = selected === e.id;
                                        const name = e.full_name || e.username || `کارمند ${e.id}`;
                                        return (
                                            <motion.button
                                                key={e.id}
                                                type="button"
                                                initial={{ opacity: 0, x: 6 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: Math.min(i, 8) * 0.02 }}
                                                onClick={() => {
                                                    setSelected(e.id);
                                                    setError("");
                                                }}
                                                className={`flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-right transition-colors ${active ? "bg-indigo-50 dark:bg-indigo-500/10" : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"}`}
                                            >
                                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${G[e.id % G.length]} text-[12px] font-extrabold text-white`}>
                                                    {name.trim().charAt(0)}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className={`block truncate text-[12.5px] font-bold ${active ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>{name}</span>
                                                    {e.username && (
                                                        <span className="mt-0.5 block text-[10px] text-gray-400" dir="ltr">
                                                            @{e.username}
                                                        </span>
                                                    )}
                                                </span>
                                                {active && (
                                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600">
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
                            <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={submit} disabled={loading || fetching || !selected} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-indigo-600 text-[13px] font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40">
                                {loading ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={14} />}
                                افزودن به تیم
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}