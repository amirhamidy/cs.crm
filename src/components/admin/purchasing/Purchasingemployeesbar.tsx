"use client";

import { motion } from "framer-motion";
import { Plus, Power, Trash2, Users } from "lucide-react";
import { toPersianDigits } from "@/lib/jalali";
import type { ApiPurchasingEmployee } from "@/types/purchasing";
import { usePurchasingAccess } from "@/hooks/usePurchasingAccess";

interface Props {
    employees: ApiPurchasingEmployee[];
    canManage: boolean;
    onAdd: () => void;
    onToggleActive: (employee: ApiPurchasingEmployee) => void;
    onDelete: (employee: ApiPurchasingEmployee) => void;
}

const G = [
    "from-indigo-500 to-violet-500",
    "from-pink-500 to-fuchsia-500",
    "from-cyan-500 to-blue-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
];

export default function PurchasingEmployeesBar({ employees, canManage, onAdd, onToggleActive, onDelete }: Props) {
    const { currentEmployeeId } = usePurchasingAccess();

    return (
        <div className="rounded-[1.45rem] border border-gray-100 bg-white p-3 shadow-sm dark:border-white/[0.06] dark:bg-[#111827]" dir="rtl">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
                        <Users size={15} className="text-indigo-500" />
                    </span>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-[13px] font-extrabold text-gray-900 dark:text-white">تیم خرید</h2>
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-50 px-1.5 text-[9.5px] font-extrabold text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                                {toPersianDigits(employees.length)}
                            </span>
                        </div>
                        <p className="mt-0.5 text-[10.5px] font-semibold text-gray-400">اعضای مجاز به مدیریت فرآیند خرید</p>
                    </div>
                </div>

                {canManage && (
                    <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={onAdd} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-indigo-600 px-4 text-[11px] font-extrabold text-white transition hover:bg-indigo-500">
                        <Plus size={13} />
                        افزودن عضو
                    </motion.button>
                )}
            </div>

            {employees.length === 0 ? (
                <div className="mt-3 flex items-center justify-center rounded-xl border border-dashed border-gray-200 py-5 text-[11px] font-semibold text-gray-400 dark:border-white/[0.07]">
                    هنوز عضوی در تیم نیست
                </div>
            ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                    {employees.map((e) => {
                        const active = e.is_active !== false;
                        const self = currentEmployeeId !== null && e.employee === currentEmployeeId;
                        return (
                            <div key={e.id} className={`flex items-center gap-2 rounded-xl bg-gray-50 py-1.5 pl-2 pr-1.5 dark:bg-white/[0.035] ${active ? "" : "opacity-60"}`}>
                                <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${G[Math.abs(e.employee) % G.length]} text-[12px] font-extrabold text-white`}>
                                    {(e.employee_name || "؟").trim().charAt(0)}
                                    <span className={`absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-gray-50 dark:ring-[#151d2c] ${active ? "bg-emerald-500" : "bg-gray-400"}`} />
                                </span>
                                <div className="min-w-0">
                                    <p className="max-w-[140px] truncate text-[11.5px] font-extrabold text-gray-800 dark:text-white">{e.employee_name}</p>
                                    <p className="text-[9.5px] font-semibold text-gray-400">{self ? "شما" : active ? "فعال" : "غیرفعال"}</p>
                                </div>
                                {canManage && (
                                    <div className="flex shrink-0 items-center gap-0.5">
                                        <button type="button" onClick={() => onToggleActive(e)} title={active ? "غیرفعال‌سازی" : "فعال‌سازی"} className={`flex h-6 w-6 items-center justify-center rounded-lg transition ${active ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]"}`}>
                                            <Power size={11} />
                                        </button>
                                        <button type="button" onClick={() => onDelete(e)} title="حذف از تیم" className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10">
                                            <Trash2 size={11} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}