"use client";

import { motion } from "framer-motion";
import { Plus, Trash2, Users } from "lucide-react";
import { toPersianDigits } from "@/lib/jalali";
import type { ApiQualityControlEmployee } from "@/types/quality_control";
import { gradientOf, initialOf } from "./qcUtils";

interface Props {
    employees: ApiQualityControlEmployee[];
    names: Record<string, string>;
    canManage: boolean;
    onAdd: () => void;
    onDelete: (employee: ApiQualityControlEmployee) => void;
}

export default function QCTeamBar({ employees, names, canManage, onAdd, onDelete }: Props) {
    return (
        <div className="rounded-[1.45rem] border border-gray-100 bg-white p-3 shadow-sm dark:border-white/[0.06] dark:bg-[#111827]" dir="rtl">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                        <Users size={15} className="text-blue-500" />
                    </span>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-[13px] font-extrabold text-gray-900 dark:text-white">تیم کنترل کیفی</h2>
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-50 px-1.5 text-[9.5px] font-extrabold text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">
                                {toPersianDigits(employees.length)}
                            </span>
                        </div>
                        <p className="mt-0.5 text-[10.5px] font-semibold text-gray-400">اعضای مجاز به تایید و رد کالا</p>
                    </div>
                </div>

                {canManage && (
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={onAdd}
                        className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-blue-600 px-4 text-[11px] font-extrabold text-white transition hover:bg-blue-500"
                    >
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
                        const name = names[e.username] || e.username;
                        return (
                            <div key={e.id} className="flex items-center gap-2 rounded-xl bg-gray-50 py-1.5 pl-2 pr-1.5 dark:bg-white/[0.035]">
                                <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradientOf(e.id)} text-[12px] font-extrabold text-white`}>
                                    {initialOf(name)}
                                    <span className={`absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-gray-50 dark:ring-[#151d2c] ${e.is_active ? "bg-emerald-500" : "bg-gray-400"}`} />
                                </span>
                                <div className="min-w-0">
                                    <p className="max-w-[140px] truncate text-[11.5px] font-extrabold text-gray-800 dark:text-white">{name}</p>
                                    <p className="text-[9.5px] font-semibold text-gray-400" dir="ltr">@{e.username}</p>
                                </div>
                                {canManage && (
                                    <button
                                        type="button"
                                        onClick={() => onDelete(e)}
                                        title="حذف از تیم"
                                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                                    >
                                        <Trash2 size={11} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}