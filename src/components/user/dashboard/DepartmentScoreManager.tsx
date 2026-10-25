"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Award, Loader2, Plus, Minus, RefreshCw, Users } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { listAll } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import AdjustScoreModal from "@/components/admin/users/AdjustScoreModal";

type Employee = { id: number; username: string; full_name?: string; type?: number };
type Assignment = {
  id: number;
  employee: number;
  employee_name?: string;
  department: number;
  department_name?: string;
  is_manager?: boolean;
};
type Score = { score?: number; total_score?: number };
type Action = "add" | "deduct";

export default function DepartmentScoreManager() {
  const username = useAuthStore((state) => state.username);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [selected, setSelected] = useState<Employee | null>(null);
  const [selectedAction, setSelectedAction] = useState<Action>("add");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const currentEmployee = useMemo(
    () => employees.find((employee) => employee.username === username) ?? null,
    [employees, username],
  );
  const managedAssignments = useMemo(
    () => assignments.filter((item) => item.is_manager && Number(item.employee) === Number(currentEmployee?.id)),
    [assignments, currentEmployee],
  );
  const departmentIds = useMemo(
    () => new Set(managedAssignments.map((item) => Number(item.department))),
    [managedAssignments],
  );
  const departmentNames = useMemo(
    () => new Map(managedAssignments.map((item) => [Number(item.department), item.department_name || "دپارتمان"])),
    [managedAssignments],
  );
  const team = useMemo(() => {
    if (!currentEmployee || !departmentIds.size) return [];
    const ids = new Set(assignments.filter((item) => departmentIds.has(Number(item.department))).map((item) => Number(item.employee)));
    ids.delete(Number(currentEmployee.id));
    return employees.filter((employee) => ids.has(Number(employee.id)));
  }, [assignments, currentEmployee, departmentIds, employees]);

  const load = useCallback(async (quiet = false) => {
    if (!hasHydrated || !username) {
      setLoading(false);
      return;
    }
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [employeeList, assignmentList] = await Promise.all([
        listAll<Employee>("/accounts/api/v1/employee/list/"),
        listAll<Assignment>("/department/api/v1/department_employee/list/"),
      ]);
      setEmployees(employeeList);
      setAssignments(assignmentList);
      const current = employeeList.find((employee) => employee.username === username);
      const managerDepartmentIds = new Set(
        assignmentList.filter((item) => item.is_manager && Number(item.employee) === Number(current?.id)).map((item) => Number(item.department)),
      );
      const targetIds = [...new Set(assignmentList.filter((item) => managerDepartmentIds.has(Number(item.department)) && Number(item.employee) !== Number(current?.id)).map((item) => Number(item.employee)))];
      const results = await Promise.allSettled(targetIds.map((id) => axiosInstance.get<Score>(`/score/api/v1/employees/${id}/`)));
      const next: Record<number, number> = {};
      results.forEach((result, index) => {
        if (result.status !== "fulfilled") return;
        const data = result.value.data;
        const value = typeof data.score === "number" ? data.score : data.total_score;
        if (typeof value === "number") next[targetIds[index]] = value;
      });
      setScores(next);
    } catch {
      setError("دریافت اطلاعات دپارتمان و امتیازها انجام نشد.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hasHydrated, username]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSuccess = useCallback((action: Action, amount: number) => {
    if (selected) {
      setScores((current) => ({
        ...current,
        [selected.id]: Math.max(0, (current[selected.id] ?? 0) + (action === "add" ? amount : -amount)),
      }));
    }
    void load(true);
  }, [load, selected]);

  if (!hasHydrated || loading) {
    return <div className="flex min-h-28 items-center justify-center rounded-3xl border border-slate-200/70 bg-white p-6 dark:border-white/10 dark:bg-slate-900"><Loader2 className="animate-spin text-indigo-500" size={20} /></div>;
  }
  if (!managedAssignments.length) return null;

  return (
    <section dir="rtl" className="space-y-4 rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500"><Award size={21} /></div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">مدیریت امتیاز دپارتمان</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">امتیاز اعضای دپارتمان‌های تحت مدیریت شما</p>
          </div>
        </div>
        <button onClick={() => void load(true)} disabled={refreshing} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-50 dark:border-white/10 dark:text-slate-300">
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> بروزرسانی
        </button>
      </div>
      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-500">{error}</p>}
      {!team.length ? <div className="rounded-2xl bg-slate-500/5 px-4 py-8 text-center text-sm text-slate-500">در دپارتمان‌های تحت مدیریت شما کارمند دیگری ثبت نشده است.</div> : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {team.map((employee) => {
            const employeeDepartments = assignments.filter((item) => Number(item.employee) === employee.id && departmentIds.has(Number(item.department)));
            const score = scores[employee.id];
            return (
              <div key={employee.id} className="rounded-2xl border border-slate-200/70 p-4 dark:border-white/10">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/5"><Users size={18} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{employee.full_name || employee.username}</p>
                    <p className="mt-1 truncate text-[11px] text-slate-500">{employeeDepartments.map((item) => departmentNames.get(Number(item.department)) || item.department_name).filter(Boolean).join("، ")}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-black text-indigo-500">{score === undefined ? "—" : score.toLocaleString("fa-IR")}</p>
                    <p className="text-[10px] text-slate-500">امتیاز</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={() => { setSelectedAction("add"); setSelected(employee); }} className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-2.5 text-xs font-extrabold text-emerald-600 transition hover:bg-emerald-500/15"><Plus size={15} /> افزایش امتیاز</button>
                  <button onClick={() => { setSelectedAction("deduct"); setSelected(employee); }} className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-500/10 px-3 py-2.5 text-xs font-extrabold text-rose-600 transition hover:bg-rose-500/15"><Minus size={15} /> کسر امتیاز</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <AnimatePresence>
        {selected && <AdjustScoreModal isOpen employeeId={selected.id} employeeName={selected.full_name || selected.username} currentScore={scores[selected.id]} initialAction={selectedAction} onClose={() => setSelected(null)} onSuccess={handleSuccess} />}
      </AnimatePresence>
    </section>
  );
}
