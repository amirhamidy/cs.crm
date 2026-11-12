"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Archive, CheckCircle2, ClipboardCheck, Clock3, Loader2, RefreshCw, Search, ShieldCheck, UserCheck, Users, X, XCircle, type LucideIcon } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { toPersianDigits } from "@/lib/jalali";
import { useCurrentEmployee, useEmployeeNames } from "@/hooks/usecurrentemployee";
import type { ApiMe, ApiQualityControlEmployee, ApiQualityControlItem } from "@/types/quality_control";
import QCDeleteModal from "./QCDeleteModal";
import QCEmployeeModal from "./QCEmployeeModal";
import QCItemCard from "./QCItemCard";
import QCTeamBar from "./QCTeamBar";

const PAGE = 8;
const box = "rounded-[1.45rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#111827]";
const grid = "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3";

const getList = <T,>(data: unknown): T[] =>
    Array.isArray(data) ? data : ((data as { results?: T[]; data?: T[] } | null)?.results ?? (data as { data?: T[] } | null)?.data ?? []);

function errorText(error: unknown, fallback: string) {
    const data = (error as { response?: { data?: { detail?: string; message?: string } } }).response?.data;
    return data?.detail || data?.message || fallback;
}

const time = (i: ApiQualityControlItem) => new Date(i.checked_at || i.created_at).getTime();

