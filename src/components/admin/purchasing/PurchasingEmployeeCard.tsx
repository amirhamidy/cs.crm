"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Crown, Loader2, Power, Trash2, UserRound, X } from "lucide-react";
import { useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiPurchasingEmployee } from "@/types/purchasing";
import { usePurchasingAccess } from "@/hooks/usePurchasingAccess";

interface Props {
    employee: ApiPurchasingEmployee;
    index: number;
    canManage: boolean;
    onUpdated: () => void;
    onDeleted: () => void;
}

export default function PurchasingEmployeeCard({ employee, index, canManage, onUpdated, onDeleted }: Props) {
    const { currentEmployeeId } = usePurchasingAccess();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const isSelf = currentEmployeeId !== null && employee.employee === currentEmployeeId;

    const handleToggle = async () => {
        setToggling(true);
        setErrorMessage("");
        try {
            await axiosInstance.patch(`/purchasing/api/v1/employees/${employee.id}/patch/`, {
                is_active: !employee.is_active,
            });
            onUpdated();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { detail?: string; message?: string } } };
            setErrorMessage(e?.response?.data?.detail || e?.response?.data?.message || "تغییر وضعیت انجام نشد.");
        } finally {
            setToggling(false);
        }
    };

    const handleRemove = async () => {
        setRemoving(true);
        setErrorMessage("");
        try {
            await axiosInstance.delete(`/purchasing/api/v1/employees/${employee.id}/delete/`);
            setConfirmOpen(false);
            onDeleted();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { detail?: string; message?: string } } };
            setErrorMessage(e?.response?.data?.detail || e?.response?.data?.message || "حذف کارمند انجام نشد.");
        } finally {
            setRemoving(false);
        }
    };

    return (
        <>
            <motion.article
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: Math.min(index, 6) * 0.03 }}
                className="group relative overflow-hidden rounded-[1.8rem] border border-gray-100 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.035)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] dark:border-white/[0.07] dark:bg-[#111a2d] dark:shadow-none"
            >
                <div
                    className="absolute inset-y-0 right-0 w-1"
                    style={{
                        background: employee.is_active
                            ? "linear-gradient(180deg,#6366f1,#8b5cf645)"
                            : "linear-gradient(180deg,#9ca3af,#9ca3af35)",
                    }}
                />

                <div className="flex items-start justify-between gap-3 pl-1">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 dark:bg-indigo-400/10 dark:text-indigo-300">
                            <UserRound size={17} />
                        </div>

                        <div className="min-w-0">
                            <h3 className="truncate text-[12.5px] font-extrabold text-gray-900 dark:text-white">{employee.employee_name}</h3>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <span
                                    className={`rounded-full px-2 py-0.5 text-[9.5px] font-extrabold ${employee.is_active
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "bg-gray-100 text-gray-400 dark:bg-white/[0.06] dark:text-gray-500"
                                        }`}
                                >
                                    {employee.is_active ? "فعال" : "غیرفعال"}
                                </span>
                                {isSelf && (
                                    <span className="flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[9.5px] font-extrabold text-indigo-500 dark:text-indigo-300">
                                        <Crown size={9} />
                                        شما
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {canManage && (
                        <button
                            type="button"
                            onClick={() => setConfirmOpen(true)}
                            disabled={removing}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400 opacity-0 transition-colors group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 disabled:opacity-40 dark:bg-white/[0.05] dark:text-white/40 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>

                <div className="mt-3.5 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]">
                        <p className="text-[9px] font-bold text-gray-400 dark:text-white/35">وضعیت</p>
                        <p className="mt-0.5 text-[10.5px] font-extrabold text-gray-800 dark:text-white/85">
                            {employee.is_active ? "در دسترس" : "غیرفعال"}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]">
                        <p className="text-[9px] font-bold text-gray-400 dark:text-white/35">شناسه</p>
                        <p className="mt-0.5 text-[10.5px] font-extrabold text-gray-800 dark:text-white/85">#{employee.employee}</p>
                    </div>
                </div>

                {errorMessage && (
                    <div className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-[10px] font-bold text-red-500 dark:bg-red-500/10">
                        {errorMessage}
                    </div>
                )}

                {canManage && (
                    <button
                        type="button"
                        onClick={handleToggle}
                        disabled={toggling}
                        className={`mt-3.5 flex w-full items-center justify-between rounded-2xl px-3 py-2.5 transition-all disabled:opacity-50 ${employee.is_active ? "bg-indigo-500/[0.07]" : "bg-gray-100 dark:bg-white/[0.05]"
                            }`}
                    >
                        <span
                            className={`text-[10px] font-bold ${employee.is_active ? "text-indigo-600 dark:text-indigo-300" : "text-gray-400 dark:text-gray-500"
                                }`}
                        >
                            {toggling ? "در حال تغییر..." : employee.is_active ? "دسترسی فعال" : "دسترسی غیرفعال"}
                        </span>

                        <span
                            className={`relative flex h-6 w-11 items-center rounded-full transition-all ${employee.is_active ? "bg-gradient-to-r from-indigo-500 to-violet-500" : "bg-gray-200 dark:bg-white/[0.12]"
                                }`}
                        >
                            <motion.span
                                animate={{ x: employee.is_active ? 0 : -20 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className="absolute right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm"
                            >
                                {toggling ? (
                                    <Loader2 size={9} className="animate-spin text-indigo-500" />
                                ) : employee.is_active ? (
                                    <Check size={9} className="text-indigo-500" />
                                ) : (
                                    <Power size={9} className="text-gray-400" />
                                )}
                            </motion.span>
                        </span>
                    </button>
                )}
            </motion.article>

            <AnimatePresence>
                {confirmOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
                        onClick={() => !removing && setConfirmOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(event) => event.stopPropagation()}
                            dir="rtl"
                            className="w-full max-w-sm rounded-[2rem] border border-gray-100 bg-white p-6 text-right shadow-2xl dark:border-white/[0.08] dark:bg-[#111a2d]"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10">
                                    <Trash2 size={19} />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setConfirmOpen(false)}
                                    disabled={removing}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            <h4 className="mt-4 text-[14px] font-extrabold text-gray-900 dark:text-white">حذف کارمند</h4>
                            <p className="mt-2 text-[11.5px] font-medium leading-6 text-gray-400 dark:text-white/40">
                                آیا از حذف «{employee.employee_name}» از فرآیند خرید مطمئن هستید؟
                            </p>

                            <div className="mt-5 flex gap-2">
                                <button
                                    type="button"
                                    disabled={removing}
                                    onClick={() => setConfirmOpen(false)}
                                    className="flex h-10 flex-1 items-center justify-center rounded-full bg-gray-100 text-[11.5px] font-extrabold text-gray-500 transition-colors hover:bg-gray-200 dark:bg-white/[0.06] dark:text-white/50 dark:hover:bg-white/[0.1]"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="button"
                                    disabled={removing}
                                    onClick={handleRemove}
                                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-red-500 text-[11.5px] font-extrabold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                                >
                                    {removing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    حذف
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}