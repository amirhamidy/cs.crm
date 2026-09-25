"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, CheckCircle2, ClipboardCheck, LayoutDashboard, Plus, RefreshCw, Search, ShieldCheck, Users, X, XCircle } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiMe, ApiQualityControlEmployee, ApiQualityControlItem, ApiUser, QualityControlStatus } from "@/types/quality_control";
import QCEmployeeCard from "./QCEmployeeCard";
import QCEmployeeModal from "./QCEmployeeModal";
import QCItemCard from "./QCItemCard";

type Tab = "overview" | "items" | "employees";

const getList = <T,>(data: unknown): T[] => Array.isArray(data) ? data : ((data as { results?: T[]; data?: T[] } | null)?.results ?? (data as { data?: T[] } | null)?.data ?? []);

function errorText(error: unknown, fallback: string) {
    const data = (error as { response?: { data?: { detail?: string; message?: string } } }).response?.data;
    return data?.detail || data?.message || fallback;
}

export default function QualityControlPage() {
    const [me, setMe] = useState<ApiMe | null>(null);
    const [employees, setEmployees] = useState<ApiQualityControlEmployee[]>([]);
    const [users, setUsers] = useState<ApiUser[]>([]);
    const [items, setItems] = useState<ApiQualityControlItem[]>([]);
    const [tab, setTab] = useState<Tab>("overview");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<QualityControlStatus | "all">("all");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [employeeModal, setEmployeeModal] = useState(false);

    const load = useCallback(async (silent = false) => {
        silent ? setRefreshing(true) : setLoading(true);
        setError("");
        try {
            const [meRes, employeeRes, itemRes] = await Promise.all([
                axiosInstance.get<ApiMe>("/accounts/api/v1/auth/me/"),
                axiosInstance.get("/quality_control/api/v1/employee/"),
                axiosInstance.get("/quality_control/api/v1/"),
            ]);
            const current = meRes.data;
            const employeeList = getList<ApiQualityControlEmployee>(employeeRes.data);
            setMe(current);
            setEmployees(employeeList);
            setItems(getList<ApiQualityControlItem>(itemRes.data));
            if (current.type === 1) {
                const userRes = await axiosInstance.get("/accounts/api/v1/user/list/");
                setUsers(getList<ApiUser>(userRes.data));
            } else {
                setUsers([]);
            }
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
    const myEmployee = employees.find((employee) => employee.user === me?.id && employee.is_active);
    const hasAccess = Boolean(isAdmin || myEmployee);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((item) => {
            const matchesStatus = status === "all" || item.status === status;
            const matchesSearch = !q || item.product_name?.toLowerCase().includes(q) || String(item.id).includes(q) || String(item.purchase_task_id).includes(q) || item.checked_by_name?.toLowerCase().includes(q) || item.note?.toLowerCase().includes(q);
            return matchesStatus && matchesSearch;
        }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [items, search, status]);

    const pending = items.filter((x) => x.status === "pending").length;
    const approved = items.filter((x) => x.status === "approved").length;
    const rejected = items.filter((x) => x.status === "rejected").length;

    const updateItem = () => load(true);

    if (!loading && !hasAccess) {
        return (
            <div dir="rtl" className="min-h-full p-5 sm:p-8">
                <div className="mx-auto flex min-h-[60vh] max-w-[600px] items-center justify-center">
                    <div className="w-full rounded-[32px] border border-red-500/10 bg-white p-8 text-center shadow-sm dark:border-white/[.06] dark:bg-white/[.025]">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500"><ShieldCheck size={28} /></div>
                        <h2 className="mt-5 text-lg font-black text-gray-900 dark:text-white">دسترسی مجاز نیست</h2>
                        <p className="mt-2 text-xs font-medium leading-6 text-gray-400">شما عضو تیم کنترل کیفی نیستید و دسترسی مدیر سیستم را نیز ندارید.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div dir="rtl" className="min-h-full bg-gray-50/40 p-4 sm:p-6 lg:p-8 dark:bg-[#070d18]">
            <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5">
                <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"><ShieldCheck size={25} /></div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-black text-gray-900 dark:text-white">کنترل کیفی</h1><span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black text-emerald-500">فعال</span></div>
                            <p className="mt-1 text-[11px] font-medium text-gray-400">بررسی و تایید محصولات ارسال‌شده از فرآیند خرید</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => load(true)} disabled={refreshing} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/[.05] bg-white text-gray-500 dark:border-white/[.06] dark:bg-white/[.035]"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /></button>
                        {isAdmin && tab === "employees" && <button onClick={() => setEmployeeModal(true)} className="flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-4 text-[11px] font-black text-white shadow-lg shadow-blue-500/15"><Plus size={15} />افزودن کارمند</button>}
                    </div>
                </header>

                {error && <div className="flex items-center gap-3 rounded-2xl border border-red-500/10 bg-red-500/[.06] p-4 text-red-500"><XCircle size={16} /><span className="flex-1 text-[10.5px] font-bold">{error}</span><button onClick={() => load()} className="rounded-xl bg-red-500 px-3 py-2 text-[9px] font-black text-white">تلاش مجدد</button></div>}

                <div className="flex gap-1 overflow-x-auto rounded-[20px] bg-gray-100 p-1.5 dark:bg-white/[.045]">
                    {([
                        ["overview", "نمای کلی", LayoutDashboard],
                        ["items", "بررسی‌ها", ClipboardCheck],
                        ["employees", "تیم کنترل کیفی", Users],
                    ] as const).map(([id, label, Icon]) => (
                        <button key={id} onClick={() => setTab(id)} className={`flex h-10 shrink-0 items-center gap-2 rounded-2xl px-4 text-[10.5px] font-black transition ${tab === id ? "bg-white text-blue-600 shadow-sm dark:bg-[#172033] dark:text-blue-400" : "text-gray-400"}`}>
                            <Icon size={14} />{label}{id === "items" && pending > 0 && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[8px] text-white">{pending}</span>}
                        </button>
                    ))}
                </div>

                {loading ? <Loading /> : tab === "overview" ? <Overview items={items} employees={employees} onItems={() => setTab("items")} onEmployees={() => setTab("employees")} /> : tab === "items" ? (
                    <>
                        <div className="flex flex-col gap-3 lg:flex-row">
                            <div className="relative flex-1"><Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی محصول، شناسه یا بررسی‌کننده..." className="h-12 w-full rounded-2xl border border-black/[.05] bg-white pr-11 pl-4 text-[11px] font-bold outline-none focus:border-blue-500 dark:border-white/[.06] dark:bg-white/[.035] dark:text-white" /></div>
                            <select value={status} onChange={(e) => setStatus(e.target.value as QualityControlStatus | "all")} className="h-12 rounded-2xl border border-black/[.05] bg-white px-4 text-[10.5px] font-black dark:border-white/[.06] dark:bg-white/[.035] dark:text-white">
                                <option value="all">همه وضعیت‌ها</option><option value="pending">در انتظار بررسی</option><option value="approved">تایید شده</option><option value="rejected">رد شده</option>
                            </select>
                            {(search || status !== "all") && <button onClick={() => { setSearch(""); setStatus("all"); }} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gray-100 px-4 text-[10px] font-black text-gray-500 dark:bg-white/[.05]"><X size={14} />پاک کردن</button>}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400"><Activity size={14} className="text-blue-500" />نمایش {filtered.length} مورد از {items.length}</div>

                        {filtered.length ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((item, index) => <QCItemCard key={item.id} item={item} index={index} employees={employees} onUpdated={updateItem} />)}</div> : <Empty title="موردی پیدا نشد" icon={ClipboardCheck} />}
                    </>
                ) : isAdmin ? employees.length ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {employees.map((employee, index) => <QCEmployeeCard key={employee.id} employee={employee} index={index} onDeleted={() => setEmployees((x) => x.filter((e) => e.id !== employee.id))} />)}
                    </div>
                ) : <Empty title="تیم کنترل کیفی خالی است" icon={Users} /> : <Empty title="مدیریت تیم فقط برای مدیر سیستم فعال است" icon={Users} />}
            </div>

            {isAdmin && <QCEmployeeModal isOpen={employeeModal} users={users} existingEmployees={employees} onClose={() => setEmployeeModal(false)} onCreated={(employee) => { setEmployees((x) => [...x, employee]); setEmployeeModal(false); }} />}
        </div>
    );
}

function Loading() {
    return <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[300px] animate-pulse rounded-[28px] bg-white dark:bg-white/[.025]" />)}</div>;
}

function Empty({ title, icon: Icon }: { title: string; icon: typeof ClipboardCheck }) {
    return <div className="rounded-[28px] border border-black/[.05] bg-white py-20 text-center dark:border-white/[.06] dark:bg-white/[.025]"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500"><Icon size={25} /></div><h3 className="mt-5 text-sm font-black text-gray-800 dark:text-white">{title}</h3></div>;
}

function Overview({ items, employees, onItems, onEmployees }: { items: ApiQualityControlItem[]; employees: ApiQualityControlEmployee[]; onItems: () => void; onEmployees: () => void }) {
    const pending = items.filter((x) => x.status === "pending").length;
    const approved = items.filter((x) => x.status === "approved").length;
    const rejected = items.filter((x) => x.status === "rejected").length;
    const active = employees.filter((x) => x.is_active).length;
    const checked = approved + rejected;
    const rate = checked ? Math.round((approved / checked) * 100) : 0;

    return <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {([
                ["در انتظار بررسی", pending, "text-amber-500", ClipboardCheck],
                ["تایید شده", approved, "text-emerald-500", CheckCircle2],
                ["رد شده", rejected, "text-red-500", XCircle],
                ["کارمندان فعال", `${active}/${employees.length}`, "text-blue-500", Users],
            ] as const).map(([label, value, color, Icon]) => <div key={label} className="rounded-[26px] border border-black/[.05] bg-white p-5 dark:border-white/[.06] dark:bg-white/[.025]"><Icon size={18} className={color} /><p className="mt-5 text-[10px] font-bold text-gray-400">{label}</p><p className={`mt-1 text-2xl font-black ${color}`}>{value}</p></div>)}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
            <div className="rounded-[28px] border border-black/[.05] bg-white p-6 dark:border-white/[.06] dark:bg-white/[.025]">
                <div className="flex items-center justify-between"><div><h2 className="text-sm font-black text-gray-900 dark:text-white">وضعیت کلی کنترل کیفی</h2><p className="mt-1 text-[10px] text-gray-400">خلاصه وضعیت بررسی‌های ثبت‌شده</p></div><span className="rounded-xl bg-blue-500/10 px-3 py-1.5 text-[9px] font-black text-blue-500">{items.length} مورد</span></div>
                <div className="mt-6 h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[.06]"><motion.div initial={{ width: 0 }} animate={{ width: `${rate}%` }} className="h-full rounded-full bg-emerald-500" /></div>
                <div className="mt-2 flex justify-between text-[10px] font-bold text-gray-400"><span>نرخ تایید موارد بررسی‌شده</span><strong className="text-gray-800 dark:text-white">{rate}%</strong></div>
                <div className="mt-6 flex gap-2"><button onClick={onItems} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gray-900 py-3 text-[10px] font-black text-white dark:bg-white dark:text-gray-900">مشاهده بررسی‌ها</button><button onClick={onEmployees} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gray-100 py-3 text-[10px] font-black text-gray-600 dark:bg-white/[.05] dark:text-gray-300">تیم کنترل کیفی</button></div>
            </div>

            <div className="rounded-[28px] border border-black/[.05] bg-white p-6 dark:border-white/[.06] dark:bg-white/[.025]"><Users size={18} className="text-blue-500" /><p className="mt-5 text-[10px] font-bold text-gray-400">تیم فعال</p><p className="mt-1 text-3xl font-black text-gray-900 dark:text-white">{active}</p><p className="mt-1 text-[10px] text-gray-400">نفر فعال از {employees.length} نفر</p></div>
        </div>
    </div>;
}