function Stat({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: LucideIcon; tone: string }) {
    return (
        <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${tone}`}>
            <Icon size={15} className="shrink-0" />
            <div className="min-w-0">
                <p className="text-[9.5px] font-semibold opacity-80">{label}</p>
                <p className="mt-0.5 text-[13px] font-extrabold leading-none">{value}</p>
            </div>
        </div>
    );
}

function Section({ icon: Icon, title, sub, count, children, empty }: { icon: LucideIcon; title: string; sub: string; count: number; children: ReactNode; empty: string }) {
    return (
        <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.05]">
                    <Icon size={15} className="text-gray-500 dark:text-gray-400" />
                </span>
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-[13px] font-extrabold text-gray-900 dark:text-white">{title}</h2>
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-100 px-1.5 text-[9.5px] font-extrabold text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">{toPersianDigits(count)}</span>
                    </div>
                    <p className="mt-0.5 text-[10.5px] font-semibold text-gray-400">{sub}</p>
                </div>
            </div>
            {count ? children : (
                <div className="flex min-h-[130px] flex-col items-center justify-center gap-2 rounded-[1.45rem] border border-dashed border-gray-200 text-center dark:border-white/[0.07]">
                    <Icon size={22} className="text-gray-300 dark:text-gray-700" />
                    <p className="text-[11px] font-semibold text-gray-400">{empty}</p>
                </div>
            )}
        </section>
    );
}

export default function QualityControlPage() {
    const { employee: currentEmployee } = useCurrentEmployee();
    const names = useEmployeeNames();

    const [me, setMe] = useState<ApiMe | null>(null);
    const [employees, setEmployees] = useState<ApiQualityControlEmployee[]>([]);
    const [items, setItems] = useState<ApiQualityControlItem[]>([]);
    const [search, setSearch] = useState("");
    const [shown, setShown] = useState(PAGE);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [employeeModal, setEmployeeModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<ApiQualityControlEmployee | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true);
        else setLoading(true);
        setError("");
        try {
            const [meRes, employeeRes, itemRes] = await Promise.all([
                axiosInstance.get<ApiMe>("/accounts/api/v1/auth/me/"),
                axiosInstance.get("/quality_control/api/v1/employee/"),
                axiosInstance.get("/quality_control/api/v1/"),
            ]);
            setMe(meRes.data);
            setEmployees(getList<ApiQualityControlEmployee>(employeeRes.data));
            setItems(getList<ApiQualityControlItem>(itemRes.data));
        } catch (err) {
            setError(errorText(err, "دریافت اطلاعات کنترل کیفی انجام نشد"));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const isAdmin = me?.type === 1;
    const myEmployee = useMemo(() => employees.find((e) => e.user === me?.id && e.is_active) ?? null, [employees, me]);
    const hasAccess = Boolean(isAdmin || myEmployee);
    const myName = currentEmployee?.full_name || myEmployee?.username || "";

    const stats = useMemo(() => {
        const c = { pending: 0, approved: 0, rejected: 0 };
        items.forEach((i) => {
            if (i.status in c) c[i.status as keyof typeof c]++;
        });
        return { ...c, active: employees.filter((e) => e.is_active).length };
    }, [items, employees]);

    const { pending, archive } = useMemo(() => {
        const q = search.trim().toLowerCase();
        const match = (i: ApiQualityControlItem) =>
            !q ||
            [i.product_name, String(i.id), String(i.purchase_task_id), i.checked_by_name, names[i.checked_by_name ?? ""], i.note].some((v) => v?.toLowerCase().includes(q));
        const list = items.filter(match).sort((a, b) => time(b) - time(a));
        return { pending: list.filter((i) => i.status === "pending"), archive: list.filter((i) => i.status !== "pending") };
    }, [items, search, names]);

    async function confirmDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await axiosInstance.delete(`/quality_control/api/v1/employee/${deleteTarget.id}/delete/`);
            setEmployees((x) => x.filter((e) => e.id !== deleteTarget.id));
        } catch (err) {
            setError(errorText(err, "حذف عضو انجام نشد"));
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    }

    if (!loading && !hasAccess) {
        return (
            <div dir="rtl" className="p-3 sm:p-5">
                <div className={`${box} mx-auto flex min-h-[300px] max-w-md flex-col items-center justify-center p-8 text-center`}>
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10">
                        <ShieldCheck size={24} className="text-red-500" />
                    </div>
                    <h2 className="text-[14px] font-extrabold text-gray-900 dark:text-white">دسترسی مجاز نیست</h2>
                    <p className="mt-1.5 text-[11px] font-semibold leading-5 text-gray-400">شما عضو تیم کنترل کیفی نیستید و دسترسی مدیر سیستم را نیز ندارید.</p>
                </div>
            </div>
        );
    }

    const card = (i: ApiQualityControlItem, idx: number) => (
        <QCItemCard key={i.id} item={i} index={idx} reviewer={myEmployee} reviewerName={myName} names={names} onUpdated={() => load(true)} />
    );

    return (
        <div dir="rtl" className="space-y-4 p-3 sm:p-5">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className={`${box} p-3`}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-sm">
                            <ShieldCheck size={18} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">کنترل کیفی</h1>
                            <p className="mt-0.5 truncate text-[10.5px] font-semibold text-gray-400">بررسی و تایید محصولات ارسال‌شده از فرآیند خرید</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
                            <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setShown(PAGE);
                                }}
                                placeholder="جستجوی محصول، شناسه یا بررسی‌کننده..."
                                className="h-9 w-full rounded-full border border-gray-100 bg-gray-50 pl-9 pr-9 text-[11px] font-semibold text-gray-800 outline-none transition focus:border-blue-400 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white"
                            />
                            {search && (
                                <button type="button" onClick={() => setSearch("")} className="absolute left-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:text-gray-600">
                                    <X size={11} />
                                </button>
                            )}
                        </div>

                        <span className={`hidden h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[10.5px] font-extrabold md:flex ${isAdmin ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-600 dark:text-blue-300"}`}>
                            {isAdmin ? <ShieldCheck size={12} /> : <UserCheck size={12} />}
                            {isAdmin ? "ادمین" : "کارمند"}
                            {myName ? ` · ${myName}` : ""}
                        </span>

                        <button type="button" onClick={() => load(true)} disabled={loading || refreshing} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300">
                            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Stat label="در انتظار بررسی" value={toPersianDigits(stats.pending)} icon={Clock3} tone="bg-amber-50/70 text-amber-600 dark:bg-amber-500/[0.07] dark:text-amber-400" />
                    <Stat label="تایید شده" value={toPersianDigits(stats.approved)} icon={CheckCircle2} tone="bg-emerald-50/70 text-emerald-600 dark:bg-emerald-500/[0.07] dark:text-emerald-400" />
                    <Stat label="رد شده" value={toPersianDigits(stats.rejected)} icon={XCircle} tone="bg-red-50/70 text-red-500 dark:bg-red-500/[0.07] dark:text-red-400" />
                    <Stat label="اعضای فعال" value={`${toPersianDigits(stats.active)}/${toPersianDigits(employees.length)}`} icon={Users} tone="bg-blue-50/70 text-blue-600 dark:bg-blue-500/[0.07] dark:text-blue-400" />
                </div>
            </motion.div>

            {error && (
                <div className="flex items-center gap-2.5 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10">
                    <XCircle size={14} className="shrink-0 text-red-500" />
                    <span className="flex-1 text-[11.5px] font-semibold text-red-500 dark:text-red-400">{error}</span>
                    <button type="button" onClick={() => load()} className="rounded-full bg-red-500 px-3 py-1.5 text-[10px] font-extrabold text-white transition hover:bg-red-600">تلاش مجدد</button>
                </div>
            )}

            {loading ? (
                <div className={`${box} flex h-32 items-center justify-center`}>
                    <Loader2 size={20} className="animate-spin text-blue-500" />
                </div>
            ) : (
                <>
                    <QCTeamBar employees={employees} names={names} canManage={Boolean(isAdmin)} onAdd={() => setEmployeeModal(true)} onDelete={setDeleteTarget} />

                    <Section icon={ClipboardCheck} title="در انتظار بررسی" sub="کالاهایی که منتظر تایید یا رد هستند" count={pending.length} empty="موردی در انتظار بررسی نیست">
                        <div className={grid}>{pending.map(card)}</div>
                    </Section>

                    <Section icon={Archive} title="بایگانی بررسی‌ها" sub="موارد تایید یا رد شده" count={archive.length} empty="هنوز بررسی‌ای در بایگانی نیست">
                        <div className={grid}>{archive.slice(0, shown).map(card)}</div>
                        {archive.length > shown && (
                            <button type="button" onClick={() => setShown((n) => n + PAGE)} className="mx-auto flex h-9 items-center rounded-full bg-gray-100 px-5 text-[11px] font-extrabold text-gray-500 transition hover:text-blue-500 dark:bg-white/[0.05] dark:text-gray-400">
                                نمایش بیشتر ({toPersianDigits(archive.length - shown)})
                            </button>
                        )}
                    </Section>
                </>
            )}

            {isAdmin && (
                <QCEmployeeModal
                    isOpen={employeeModal}
                    existingEmployees={employees}
                    names={names}
                    onClose={() => setEmployeeModal(false)}
                    onCreated={() => {
                        setEmployeeModal(false);
                        load(true);
                    }}
                />
            )}

            <QCDeleteModal
                open={!!deleteTarget}
                title={`حذف «${deleteTarget ? names[deleteTarget.username] || deleteTarget.username : ""}»`}
                description="این عضو از تیم کنترل کیفی حذف می‌شود و دیگر نمی‌تواند کالایی را تایید یا رد کند."
                loading={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}