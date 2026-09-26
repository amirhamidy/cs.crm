"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, UserPlus, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiPurchasingEmployee } from "@/types/purchasing";
import { FloatingSelect, OPTION_CLASS } from "./FormControls";

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

const normalizeList = <T,>(value: unknown): T[] => {
    if (Array.isArray(value)) return value as T[];
    if (value && typeof value === "object" && "results" in value && Array.isArray((value as { results?: unknown }).results)) {
        return (value as { results: T[] }).results;
    }
    return [];
};

export default function PurchasingEmployeeModal({ open, existingEmployees, onClose, onSaved }: Props) {
    const [candidates, setCandidates] = useState<EmployeeItem[]>([]);
    const [selectedId, setSelectedId] = useState("");
    const [saving, setSaving] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!open) return;
        setSelectedId("");
        setErrorMessage("");
        setFetching(true);

        axiosInstance
            .get("/accounts/api/v1/employee/list/")
            .then((res) => {
                const data = normalizeList<EmployeeItem>(res.data);
                const existingIds = new Set(existingEmployees.map((item) => item.employee));
                setCandidates(data.filter((item) => !existingIds.has(item.id)));
            })
            .catch(() => setErrorMessage("دریافت لیست کارکنان انجام نشد."))
            .finally(() => setFetching(false));
    }, [open, existingEmployees]);

    const handleSubmit = async () => {
        if (!selectedId) {
            setErrorMessage("یک کارمند انتخاب کنید.");
            return;
        }

        setSaving(true);
        setErrorMessage("");

        try {
            await axiosInstance.post("/purchasing/api/v1/employees/create/", {
                employee: Number(selectedId),
                is_active: true,
            });
            onSaved();
            onClose();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { detail?: string; message?: string; employee?: string[] | string } } };
            const data = e?.response?.data;
            const pick = (v: string[] | string | undefined) => (Array.isArray(v) ? v[0] : v);
            setErrorMessage(pick(data?.employee) || data?.detail || data?.message || "افزودن کارمند انجام نشد.");
        } finally {
            setSaving(false);
        }
    };

    const selectedCandidate = candidates.find((item) => String(item.id) === selectedId);

    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
                    dir="rtl"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !saving) onClose();
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 18, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-[440px] overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#111a2d]"
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/[0.06]">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-300">
                                    <UserPlus size={15} />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">افزودن کارمند</h3>
                                    <p className="mt-0.5 text-[10.5px] font-medium text-gray-400">افزودن عضو جدید به فرآیند خرید</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-400 disabled:opacity-50 dark:bg-white/[0.05] dark:text-gray-300"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3.5 px-5 py-5">
                            <FloatingSelect label="کارمند" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} disabled={fetching}>
                                <option value="" className={OPTION_CLASS}>
                                    {fetching ? "در حال دریافت..." : "انتخاب کارمند"}
                                </option>
                                {candidates.map((employee) => (
                                    <option key={employee.id} value={employee.id} className={OPTION_CLASS}>
                                        {employee.full_name || employee.username || `کارمند ${employee.id}`}
                                    </option>
                                ))}
                            </FloatingSelect>

                            {selectedCandidate && (
                                <div className="flex items-center gap-2.5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 px-3 py-2.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-[13px] font-extrabold text-white">
                                        {(selectedCandidate.full_name || selectedCandidate.username || "؟").trim().charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[11.5px] font-extrabold text-gray-900 dark:text-white">
                                            {selectedCandidate.full_name || selectedCandidate.username}
                                        </p>
                                        <p className="mt-0.5 truncate text-[10px] font-medium text-gray-400">
                                            {selectedCandidate.username ? `@${selectedCandidate.username}` : `شناسه ${selectedCandidate.id}`}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!fetching && candidates.length === 0 && (
                                <div className="rounded-xl bg-amber-500/10 px-3 py-2 text-center text-[10.5px] font-bold text-amber-600 dark:text-amber-400">
                                    همه کارمندان در حال حاضر به خرید اضافه شده‌اند.
                                </div>
                            )}

                            {errorMessage && (
                                <div className="rounded-xl bg-red-500/10 px-3 py-2 text-center text-[10.5px] font-bold text-red-500">{errorMessage}</div>
                            )}
                        </div>

                        <div className="flex gap-2 border-t border-gray-100 px-5 py-4 dark:border-white/[0.06]">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                className="h-11 flex-1 rounded-xl bg-gray-100 text-[11px] font-extrabold text-gray-500 dark:bg-white/[0.05] dark:text-gray-400"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={saving || fetching || !selectedId}
                                className="flex h-11 flex-[1.5] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-[11px] font-extrabold text-white shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:shadow-none"
                            >
                                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                                افزودن کارمند
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}