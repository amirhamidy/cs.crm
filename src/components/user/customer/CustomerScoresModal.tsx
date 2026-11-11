"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { Backdrop } from "@/components/ui/Backdrop";
import { panelMotion } from "@/lib/motion";
import { CalendarDays, Check, MessageCircle, Pencil, Plus, Sparkles, Star, Trash2, UserRound, X } from "lucide-react";
import { ListSkeleton } from "@/components/ui/skeletons";
import { accountsApi, scoresApi } from "@/lib/api";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "@/components/notifications/toast";
import { apiMessage } from "@/lib/apiMessage";
import type { CustomerScore } from "@/types/crm";
type ScoreItem = CustomerScore;

interface Employee {
    id: number;
    full_name: string;
    username: string;
}

interface CustomerScoresModalProps {
    customerId: number;
    customerName?: string;
    isOpen: boolean;
    onClose: () => void;
}

const formatDate = (date: string) =>
    new Intl.DateTimeFormat("fa-IR", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(date));

const Stars = ({ score }: { score: number }) => (
    <div className="flex items-center gap-1" dir="ltr">
        {[1, 2, 3, 4, 5].map((star) => (
            <Star
                key={star}
                size={16}
                className={
                    star <= score
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300 dark:text-gray-600"
                }
            />
        ))}
    </div>
);

