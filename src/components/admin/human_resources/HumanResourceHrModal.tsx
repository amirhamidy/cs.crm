"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarOff, Loader2, Plus, Trash2, Wallet, X, UserCog } from "lucide-react";
import {
    HrInfo, HrLeave, HrSalary, HumanResource, Employee, LeaveKind, SalaryPeriod,
    createHrLeave, createHrSalary, deleteHrLeave, deleteHrSalary, getEmployees,
    getHrInfo, getHrLeaves, getHrSalaries, hrErrorMessage, updateHrInfo,
} from "./humanResourceApi";
import { ErrorBox, Field, PrimaryButton, Select, TextInput } from "./hr/hrUi";

interface Props {
    section?: Tab;
    open: boolean;
    document: HumanResource | null;
    onClose: () => void;
    onChange: () => void;
}

type Tab = "info" | "salaries" | "leaves";

const fmt = (v: string | number | null | undefined) =>
    v === null || v === undefined || v === "" ? "—" : Math.round(Number(v)).toLocaleString("fa-IR");

const th = "px-3 py-2 text-right text-[10.5px] font-extrabold text-gray-400";
const td = "px-3 py-2 text-[11.5px] font-bold text-gray-700 dark:text-gray-200";

function InfoTab({ doc, onChange }: { doc: HumanResource; onChange: () => void }) {
    const [info, setInfo] = useState<HrInfo | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [f, setF] = useState({
        employee: "", daily: "8", overtime: "0", guild: "", file: "", start: "", end: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [ok, setOk] = useState(false);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const [i, e] = await Promise.all([getHrInfo(doc.id), getEmployees()]);
                if (!alive) return;
                setInfo(i.data);
                setEmployees(e.data);
                setF({
                    employee: i.data.employee ? String(i.data.employee) : "",
                    daily: i.data.daily_work_hours ?? "8",
                    overtime: i.data.overtime_rate_per_hour ?? "0",
                    guild: i.data.guild_work_hours ?? "",
                    file: i.data.contract_file ? String(i.data.contract_file) : "",
                    start: i.data.contract_start_date ?? "",
                    end: i.data.contract_end_date ?? "",
                });
            } catch (x) {
                if (alive) setErr(hrErrorMessage(x));
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [doc.id]);

    const save = async () => {
        setSaving(true); setErr(null); setOk(false);
        try {
            const { data } = await updateHrInfo(doc.id, {
                employee: f.employee ? Number(f.employee) : null,
                daily_work_hours: f.daily,
                overtime_rate_per_hour: f.overtime || "0",
                guild_work_hours: f.guild === "" ? null : f.guild,
                contract_file: f.file ? Number(f.file) : null,
                contract_start_date: f.start || null,
                contract_end_date: f.end || null,
            });
            setInfo(data);
            setOk(true);
            onChange();
        } catch (x) {
            setErr(hrErrorMessage(x));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" /></div>;

    const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value.replace(/\D/g, "") }));

    return (
        <div className="flex flex-col gap-5 pt-2">
            <Field label="شخص (کارمند)">
                <Select value={f.employee} onChange={set("employee")}>
                    <option value="">بدون شخص</option>
                    {employees.map((e) => <option key={e.id} value={String(e.id)}>{e.full_name || e.username}</option>)}
                </Select>
            </Field>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <Field label="ساعت کار روزانه">
                    <TextInput type="number" min={0} max={24} step={1} value={f.daily} onChange={set("daily")} />
                </Field>
                <Field label="نرخ هر ساعت اضافه‌کار">
                    <TextInput type="number" min={0} step={1} value={f.overtime} onChange={set("overtime")} />
                </Field>
                <Field label="ساعت کار اصناف">
                    <TextInput type="number" min={0} step={1} value={f.guild} onChange={set("guild")} />
                </Field>
            </div>
            <Field label="فایل قرارداد" hint="ابتدا فایل را در کارت منبع آپلود کنید، سپس اینجا انتخاب کنید.">
                <Select value={f.file} onChange={set("file")}>
                    <option value="">بدون قرارداد</option>
                    {doc.files.map((x) => <option key={x.id} value={String(x.id)}>{x.title || `فایل ${x.id}`}</option>)}
                </Select>
            </Field>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="شروع قرارداد"><TextInput type="date" value={f.start} onChange={set("start")} /></Field>
                <Field label="پایان قرارداد"><TextInput type="date" value={f.end} onChange={set("end")} /></Field>
            </div>
            {info?.current_salary && (
                <div className="rounded-xl bg-indigo-50 px-3 py-2 text-[11.5px] font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                    پایه حقوق فعلی: {fmt(info.current_salary.amount)} ({info.current_salary.period_type_display})
                </div>
            )}
            <ErrorBox message={err} />
            {ok && <p className="text-[11px] font-bold text-emerald-600">ذخیره شد.</p>}
            <PrimaryButton type="button" loading={saving} onClick={save}>ذخیره اطلاعات</PrimaryButton>
        </div>
    );
}

