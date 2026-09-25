"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search, ShieldCheck, UserPlus, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiQualityControlEmployee, ApiUser } from "@/types/quality_control";

interface Props {
    isOpen: boolean;
    users: ApiUser[];
    existingEmployees: ApiQualityControlEmployee[];
    onClose: () => void;
    onCreated: (employee: ApiQualityControlEmployee) => void;
}

export default function QCEmployeeModal({ isOpen, users, existingEmployees, onClose, onCreated }: Props) {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const available = useMemo(() => {
        const used = new Set(existingEmployees.map((x) => x.user));
        const q = search.trim().toLowerCase();
        return users.filter((user) => user.is_active && !used.has(user.id) && (!q || user.username.toLowerCase().includes(q)));
    }, [users, existingEmployees, search]);

    async function create() {
        if (!selected) return setError("یک کاربر را انتخاب کنید");
        setLoading(true);
        setError("");
        try {
            const { data } = await axiosInstance.post<ApiQualityControlEmployee>("/quality_control/api/v1/employee/create/", { user: Number(selected), is_active: true });
            onCreated(data);
            setSelected("");
            setSearch("");
        } catch (err: unknown) {
            const data = (err as { response?: { data?: { detail?: string } } }).response?.data;
            setError(data?.detail || "افزودن کارمند انجام نشد");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !loading && onClose()} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
                    <motion.div onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: .97, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-[500px] rounded-[30px] bg-white p-6 shadow-2xl dark:bg-[#0b1220]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500"><UserPlus size={19} /></div>
                                <div><h2 className="text-sm font-black text-gray-900 dark:text-white">افزودن عضو کنترل کیفی</h2><p className="mt-1 text-[9px] text-gray-400">کاربر موردنظر را به تیم اضافه کنید</p></div>
                            </div>
                            <button onClick={onClose} className="rounded-xl bg-gray-100 p-2 dark:bg-white/[.05]"><X size={16} /></button>
                        </div>

                        <div className="relative mt-5">
                            <Search size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی نام کاربری..." className="h-11 w-full rounded-2xl border border-gray-200 bg-white pr-10 text-[10px] font-bold outline-none focus:border-blue-500 dark:border-white/[.07] dark:bg-white/[.04] dark:text-white" />
                        </div>

                        <div className="mt-3 max-h-[280px] space-y-2 overflow-y-auto">
                            {available.map((user) => (
                                <button key={user.id} onClick={() => setSelected(String(user.id))} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-right transition ${selected === String(user.id) ? "bg-blue-500/10 ring-1 ring-blue-500/20" : "bg-gray-50 dark:bg-white/[.035]"}`}>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500"><ShieldCheck size={15} /></div>
                                    <div className="flex-1"><p className="text-[11px] font-black text-gray-800 dark:text-white">{user.username}</p><p className="mt-0.5 text-[9px] text-gray-400">شناسه کاربر: {user.id}</p></div>
                                </button>
                            ))}
                        </div>

                        {error && <p className="mt-3 text-[10px] font-bold text-red-500">{error}</p>}

                        <button onClick={create} disabled={loading || !selected} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-[11px] font-black text-white disabled:opacity-40">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} افزودن به تیم
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}