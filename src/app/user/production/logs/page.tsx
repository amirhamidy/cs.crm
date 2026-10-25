"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ClipboardList, Plus, Trash2, X, AlertCircle, 
  Loader2, CheckCircle2, TrendingUp, Filter 
} from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import { listAll } from "@/lib/api";
import { useCurrentEmployee } from "@/hooks/usecurrentemployee";
import { toPersianDigits } from "@/lib/jalali";

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

export default function UserProductionLogsPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { employeeId } = useCurrentEmployee();

  const [logs, setLogs] = useState<ProductionLog[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formMachine, setFormMachine] = useState<number | "">("");
  const [formHours, setFormHours] = useState("8");
  const [formProduced, setFormProduced] = useState("");
  const [formWaste, setFormWaste] = useState("0");
  const [formNote, setFormNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allLogs, allMachines] = await Promise.all([
        listAll<ProductionLog>("/production/api/v1/log/"),
        listAll<any>("/production/api/v1/machine/", { is_active: true }),
      ]);
      setLogs(allLogs);
      setMachines(allMachines);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!employeeId || !formMachine || !formProduced) {
      setError("لطفاً ماشین و تعداد تولید را به طور صحیح وارد کنید.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await axiosInstance.post("/production/api/v1/log/create/", {
        date: formDate,
        employee: employeeId,
        machine: Number(formMachine),
        hours_worked: formHours,
        produced_qty: Number(formProduced),
        waste_qty: Number(formWaste),
        note: formNote.trim(),
      });

      setShowModal(false);
      setFormProduced("");
      setFormWaste("0");
      setFormNote("");
      fetchData();
    } catch (err: any) {
      setError("خطا در ثبت لاگ. احتمالاً برای این ماشین در این تاریخ قبلاً رکورد ثبت شده است.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
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
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 shadow-inner">
            <ClipboardList size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">ثبت و سوابق تولید روزانه</h1>
            <p className="text-xs text-gray-400 mt-0.5">ثبت ساعت کارکرد، مقدار تولید واقعی و ضایعات</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setError("");
            setShowModal(true);
          }}
          className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500"
        >
          <Plus size={15} />
          ثبت رکورد تولید جدید
        </button>
      </div>

      {/* Logs Table / Grid */}
      {loading ? (
        <div className="flex justify-center py-20 text-gray-400 text-xs">در حال بارگذاری سوابق تولید...</div>
      ) : (
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
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          log.efficiency >= 90 ? "bg-emerald-500/10 text-emerald-600" :
                          log.efficiency >= 70 ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"
                        }`}>
                          {toPersianDigits(log.efficiency.toFixed(1))}%
                        </span>
                      ) : "—"}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(log.id)}
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
                    <td colSpan={9} className="text-center py-12 text-gray-400 text-xs">هیچ رکوردی یافت نشد.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Creating Log */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-[#0f172a] border border-gray-100 dark:border-white/[0.07]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">ثبت رکورد جدید تولید</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.05] text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-4">
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

                {error && (
                  <div className="flex items-center gap-1.5 text-xs text-red-500 font-semibold bg-red-50 dark:bg-red-500/10 p-3 rounded-xl">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 h-11 rounded-2xl bg-gray-100 dark:bg-white/[0.05] text-xs font-bold text-gray-600 dark:text-gray-300"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={saving}
                    className="flex-1 h-11 rounded-2xl bg-indigo-600 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {saving && <Loader2 size={15} className="animate-spin" />}
                    <span>{saving ? "در حال ثبت..." : "ثبت نهایی"}</span>
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