export default function CustomerScoresModal({
    customerId,
    customerName,
    isOpen,
    onClose,
}: CustomerScoresModalProps) {
    const reduced = useReducedMotion() ?? false;
    const { can } = usePermissions();
    const canCreate = can("customers", "create");
    const canEdit = can("customers", "edit");
    const canDelete = can("customers", "delete");
    const [scores, setScores] = useState<ScoreItem[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [draftScore, setDraftScore] = useState(5);
    const [draftReason, setDraftReason] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingScore, setEditingScore] = useState(5);
    const [editingReason, setEditingReason] = useState("");
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const [scoresResponse, employeeList] = await Promise.all([
                scoresApi.all(customerId),
                accountsApi.employees.all(),
            ]);
            setScores(scoresResponse);
            setEmployees(employeeList);
        } catch (fetchError) {
            setError(apiMessage(fetchError, "دریافت امتیازها و لیست کارمندان انجام نشد."));
        } finally {
            setLoading(false);
        }
    }, [customerId]);

    useEffect(() => {
        if (!isOpen) return;
        void fetchData();
    }, [fetchData, isOpen]);

    async function createScore() {
        if (!draftReason.trim() || saving) return;
        setSaving(true);
        try {
            await scoresApi.create(customerId, { score: draftScore, reason: draftReason.trim() });
            setDraftScore(5);
            setDraftReason("");
            await fetchData();
            toast.success("امتیاز ثبت شد");
        } catch (saveError) {
            toast.error(apiMessage(saveError, "ثبت امتیاز انجام نشد"));
        } finally {
            setSaving(false);
        }
    }

    async function saveEdit(item: ScoreItem) {
        if (!editingReason.trim() || saving) return;
        setSaving(true);
        try {
            await scoresApi.update(customerId, item.id, { score: editingScore, reason: editingReason.trim() });
            setEditingId(null);
            await fetchData();
            toast.success("امتیاز ویرایش شد");
        } catch (saveError) {
            toast.error(apiMessage(saveError, "ویرایش امتیاز انجام نشد"));
        } finally {
            setSaving(false);
        }
    }

    async function deleteScore(id: number) {
        if (deletingId != null) return;
        setDeletingId(id);
        try {
            await scoresApi.remove(customerId, id);
            await fetchData();
            toast.success("امتیاز حذف شد");
        } catch (deleteError) {
            toast.error(apiMessage(deleteError, "حذف امتیاز انجام نشد"));
        } finally {
            setDeletingId(null);
        }
    }

    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    const employeeMap = useMemo(
        () =>
            new Map(
                employees.map((employee) => [
                    Number(employee.id),
                    employee.full_name,
                ])
            ),
        [employees]
    );

    const averageScore = useMemo(() => {
        if (!scores.length) return 0;

        return (
            scores.reduce((total, item) => total + Number(item.score || 0), 0) /
            scores.length
        ).toFixed(1);
    }, [scores]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[999] flex items-center justify-center p-4"
                >
                    <Backdrop onClick={() => { onClose(); }} />
                    <m.div
                        {...panelMotion(false, reduced)}
                        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[30px] border border-gray-200 bg-white dark:border-white/10 dark:bg-[#17191f]"
                        dir="rtl"
                    >
                        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-5 dark:border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
                                    <MessageCircle size={23} />
                                </div>

                                <div>
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white">
                                        نظرات و امتیازها
                                    </h2>

                                    <p className="mt-1 max-w-[230px] truncate text-xs text-gray-500 dark:text-gray-400">
                                        {customerName || "مشتری"}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition hover:bg-rose-100 hover:text-rose-500 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-rose-500/15"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-5">
                            <div className="mb-5 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 p-5 text-white shadow-xl shadow-indigo-500/10">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <div className="mb-2 flex items-center gap-2 text-sm text-white/80">
                                            <Sparkles size={16} />
                                            میانگین امتیاز مشتری
                                        </div>

                                        <div className="flex items-end gap-2">
                                            <span className="text-5xl font-black">
                                                {averageScore}
                                            </span>

                                            <span className="mb-2 text-sm text-white/70">
                                                از ۵
                                            </span>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl bg-white/15 px-4 py-3 text-center">
                                        <div className="text-2xl font-black">
                                            {scores.length}
                                        </div>

                                        <div className="mt-1 text-xs text-white/75">
                                            امتیاز ثبت‌شده
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {canCreate && (
                                <div className="mb-5 rounded-2xl border border-gray-200 p-4 dark:border-white/10">
                                    <div className="mb-3 flex items-center gap-2 text-[12px] font-extrabold text-gray-800 dark:text-gray-100">
                                        <Plus size={15} className="text-indigo-500" /> ثبت امتیاز جدید
                                    </div>
                                    <div className="mb-3 flex items-center gap-3">
                                        <span className="text-[11px] font-bold text-gray-500">امتیاز</span>
                                        <div className="flex items-center gap-1" dir="ltr">
                                            {[1, 2, 3, 4, 5].map((value) => (
                                                <button key={value} type="button" onClick={() => setDraftScore(value)} aria-label={`${value} از ۵`} className="p-0.5">
                                                    <Star size={19} className={value <= draftScore ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <textarea value={draftReason} onChange={(event) => setDraftReason(event.target.value)} rows={2} maxLength={1000} placeholder="دلیل یا توضیح امتیاز..." className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-[12px] leading-6 text-gray-800 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" />
                                    <div className="mt-2 flex justify-end">
                                        <button type="button" onClick={() => void createScore()} disabled={!draftReason.trim() || saving} className="flex h-9 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-[11.5px] font-bold text-white disabled:opacity-40">
                                            <Check size={13} /> ثبت امتیاز
                                        </button>
                                    </div>
                                </div>
                            )}

                            {loading && (
                                <ListSkeleton rows={3} />
                            )}

                            {!loading && error && (
                                <div className="rounded-2xl bg-rose-50 p-5 text-center text-sm font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                                    {error}
                                </div>
                            )}

                            {!loading && !error && !scores.length && (
                                <div className="flex min-h-52 flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 text-center dark:border-white/10">
                                    <MessageCircle
                                        size={35}
                                        className="mb-3 text-gray-300 dark:text-gray-600"
                                    />

                                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                                        هنوز امتیازی برای این مشتری ثبت نشده است.
                                    </p>
                                </div>
                            )}

                            {!loading && !error && scores.length > 0 && (
                                <div className="space-y-4">
                                    {scores.map((item) => (
                                        <m.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="rounded-3xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/[0.035]"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                                                        <UserRound
                                                            size={20}
                                                        />
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-black text-gray-900 dark:text-white">
                                                            {employeeMap.get(
                                                                Number(
                                                                    item.created_by
                                                                )
                                                            ) ||
                                                                "کارمند ناشناس"}
                                                        </p>

                                                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                                                            <CalendarDays
                                                                size={13}
                                                            />

                                                            <span>
                                                                {formatDate(
                                                                    item.created_at
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex shrink-0 items-center gap-2">
                                                    <div className="rounded-xl bg-white px-2.5 py-2 shadow-sm dark:bg-white/5">
                                                        <Stars score={Number(item.score)} />
                                                    </div>
                                                    {(canEdit || canDelete) && editingId !== item.id && (
                                                        <div className="flex items-center gap-1">
                                                            {canEdit && <button type="button" onClick={() => { setEditingId(item.id); setEditingScore(Number(item.score)); setEditingReason(item.reason); }} aria-label="ویرایش امتیاز" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-indigo-500/10 hover:text-indigo-500"><Pencil size={13} /></button>}
                                                            {canDelete && <button type="button" onClick={() => void deleteScore(item.id)} disabled={deletingId === item.id} aria-label="حذف امتیاز" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-40"><Trash2 size={13} /></button>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {editingId === item.id ? (
                                                <div className="mt-4 space-y-3">
                                                    <div className="flex items-center gap-1" dir="ltr">
                                                        {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setEditingScore(value)} className="p-0.5"><Star size={18} className={value <= editingScore ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"} /></button>)}
                                                    </div>
                                                    <textarea value={editingReason} onChange={(event) => setEditingReason(event.target.value)} rows={2} maxLength={1000} className="w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-[12px] leading-6 text-gray-800 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" />
                                                    <div className="flex justify-end gap-2">
                                                        <button type="button" onClick={() => setEditingId(null)} disabled={saving} className="h-8 rounded-lg px-3 text-[11px] font-bold text-gray-500">انصراف</button>
                                                        <button type="button" onClick={() => void saveEdit(item)} disabled={!editingReason.trim() || saving} className="flex h-8 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-[11px] font-bold text-white disabled:opacity-40"><Check size={12} /> ذخیره</button>
                                                    </div>
                                                </div>
                                            ) : item.reason ? (
                                                <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm leading-7 text-gray-600 dark:bg-white/[0.04] dark:text-gray-300">
                                                    {item.reason}
                                                </div>
                                            ) : null}
                                        </m.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </m.div>
                </div>
            )}
        </AnimatePresence>
    );
}