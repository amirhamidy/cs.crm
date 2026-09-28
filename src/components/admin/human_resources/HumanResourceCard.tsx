"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { ExternalLink, FileText, GitBranch, Pencil, Trash2, Users, X } from "lucide-react";
import { Department, HumanResource, deleteDocumentFile } from "./humanResourceApi";
import { gradientOf, initialOf } from "./hrUtils";

interface Props {
    document: HumanResource;
    departments: Department[];
    canManage: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onSteps: () => void;
    onChange: () => void;
}

const iconBtn = "flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition";

function HumanResourceCard({ document, departments, canManage, onEdit, onDelete, onSteps, onChange }: Props) {
    const dep = departments.find((d) => d.name === document.title);

    const removeFile = async (id: number) => {
        if (!confirm("آیا از حذف فایل مطمئن هستید؟")) return;
        await deleteDocumentFile(id);
        onChange();
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            whileHover={{ y: -3 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            className="group overflow-hidden rounded-[1.45rem] border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-xl hover:shadow-black/[0.04] dark:border-white/[0.06] dark:bg-[#111827] dark:hover:shadow-black/20"
            dir="rtl"
        >
            <div className="p-3">
                <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradientOf(document.id)} text-[14px] font-extrabold text-white shadow-sm`}>
                        {initialOf(document.title, "م")}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">{document.title}</h3>
                                <div className="mt-1.5 flex items-center gap-1.5">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gray-100 dark:bg-white/[0.06]">
                                        <Users size={10} className="text-gray-400" />
                                    </span>
                                    <span className="truncate text-[10.5px] font-semibold text-gray-400">
                                        {dep ? `دپارتمان ${dep.name}` : "قابل مشاهده برای همه"}
                                    </span>
                                </div>
                            </div>

                            {canManage && (
                                <div className="flex shrink-0 items-center gap-1">
                                    <button type="button" onClick={onEdit} className={`${iconBtn} hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-500/10`}>
                                        <Pencil size={13} />
                                    </button>
                                    <button type="button" onClick={onDelete} className={`${iconBtn} hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10`}>
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-3 h-px bg-gray-100 dark:bg-white/[0.06]" />

                <div className="mt-3">
                    {document.files.length > 0 ? (
                        <div className="space-y-1.5">
                            {document.files.map((f) => (
                                <motion.div
                                    key={f.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 rounded-xl bg-gray-50 px-2.5 py-2 dark:bg-white/[0.035]"
                                >
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-white/[0.06]">
                                        <FileText size={12} className="text-indigo-500" />
                                    </span>
                                    <a href={f.file} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-[11px] font-bold text-gray-600 transition hover:text-indigo-500 dark:text-gray-300">
                                        مشاهده فایل
                                    </a>
                                    <ExternalLink size={11} className="shrink-0 text-gray-300" />
                                    {canManage && (
                                        <button type="button" onClick={() => removeFile(f.id)} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10">
                                            <X size={11} />
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 px-2.5 py-2 dark:border-white/[0.07]">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 dark:bg-white/[0.04]">
                                <FileText size={12} className="text-gray-300" />
                            </span>
                            <span className="text-[10.5px] font-semibold text-gray-400">فایلی برای این منبع ثبت نشده</span>
                        </div>
                    )}
                </div>

                <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={onSteps}
                    className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-full bg-indigo-600 text-[11.5px] font-extrabold text-white transition hover:bg-indigo-500"
                >
                    <GitBranch size={13} />
                    مشاهده مراحل
                </motion.button>
            </div>
        </motion.div>
    );
}

export default memo(HumanResourceCard);