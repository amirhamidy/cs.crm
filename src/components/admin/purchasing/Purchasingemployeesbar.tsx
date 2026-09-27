"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Plus, PowerOff, Power, Trash2, UserRound, Users } from "lucide-react";
import { toPersianDigits } from "@/lib/jalali";
import type { ApiPurchasingEmployee } from "@/types/purchasing";

const GRADIENTS = [
    "from-blue-500 to-indigo-500",
    "from-violet-500 to-fuchsia-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
    "from-cyan-500 to-sky-500",
];

const gradientOf = (seed: number) => GRADIENTS[Math.abs(seed) % GRADIENTS.length];
const initialOf = (text: string) => (text || "").trim().charAt(0) || "؟";

interface Props {
    employees: ApiPurchasingEmployee[];
    canManage: boolean;
    onAdd: () => void;
    onToggleActive: (employee: ApiPurchasingEmployee) => Promise<void> | void;
    onDelete: (employee: ApiPurchasingEmployee) => void;
}

export default function PurchasingEmployeesBar({
    employees,
    canManage,
    onAdd,
    onToggleActive,
    onDelete,
}: Props) {
    const [openId, setOpenId] = useState<number | null>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [togglingId, setTogglingId] = useState<number | null>(null);

    const openPopover = (event: React.MouseEvent<HTMLButtonElement>, id: number) => {
        if (!canManage) return;
        const rect = event.currentTarget.getBoundingClientRect();
        setPosition({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
        setOpenId((current) => (current === id ? null : id));
    };

    const closePopover = () => setOpenId(null);

    const activeEmployee = employees.find((employee) => employee.id === openId) ?? null;

    const handleToggle = async () => {
        if (!activeEmployee) return;
        setTogglingId(activeEmployee.id);
        try {
            await onToggleActive(activeEmployee);
        } finally {
            setTogglingId(null);
            closePopover();
        }
    };

    return (
        <div
            className="relative flex flex-col gap-3 rounded-[1.6rem] border border-gray-100 bg-white p-3.5 dark:border-white/[0.07] dark:bg-[#0f1c33]"
            dir="rtl"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-300">
                        <Users size={15} />
                    </div>
                    <div>
                        <p className="text-[11.5px] font-extrabold text-gray-900 dark:text-white">
                            اعضای تیم خرید
                        </p>
                        <p className="text-[9.5px] font-medium text-gray-400">
                            {toPersianDigits(employees.length)} عضو ·{" "}
                            {toPersianDigits(employees.filter((e) => e.is_active !== false).length)} فعال
                        </p>
                    </div>
                </div>

                {canManage && (
                    <button
                        type="button"
                        onClick={onAdd}
                        className="flex h-8 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-[10.5px] font-extrabold transition active:scale-95"
                        style={{
                            background: "rgba(99,102,241,0.10)",
                            color: "#6366f1",
                            border: "1px solid rgba(99,102,241,0.18)",
                        }}
                    >
                        <Plus size={12} strokeWidth={2.7} />
                        افزودن
                    </button>
                )}
            </div>

            {employees.length === 0 ? (
                <div className="flex items-center gap-2 rounded-2xl border border-dashed border-gray-200 px-3 py-3 text-[10.5px] font-medium text-gray-400 dark:border-white/[0.07]">
                    <UserRound size={14} className="text-gray-300 dark:text-gray-600" />
                    هنوز کارمندی به فرآیند خرید اضافه نشده است
                </div>
            ) : (
                <div className="scrollbar-none flex w-full flex-wrap gap-1.5">
                    {employees.map((employee) => {
                        const isInactive = employee.is_active === false;

                        return (
                            <button
                                key={employee.id}
                                type="button"
                                onClick={(event) => openPopover(event, employee.id)}
                                className={`flex items-center gap-1.5 rounded-full border px-2 py-1.5 pr-1 transition-all ${isInactive
                                        ? "border-gray-200 bg-gray-50 opacity-60 dark:border-white/[0.06] dark:bg-white/[0.02]"
                                        : "border-gray-100 bg-gray-50 hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                                    } ${!canManage ? "cursor-default" : "cursor-pointer"}`}
                            >
                                <span
                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[9.5px] font-extrabold text-white ${gradientOf(
                                        employee.id
                                    )}`}
                                >
                                    {initialOf(employee.employee_name)}
                                </span>
                                <span className="text-[10.5px] font-bold text-gray-700 dark:text-gray-200">
                                    {employee.employee_name}
                                </span>
                                {isInactive && (
                                    <span className="rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[8px] font-black text-rose-500">
                                        غیرفعال
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {typeof document !== "undefined" &&
                createPortal(
                    <AnimatePresence>
                        {openId !== null && activeEmployee && (
                            <>
                                <div className="fixed inset-0 z-[998]" onClick={closePopover} />
                                <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -4, scale: 0.96 }}
                                    transition={{ duration: 0.15 }}
                                    className="fixed z-[999] w-48 -translate-x-1/2 overflow-hidden rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl dark:border-white/[0.08] dark:bg-[#111a2d]"
                                    style={{ top: position.top, left: position.left }}
                                    dir="rtl"
                                >
                                    <div className="px-2.5 py-2 text-[10px] font-extrabold text-gray-400">
                                        {activeEmployee.employee_name}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleToggle}
                                        disabled={togglingId === activeEmployee.id}
                                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[11px] font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/[0.05]"
                                    >
                                        {togglingId === activeEmployee.id ? (
                                            <Loader2 size={13} className="animate-spin" />
                                        ) : activeEmployee.is_active === false ? (
                                            <Power size={13} className="text-emerald-500" />
                                        ) : (
                                            <PowerOff size={13} className="text-amber-500" />
                                        )}
                                        {activeEmployee.is_active === false ? "فعال‌سازی" : "غیرفعال‌سازی"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            onDelete(activeEmployee);
                                            closePopover();
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                    >
                                        <Trash2 size={13} />
                                        حذف از تیم
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </div>
    );
}