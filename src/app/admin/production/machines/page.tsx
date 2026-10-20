"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Factory, Plus, Pencil, Power, Check, X, AlertCircle,
    Loader2, TrendingUp, BarChart3, AlertTriangle, ClipboardList, Trash2
} from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import { toPersianDigits } from "@/lib/jalali";

interface Machine {
    id: number;
    name: string;
    code: string;
    std_production_per_hour: string;
    std_waste_per_hour: string;
    is_active: boolean;
    created_at: string;
}

interface ProductionLog {
    id: number;
    date: string;
    employee: number;
    employee_name: string;
    machine: number;
    machine_name: string;
    machine_code: string;
    hours_worked: string;
    produced_qty: number;
    waste_qty: number;
    note: string;
    expected_production: string;
    expected_waste: string;
    efficiency: number | null;
}

const GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#ec4899", "#8b5cf6"],
    ["#06b6d4", "#3b82f6"],
    ["#10b981", "#14b8a6"],
    ["#f59e0b", "#ef4444"],
];

export default function AdminProductionManagementPage() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [machines, setMachines] = useState<Machine[]>([]);
    const [logs, setLogs] = useState<ProductionLog[]>([]);
    const [stats, setStats] = useState({ totalProduced: 0, totalWaste: 0, avgEfficiency: 0 });
    const [loading, setLoading] = useState(true);

    // Machine Modal states
    const [showMachineModal, setShowMachineModal] = useState(false);
    const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [stdProd, setStdProd] = useState("");
    const [stdWaste, setStdWaste] = useState("0");
    const [isActive, setIsActive] = useState(true);
    const [savingMachine, setSavingMachine] = useState(false);
    const [machineError, setMachineError] = useState("");

    // Log Modal states (Admin creating log on behalf)
    const [showLogModal, setShowLogModal] = useState(false);
    const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
    const [formEmployee, setFormEmployee] = useState("");
    const [formMachine, setFormMachine] = useState<number | "">("");
    const [formHours, setFormHours] = useState("8");
    const [formProduced, setFormProduced] = useState("");
    const [formWaste, setFormWaste] = useState("0");
    const [formNote, setFormNote] = useState("");
    const [savingLog, setSavingLog] = useState(false);
    const [logError, setlogError] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            const [machRes, logsRes] = await Promise.all([
                axiosInstance.get<Machine[]>("/production/api/v1/machine/"),
                axiosInstance.get<ProductionLog[]>("/production/api/v1/log/"),
            ]);

            const machList = machRes.data || [];
            const logList = logsRes.data || [];

            setMachines(machList);
            setLogs(logList);

            let prodSum = 0;
            let wasteSum = 0;
            let effSum = 0;
            let effCount = 0;

            logList.forEach((l) => {
                prodSum += Number(l.produced_qty || 0);
                wasteSum += Number(l.waste_qty || 0);
                if (l.efficiency !== null && l.efficiency !== undefined) {
                    effSum += Number(l.efficiency);
                    effCount++;
                }
            });

            setStats({
                totalProduced: prodSum,
                totalWaste: wasteSum,
                avgEfficiency: effCount > 0 ? effSum / effCount : 0,
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Machine handlers
    const handleOpenCreateMachine = () => {
        setEditingMachine(null);
        setName("");
        setCode("");
        setStdProd("");
        setStdWaste("0");
        setIsActive(true);
        setMachineError("");
        setShowMachineModal(true);
    };

    const handleOpenEditMachine = (m: Machine) => {
        setEditingMachine(m);
        setName(m.name);
        setCode(m.code);
        setStdProd(m.std_production_per_hour);
        setStdWaste(m.std_waste_per_hour);
        setIsActive(m.is_active);
        setMachineError("");
        setShowMachineModal(true);
    };

    const handleSaveMachine = async () => {
        if (!name.trim() || !code.trim() || !stdProd) {
            setMachineError("لطفاً فیلدهای ضروری را پر کنید.");
            return;
        }

        setSavingMachine(true);
        setMachineError("");
        try {
            const payload = {
                name: name.trim(),
                code: code.trim(),
                std_production_per_hour: stdProd,
                std_waste_per_hour: stdWaste,
                is_active: isActive,
            };

            if (editingMachine) {
                await axiosInstance.put(`/production/api/v1/machine/${editingMachine.id}/update/`, payload);
            } else {
                await axiosInstance.post("/production/api/v1/machine/create/", payload);
            }

            setShowMachineModal(false);
            fetchData();
        } catch (err: any) {
            setMachineError("خطا در ذخیره ماشین. احتمالاً کد تکراری است.");
        } finally {
            setSavingMachine(false);
        }
    };

    const handleToggleActive = async (m: Machine) => {
        try {
            await axiosInstance.patch(`/production/api/v1/machine/${m.id}/update/`, {
                is_active: !m.is_active,
            });
            fetchData();
        } catch {
            alert("خطا در تغییر وضعیت ماشین");
        }
    };

    // Log handlers
    const handleSaveLog = async () => {
        if (!formEmployee || !formMachine || !formProduced) {
            setlogError("لطفاً شناسه پرسنل، ماشین و تعداد تولید را وارد کنید.");
            return;
        }

        setSavingLog(true);
        setlogError("");
        try {
            await axiosInstance.post("/production/api/v1/log/create/", {
                date: formDate,
                employee: Number(formEmployee),
                machine: Number(formMachine),
                hours_worked: formHours,
                produced_qty: Number(formProduced),
                waste_qty: Number(formWaste),
                note: formNote.trim(),
            });

            setShowLogModal(false);
            setFormProduced("");
            setFormWaste("0");
            setFormNote("");
            fetchData();
        } catch (err: any) {
            setlogError("خطا در ثبت لاگ. تکراری بودن رکورد (برای این تاریخ و ماشین) یا نامعتبر بودن پرسنل.");
        } finally {
            setSavingLog(false);
        }
    };

    const handleDeleteLog = async (id: number) => {
        if (!confirm("آیا از حذف این رکورد اطمینان دارید؟")) return;
        try {
            await axiosInstance.delete(`/production/api/v1/log/${id}/delete/`);
            fetchData();
        } catch {
            alert("خطا در حذف رکورد");
        }
    };

    const cardBg = isDark ? "rgba(255,255,255,0.03)" : "#fafafa";
    const borderStyle = isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(15,23,42,0.06)";
    const shadowStyle = isDark ? "0 8px 30px rgba(0,0,0,0.22)" : "0 8px 24px rgba(15,23,42,0.05)";

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8" dir="rtl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 shadow-inner">
                        <Factory size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">مدیریت جامع تولید و ماشین‌آلات</h1>
                        <p className="text-xs text-gray-400 mt-0.5">آمار کلیدی، کنترل دستگاه‌ها و سوابق تولید در یک نگاه</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setlogError("");
                            setShowLogModal(true);
                        }}
                        className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500"
                    >
                        <ClipboardList size={15} />
                        ثبت لاگ جدید
                    </button>
                    <button
                        type="button"
                        onClick={handleOpenCreateMachine}
                        className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500"
                    >
                        <Plus size={15} />
                        تعریف ماشین
                    </button>
                </div>
            </div>

            {/* Analytics Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-3xl p-5 flex flex-col justify-between" style={{ background: cardBg, border: borderStyle, boxShadow: shadowStyle }}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400">کل تولید واقعی سیستم</span>
                        <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <TrendingUp size={16} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                            {toPersianDigits(stats.totalProduced.toLocaleString())} <span className="text-xs font-normal text-gray-400">عدد</span>
                        </h3>
                    </div>
                </div>

                <div className="rounded-3xl p-5 flex flex-col justify-between" style={{ background: cardBg, border: borderStyle, boxShadow: shadowStyle }}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400">میانگین راندمان کل</span>
                        <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                            <BarChart3 size={16} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                            {toPersianDigits(stats.avgEfficiency.toFixed(1))}%
                        </h3>
                    </div>
                </div>

                <div className="rounded-3xl p-5 flex flex-col justify-between" style={{ background: cardBg, border: borderStyle, boxShadow: shadowStyle }}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400">کل ضایعات ثبت شده</span>
                        <div className="h-8 w-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                            <AlertTriangle size={16} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-2xl font-black text-red-600 dark:text-red-400">
                            {toPersianDigits(stats.totalWaste.toLocaleString())} <span className="text-xs font-normal text-gray-400">عدد</span>
                        </h3>
                    </div>
                </div>
            </div>

            {/* Section: Machines Grid */}
            <div className="space-y-4">
                <h2 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                    <Factory size={16} className="text-indigo-500" />
                    ماشین‌آلات خط تولید ({machines.length})
                </h2>

                {loading ? (
                    <div className="flex justify-center py-10 text-gray-400 text-xs">در حال بارگذاری ماشین‌آلات...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {machines.map((m, index) => {
                            const [start, end] = GRADIENTS[m.id % GRADIENTS.length];
                            return (
                                <motion.div
                                    key={m.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                    className="rounded-3xl p-5 flex flex-col justify-between"
                                    style={{ background: cardBg, border: borderStyle, boxShadow: shadowStyle }}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div
                                                className="flex h-11 w-11 items-center justify-center rounded-2xl text-white font-extrabold text-sm shadow-md"
                                                style={{ background: `linear-gradient(135deg, ${start}, ${end})` }}
                                            >
                                                {m.name.charAt(0)}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${m.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                                                        }`}
                                                >
                                                    {m.is_active ? "فعال" : "غیرفعال"}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEditMachine(m)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 transition-colors hover:bg-indigo-500/20"
                                                    title="ویرایش"
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                            </div>
                                        </div>

                                        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">{m.name}</h3>
                                        <span className="text-[11px] text-gray-400 font-mono">کد: {m.code}</span>

                                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-gray-50 dark:bg-white/[0.02] p-3 rounded-2xl border border-gray-100 dark:border-white/[0.04]">
                                            <div>
                                                <span className="text-gray-400 block text-[10px]">تولید/ساعت:</span>
                                                <span className="font-bold text-gray-800 dark:text-gray-200">{toPersianDigits(m.std_production_per_hour)}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 block text-[10px]">ضایعات/ساعت:</span>
                                                <span className="font-bold text-red-600 dark:text-red-400">{toPersianDigits(m.std_waste_per_hour)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/[0.05] flex items-center justify-between">
                                        <span className="text-[10.5px] text-gray-400">تغییر وضعیت سریع</span>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleActive(m)}
                                            className={`flex h-7 w-[42px] items-center justify-between rounded-full p-[2px] transition-all ${m.is_active ? "bg-emerald-500/20" : "bg-gray-500/20"
                                                }`}
                                        >
                                            <motion.span
                                                animate={{ x: m.is_active ? 0 : 15 }}
                                                className="flex h-[23px] w-[23px] items-center justify-center rounded-full text-white shadow"
                                                style={{ background: m.is_active ? "#10b981" : "#64748b" }}
                                            >
                                                {m.is_active ? <Check size={12} strokeWidth={3.5} /> : <Power size={11} />}
                                            </motion.span>
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Section: Production Logs Table */}
            <div className="space-y-4 pt-4">
                <h2 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                    <ClipboardList size={16} className="text-emerald-500" />
                    سوابق و لاگ‌های ثبت‌شده تولید
                </h2>

                <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-gray-100 dark:border-white/[0.07] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse text-xs">
                            <thead className="bg-gray-50 dark:bg-white/[0.02] text-gray-400 border-b border-gray-100 dark:border-white/[0.06]">
                                <tr>
                                    <th className="p-4">تاریخ</th>
                                    <th className="p-4">پرسنل</th>
                                    <th className="p-4">ماشین</th>
                                    <th className="p-4">ساعت کار</th>
                                    <th className="p-4">تولید واقعی</th>
                                    <th className="p-4">انتظاری</th>
                                    <th className="p-4">ضایعات</th>
                                    <th className="p-4">راندمان</th>
                                    <th className="p-4 text-center">عملیات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
                                        <td className="p-4 font-mono">{toPersianDigits(log.date)}</td>
                                        <td className="p-4 font-bold text-gray-900 dark:text-white">{log.employee_name}</td>
                                        <td className="p-4 text-gray-600 dark:text-gray-300">
                                            {log.machine_name} <span className="text-[10px] text-gray-400 font-mono">({log.machine_code})</span>
                                        </td>
                                        <td className="p-4">{toPersianDigits(log.hours_worked)} ساعت</td>
                                        <td className="p-4 font-black text-emerald-600">{toPersianDigits(log.produced_qty.toLocaleString())}</td>
                                        <td className="p-4 text-gray-400">{toPersianDigits(Number(log.expected_production).toFixed(1))}</td>
                                        <td className="p-4 font-bold text-red-500">{toPersianDigits(log.waste_qty)}</td>
                                        <td className="p-4">
                                            {log.efficiency !== null ? (
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${log.efficiency >= 90 ? "bg-emerald-500/10 text-emerald-600" :
                                                        log.efficiency >= 70 ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"
                                                    }`}>
                                                    {toPersianDigits(log.efficiency.toFixed(1))}%
                                                </span>
                                            ) : "—"}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteLog(log.id)}
                                                className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                                title="حذف"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="text-center py-12 text-gray-400 text-xs">هیچ رکوردی ثبت نشده است.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal for Create/Edit Machine */}
            <AnimatePresence>
                {showMachineModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-[#0f172a] border border-gray-100 dark:border-white/[0.07]"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                                    {editingMachine ? "ویرایش ماشین" : "تعریف ماشین جدید"}
                                </h3>
                                <button
                                    onClick={() => setShowMachineModal(false)}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.05] text-gray-400 hover:text-gray-600"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[11.5px] font-bold text-gray-400 mb-1">نام ماشین</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="مثلا: پرس هیدرولیک"
                                        className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-xs font-bold text-gray-900 outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11.5px] font-bold text-gray-400 mb-1">کد یکتا (Code)</label>
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="مثلا: M-01"
                                        className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-xs font-mono font-bold text-gray-900 outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11.5px] font-bold text-gray-400 mb-1">تولید استاندارد/ساعت</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={stdProd}
                                            onChange={(e) => setStdProd(e.target.value)}
                                            className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-xs font-bold text-gray-900 outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11.5px] font-bold text-gray-400 mb-1">ضایعات استاندارد/ساعت</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={stdWaste}
                                            onChange={(e) => setStdWaste(e.target.value)}
                                            className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-xs font-bold text-gray-900 outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white"
                                        />
                                    </div>
                                </div>

                                {machineError && (
                                    <div className="flex items-center gap-1.5 text-xs text-red-500 font-semibold bg-red-50 dark:bg-red-500/10 p-3 rounded-xl">
                                        <AlertCircle size={14} />
                                        <span>{machineError}</span>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowMachineModal(false)}
                                        className="flex-1 h-11 rounded-2xl bg-gray-100 dark:bg-white/[0.05] text-xs font-bold text-gray-600 dark:text-gray-300"
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveMachine}
                                        disabled={savingMachine}
                                        className="flex-1 h-11 rounded-2xl bg-indigo-600 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        {savingMachine && <Loader2 size={15} className="animate-spin" />}
                                        <span>{savingMachine ? "در حال ذخیره..." : "ذخیره اطلاعات"}</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal for Creating Log by Admin */}
            <AnimatePresence>
                {showLogModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-[#0f172a] border border-gray-100 dark:border-white/[0.07]"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">ثبت رکورد جدید تولید توسط ادمین</h3>
                                <button
                                    onClick={() => setShowLogModal(false)}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.05] text-gray-400 hover:text-gray-600"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11.5px] font-bold text-gray-400 mb-1">تاریخ (میلادی)</label>
                                        <input
                                            type="date"
                                            value={formDate}
                                            onChange={(e) => setFormDate(e.target.value)}
                                            className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-xs font-mono font-bold text-gray-900 outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11.5px] font-bold text-gray-400 mb-1">شناسه پرسنل (Employee ID)</label>
                                        <input
                                            type="number"
                                            value={formEmployee}
                                            onChange={(e) => setFormEmployee(e.target.value)}
                                            placeholder="مثلا: 3"
                                            className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-xs font-bold text-gray-900 outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11.5px] font-bold text-gray-400 mb-1">انتخاب ماشین</label>
                                    <select
                                        value={formMachine}
                                        onChange={(e) => setFormMachine(Number(e.target.value))}
                                        className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-xs font-bold text-gray-900 outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white"
                                    >
                                        <option value="">انتخاب دستگاه...</option>
                                        {machines.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} ({m.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11.5px] font-bold text-gray-400 mb-1">ساعت کار (تا 24)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            max="24"
                                            min="0.01"
                                            value={formHours}
                                            onChange={(e) => setFormHours(e.target.value)}
                                            className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-xs font-bold text-gray-900 outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11.5px] font-bold text-gray-400 mb-1">تعداد تولید شده</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formProduced}
                                            onChange={(e) => setFormProduced(e.target.value)}
                                            className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-xs font-bold text-gray-900 outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11.5px] font-bold text-gray-400 mb-1">مقدار ضایعات</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formWaste}
                                            onChange={(e) => setFormWaste(e.target.value)}
                                            className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-xs font-bold text-gray-900 outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11.5px] font-bold text-gray-400 mb-1">توضیحات (اختیاری)</label>
                                        <input
                                            type="text"
                                            maxLength={255}
                                            value={formNote}
                                            onChange={(e) => setFormNote(e.target.value)}
                                            placeholder="نکات..."
                                            className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-xs font-bold text-gray-900 outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white"
                                        />
                                    </div>
                                </div>

                                {logError && (
                                    <div className="flex items-center gap-1.5 text-xs text-red-500 font-semibold bg-red-50 dark:bg-red-500/10 p-3 rounded-xl">
                                        <AlertCircle size={14} />
                                        <span>{logError}</span>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowLogModal(false)}
                                        className="flex-1 h-11 rounded-2xl bg-gray-100 dark:bg-white/[0.05] text-xs font-bold text-gray-600 dark:text-gray-300"
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveLog}
                                        disabled={savingLog}
                                        className="flex-1 h-11 rounded-2xl bg-indigo-600 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        {savingLog && <Loader2 size={15} className="animate-spin" />}
                                        <span>{savingLog ? "در حال ثبت..." : "ثبت نهایی"}</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