function SalariesTab({ doc, onChange }: { doc: HumanResource; onChange: () => void }) {
    const [rows, setRows] = useState<HrSalary[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [f, setF] = useState<{ period: SalaryPeriod; amount: string; from: string; note: string }>({
        period: "monthly", amount: "", from: "", note: "",
    });

    const load = useCallback(async () => {
        try { setRows((await getHrSalaries(doc.id)).data); } catch (x) { setErr(hrErrorMessage(x)); } finally { setLoading(false); }
    }, [doc.id]);
    useEffect(() => { load(); }, [load]);

    const add = async () => {
        setSaving(true); setErr(null);
        try {
            await createHrSalary(doc.id, { period_type: f.period, amount: f.amount, effective_from: f.from, effective_to: null, note: f.note });
            setF({ period: f.period, amount: "", from: "", note: "" });
            await load(); onChange();
        } catch (x) { setErr(hrErrorMessage(x)); } finally { setSaving(false); }
    };
    const del = async (id: number) => {
        if (!confirm("این پایه حقوق حذف شود؟")) return;
        try { await deleteHrSalary(id); await load(); onChange(); } catch (x) { setErr(hrErrorMessage(x)); }
    };

    return (
        <div className="flex flex-col gap-5 pt-2">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="نوع پایه">
                    <Select value={f.period} onChange={(e) => setF({ ...f, period: e.target.value as SalaryPeriod })}>
                        <option value="monthly">ماهانه</option>
                        <option value="daily">روزانه</option>
                    </Select>
                </Field>
                <Field label="مبلغ"><TextInput type="number" min={0} step={1} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value.replace(/\D/g, "") })} /></Field>
                <Field label="شروع اعتبار"><TextInput type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></Field>
                <Field label="یادداشت"><TextInput value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
            </div>
            <ErrorBox message={err} />
            <PrimaryButton type="button" loading={saving} disabled={!f.amount || !f.from} onClick={add}>
                <Plus size={14} /> افزودن پایه حقوق
            </PrimaryButton>

            {loading ? (
                <div className="flex justify-center py-6"><Loader2 className="animate-spin text-indigo-500" /></div>
            ) : rows.length === 0 ? (
                <p className="py-4 text-center text-[11px] font-semibold text-gray-400">پایه‌ای ثبت نشده است.</p>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/[0.06]">
                    <table className="w-full min-w-[480px]">
                        <thead><tr><th className={th}>نوع</th><th className={th}>مبلغ</th><th className={th}>از</th><th className={th}>تا</th><th className={th}>یادداشت</th><th /></tr></thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.id} className="border-t border-gray-100 dark:border-white/[0.06]">
                                    <td className={td}>{r.period_type_display ?? (r.period_type === "daily" ? "روزانه" : "ماهانه")}</td>
                                    <td className={td}>{fmt(r.amount)}</td>
                                    <td className={td}>{new Date(r.effective_from).toLocaleDateString("fa-IR")}</td>
                                    <td className={td}>{r.effective_to ? new Date(r.effective_to).toLocaleDateString("fa-IR") : "تاکنون"}</td>
                                    <td className={td}>{r.note || "—"}</td>
                                    <td className="px-2"><button type="button" onClick={() => del(r.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={13} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function LeavesTab({ doc }: { doc: HumanResource }) {
    const [rows, setRows] = useState<HrLeave[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [filter, setFilter] = useState<"" | LeaveKind>("");
    const [hourly, setHourly] = useState(false);
    const [f, setF] = useState<{ type: LeaveKind; start: string; end: string; hours: string; reason: string }>({
        type: "paid", start: "", end: "", hours: "", reason: "",
    });

    const load = useCallback(async () => {
        try { setRows(await getHrLeaves(doc.id, { leave_type: filter || undefined })); } catch (x) { setErr(hrErrorMessage(x)); } finally { setLoading(false); }
    }, [doc.id, filter]);
    useEffect(() => { load(); }, [load]);

    const add = async () => {
        setSaving(true); setErr(null);
        try {
            await createHrLeave(doc.id, {
                leave_type: f.type,
                start_date: f.start,
                end_date: hourly ? f.start : f.end,
                hours: hourly ? f.hours : null,
                reason: f.reason,
            });
            setF({ ...f, start: "", end: "", hours: "", reason: "" });
            await load();
        } catch (x) { setErr(hrErrorMessage(x)); } finally { setSaving(false); }
    };
    const del = async (id: number) => {
        if (!confirm("این مرخصی حذف شود؟")) return;
        try { await deleteHrLeave(id); await load(); } catch (x) { setErr(hrErrorMessage(x)); }
    };
    const d = (s: string) => new Date(s).toLocaleDateString("fa-IR");

    return (
        <div className="flex flex-col gap-5 pt-2">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="نوع مرخصی">
                    <Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as LeaveKind })}>
                        <option value="paid">با حقوق</option>
                        <option value="unpaid">بدون حقوق</option>
                    </Select>
                </Field>
                <Field label="نحوه ثبت">
                    <Select value={hourly ? "h" : "d"} onChange={(e) => setHourly(e.target.value === "h")}>
                        <option value="d">روزانه</option>
                        <option value="h">ساعتی</option>
                    </Select>
                </Field>
                <Field label={hourly ? "تاریخ" : "از تاریخ"}><TextInput type="date" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></Field>
                {hourly ? (
                    <Field label="تعداد ساعت"><TextInput type="number" min={0} max={24} step={1} value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value.replace(/\D/g, "") })} /></Field>
                ) : (
                    <Field label="تا تاریخ"><TextInput type="date" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></Field>
                )}
            </div>
            <Field label="دلیل"><TextInput value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field>
            <ErrorBox message={err} />
            <PrimaryButton type="button" loading={saving} disabled={!f.start || (hourly ? !f.hours : !f.end)} onClick={add}>
                <Plus size={14} /> ثبت مرخصی
            </PrimaryButton>

            <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-gray-400">فیلتر:</span>
                {([["", "همه"], ["paid", "با حقوق"], ["unpaid", "بدون حقوق"]] as const).map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setFilter(v)}
                        className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${filter === v ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 dark:bg-white/[0.06]"}`}>{l}</button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-6"><Loader2 className="animate-spin text-indigo-500" /></div>
            ) : rows.length === 0 ? (
                <p className="py-4 text-center text-[11px] font-semibold text-gray-400">مرخصی‌ای ثبت نشده است.</p>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/[0.06]">
                    <table className="w-full min-w-[480px]">
                        <thead><tr><th className={th}>نوع</th><th className={th}>از</th><th className={th}>تا</th><th className={th}>مدت</th><th className={th}>دلیل</th><th /></tr></thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.id} className="border-t border-gray-100 dark:border-white/[0.06]">
                                    <td className={td}>{r.leave_type_display}</td>
                                    <td className={td}>{d(r.start_date)}</td>
                                    <td className={td}>{d(r.end_date)}</td>
                                    <td className={td}>{r.hours ? `${fmt(r.hours)} ساعت` : `${fmt(r.days)} روز`}</td>
                                    <td className={td}>{r.reason || "—"}</td>
                                    <td className="px-2"><button type="button" onClick={() => del(r.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={13} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default function HumanResourceHrModal({ section, open, document, onClose, onChange }: Props) {
    const [tab, setTab] = useState<Tab>("info");
    useEffect(() => { if (open) setTab(section ?? "info"); }, [open, document?.id, section]);

    if (!open || !document) return null;

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: "info", label: "اطلاعات", icon: <UserCog size={13} /> },
        { id: "salaries", label: "پایه حقوق", icon: <Wallet size={13} /> },
        { id: "leaves", label: "مرخصی", icon: <CalendarOff size={13} /> },
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
                onMouseDown={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-2xl dark:border-white/[0.06] dark:bg-[#0b1220]"
                    dir="rtl"
                >
                    <div className="flex shrink-0 items-center justify-between px-7 pb-3 pt-6">
                        <div>
                            <h2 className="text-[14px] font-extrabold text-gray-900 dark:text-white">اطلاعات منبع انسانی</h2>
                            <p className="mt-0.5 text-[11px] text-gray-400">{document.title}</p>
                        </div>
                        <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-white/[0.05]">
                            <X size={15} />
                        </button>
                    </div>
                    {!section && <div className="flex shrink-0 gap-2 px-7 pb-2">
                        {tabs.map((t) => (
                            <button key={t.id} type="button" onClick={() => setTab(t.id)}
                                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11.5px] font-extrabold transition ${tab === t.id ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 dark:bg-white/[0.06]"}`}>
                                {t.icon}{t.label}
                            </button>
                        ))}
                    </div>}
                    <div className="flex-1 overflow-y-auto px-7 pb-7 pt-3">
                        {tab === "info" && <InfoTab doc={document} onChange={onChange} />}
                        {tab === "salaries" && <SalariesTab doc={document} onChange={onChange} />}
                        {tab === "leaves" && <LeavesTab doc={document} />}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
