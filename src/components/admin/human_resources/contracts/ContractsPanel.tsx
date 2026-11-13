"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Ban, BadgeCheck, FileSignature, Loader2, PenLine, Pencil, Plus, Search, Send, Trash2, UserRound, X } from "lucide-react";
import { contractsApi, validateSignature } from "@/lib/api/contracts";
import { departmentsApi, type DepartmentChoice } from "@/lib/api/departments";
import { parseApiError } from "@/lib/minutesUtils";
import Pagination from "@/components/ui/Pagination";
import SignatureCanvas from "@/components/ui/SignatureCanvas";
import Modal from "@/components/minutes/Modal";
import { BTN_GHOST, BTN_PRIMARY, INPUT, LABEL } from "@/components/minutes/ui";

const ACTION_BASE = "flex h-8 items-center justify-center gap-1.5 rounded-full px-3 text-[11px] font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50";
const ACTION_PRIMARY = `${ACTION_BASE} bg-indigo-600 text-white hover:bg-indigo-500`;
const ACTION_GHOST = `${ACTION_BASE} bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-white/[0.04] dark:text-gray-300`;
import { getEmployees } from "../humanResourceApi";
import { CONTRACT_FILTERS, CONTRACT_STATUS, PAGE_SIZE, formatFaDate } from "./contractUtils";
import type { Contract, ContractStatus } from "@/types/contract";

type SignMode = "sign" | "register";

interface EmployeeOption {
  id: number;
  name: string;
}

function StatusBadge({ status }: { status: ContractStatus }) {
  const meta = CONTRACT_STATUS[status];
  return <span className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold ${meta.className}`}>{meta.label}</span>;
}

function ContractFormModal({
  contract,
  onClose,
  onSaved,
}: {
  contract: Contract | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(contract?.title ?? "");
  const [content, setContent] = useState(contract?.content ?? "");
  const [employee, setEmployee] = useState<number | "">(contract?.employee ?? "");
  const [department, setDepartment] = useState<number | "">(contract?.department ?? "");
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentChoice[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    getEmployees()
      .then((r) => {
        if (alive) setEmployees(r.data.map((e) => ({ id: e.id, name: e.full_name || e.username })));
      })
      .catch((e) => alive && setError(parseApiError(e, "خطا در دریافت کارمندان").message));
    departmentsApi
      .choices()
      .then((r) => alive && setDepartments(r))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const submit = async () => {
    const local: Record<string, string> = {};
    if (!title.trim()) local.title = "عنوان الزامی است.";
    if (!content.trim()) local.content = "متن قرارداد الزامی است.";
    if (employee === "") local.employee = "کارمند را انتخاب کنید.";
    setFields(local);
    if (Object.keys(local).length || employee === "") return;
    setBusy(true);
    setError("");
    try {
      const payload = { title: title.trim(), content, employee, department: department === "" ? null : department };
      if (contract) await contractsApi.update(contract.id, payload);
      else await contractsApi.create(payload);
      onSaved();
    } catch (e) {
      const p = parseApiError(e, "ذخیره قرارداد ناموفق بود");
      setError(p.message);
      setFields(p.fields);
      setBusy(false);
    }
  };

  const err = (k: string) => (fields[k] ? <p className="mt-1 text-[11px] text-red-500">{fields[k]}</p> : null);

  return (
    <Modal title={contract ? "ویرایش قرارداد" : "قرارداد جدید"} onClose={onClose} busy={busy} maxWidthClass="max-w-2xl">
      <div className="flex flex-col gap-3">
        <div>
          <label className={LABEL}>عنوان</label>
          <input className={INPUT} value={title} onChange={(e) => setTitle(e.target.value)} />
          {err("title")}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={LABEL}>کارمند</label>
            <select className={INPUT} value={employee} onChange={(e) => setEmployee(e.target.value ? Number(e.target.value) : "")}>
              <option value="">انتخاب کنید</option>
              {employees.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
            {err("employee")}
          </div>
          <div>
            <label className={LABEL}>دپارتمان</label>
            <select className={INPUT} value={department} onChange={(e) => setDepartment(e.target.value ? Number(e.target.value) : "")}>
              <option value="">بدون دپارتمان</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {err("department")}
          </div>
        </div>
        <div>
          <label className={LABEL}>متن قرارداد</label>
          <textarea className={`${INPUT} min-h-[180px]`} value={content} onChange={(e) => setContent(e.target.value)} />
          {err("content")}
        </div>
        {error && <p className="text-[12px] font-semibold text-red-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className={BTN_GHOST} onClick={onClose} disabled={busy}>انصراف</button>
          <button type="button" className={BTN_PRIMARY} onClick={submit} disabled={busy}>
            {busy && <Loader2 size={14} className="animate-spin" />} ذخیره
          </button>
        </div>
      </div>
    </Modal>
  );
}

function SignModal({
  contract,
  mode,
  onClose,
  onDone,
}: {
  contract: Contract;
  mode: SignMode;
  onClose: () => void;
  onDone: () => void;
}) {
  const [signature, setSignature] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const invalid = validateSignature(signature);
    if (invalid || !signature) {
      setError(invalid ?? "");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const mine = await contractsApi.mySignatures();
      const target = mine.find((m) => (typeof m.contract === "object" ? m.contract?.id : m.contract) === contract.id);
      if (!target) {
        setError("رکورد امضای این قرارداد برای شما پیدا نشد.");
        setBusy(false);
        return;
      }
      if (mode === "sign") await contractsApi.sign(target.id, signature);
      else await contractsApi.registerSignature(target.id, signature);
      onDone();
    } catch (e) {
      setError(parseApiError(e, "ثبت امضا ناموفق بود").message);
      setBusy(false);
    }
  };

  return (
    <Modal title={mode === "sign" ? "امضای قرارداد" : "ثبت امضای کارفرما"} onClose={onClose} busy={busy} maxWidthClass="max-w-2xl">
      <div className="flex flex-col gap-3">
        <p className="text-[12px] text-gray-500">{contract.title}</p>
        <SignatureCanvas onChange={(v) => { setSignature(v); setError(""); }} disabled={busy} />
        {error && <p className="text-[12px] font-semibold text-red-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className={BTN_GHOST} onClick={onClose} disabled={busy}>انصراف</button>
          <button type="button" className={BTN_PRIMARY} onClick={submit} disabled={busy || !signature}>
            {busy && <Loader2 size={14} className="animate-spin" />} تأیید و ثبت امضا
          </button>
        </div>
      </div>
    </Modal>
  );
}

function SignatureImage({ src, label }: { src?: string | null; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-bold text-gray-500">{label}</span>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="h-24 rounded-xl border border-black/10 bg-white object-contain" />
      ) : (
        <span className="text-[11.5px] text-gray-400">ثبت نشده</span>
      )}
    </div>
  );
}

function DetailModal({ contract, onClose }: { contract: Contract; onClose: () => void }) {
  return (
    <Modal title={contract.title} onClose={onClose} maxWidthClass="max-w-2xl">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-gray-500">
          <StatusBadge status={contract.status} />
          {contract.employee_name && <span>{contract.employee_name}</span>}
          {contract.department_name && <span>· {contract.department_name}</span>}
          <span>· {formatFaDate(contract.created_at)}</span>
        </div>
        <p className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl bg-black/[0.03] p-3 text-[12.5px] leading-7 dark:bg-white/[0.04]">
          {contract.content}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SignatureImage src={contract.employee_signature} label="امضای کارمند" />
          <SignatureImage src={contract.employer_signature} label="امضای کارفرما" />
        </div>
        {contract.signed_at && <p className="text-[11.5px] text-gray-500">تاریخ امضا: {formatFaDate(contract.signed_at)}</p>}
      </div>
    </Modal>
  );
}

export default function ContractsPanel({ canManage = false }: { canManage?: boolean }) {
  const [items, setItems] = useState<Contract[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ContractStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [form, setForm] = useState<{ contract: Contract | null } | null>(null);
  const [signing, setSigning] = useState<{ contract: Contract; mode: SignMode } | null>(null);
  const [detail, setDetail] = useState<Contract | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        const r = await contractsApi.list({ page, page_size: PAGE_SIZE, search, status }, signal);
        setItems(r.results);
        setCount(r.count);
      } catch (e) {
        if (signal?.aborted) return;
        setError(parseApiError(e, "خطا در دریافت قراردادها").message);
        setItems([]);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [page, search, status],
  );

  useEffect(() => {
    const c = new AbortController();
    load(c.signal);
    return () => c.abort();
  }, [load]);

  const act = async (c: Contract, fn: () => Promise<unknown>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusyId(c.id);
    setActionError("");
    try {
      await fn();
      await load();
    } catch (e) {
      setActionError(parseApiError(e, "انجام عملیات ناموفق بود").message);
    } finally {
      setBusyId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const afterChange = () => {
    setForm(null);
    setSigning(null);
    load();
  };

  const draftCount = items.filter((c) => c.status === "draft").length;
  const pendingCount = items.filter((c) => c.status === "pending").length;
  const signedCount = items.filter((c) => c.status === "signed").length;

  return (
    <div className="space-y-4 p-3 sm:p-5" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[1.45rem] border border-gray-100 bg-white p-3 shadow-sm dark:border-white/[0.06] dark:bg-[#111827]"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm">
              <FileSignature size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">قراردادها</h1>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-50 px-1.5 text-[9.5px] font-extrabold text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                  {count.toLocaleString("fa-IR")}
                </span>
              </div>
              <p className="mt-0.5 text-[10.5px] font-semibold text-gray-400">مدیریت و امضای قراردادهای کارمندان</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 sm:w-64">
              <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="جستجوی قرارداد..."
                aria-label="جست‌وجو"
                className="h-9 w-full rounded-full border border-gray-100 bg-gray-50 pr-9 pl-9 text-[11px] font-semibold text-gray-800 outline-none transition focus:border-indigo-400 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white"
              />
              {searchInput && (
                <button type="button" onClick={() => setSearchInput("")} className="absolute left-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:text-gray-600">
                  <X size={11} />
                </button>
              )}
            </div>

            {canManage && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setForm({ contract: null })}
                className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-indigo-600 px-4 text-[11px] font-extrabold text-white transition hover:bg-indigo-500"
              >
                <Plus size={13} />
                قرارداد جدید
              </motion.button>
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
            <p className="text-[9.5px] font-semibold text-gray-400">کل قراردادها</p>
            <p className="mt-0.5 text-[13px] font-extrabold text-gray-800 dark:text-white">{count.toLocaleString("fa-IR")}</p>
          </div>
          <div className="rounded-xl bg-gray-100/70 px-3 py-2 dark:bg-white/[0.04]">
            <p className="text-[9.5px] font-semibold text-gray-500">پیش‌نویس</p>
            <p className="mt-0.5 text-[13px] font-extrabold text-gray-700 dark:text-gray-200">{draftCount}</p>
          </div>
          <div className="rounded-xl bg-amber-50/70 px-3 py-2 dark:bg-amber-500/[0.07]">
            <p className="text-[9.5px] font-semibold text-amber-500">در انتظار امضا</p>
            <p className="mt-0.5 text-[13px] font-extrabold text-amber-600 dark:text-amber-400">{pendingCount}</p>
          </div>
          <div className="rounded-xl bg-emerald-50/70 px-3 py-2 dark:bg-emerald-500/[0.07]">
            <p className="text-[9.5px] font-semibold text-emerald-500">امضا شده</p>
            <p className="mt-0.5 text-[13px] font-extrabold text-emerald-600 dark:text-emerald-400">{signedCount}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {CONTRACT_FILTERS.map((f) => (
            <button
              key={f.value || "all"}
              type="button"
              onClick={() => { setStatus(f.value); setPage(1); }}
              aria-pressed={status === f.value}
              className={`h-8 rounded-full px-3 text-[11px] font-extrabold transition ${status === f.value ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-white/[0.03] dark:text-gray-400"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {actionError && <p className="text-[12px] font-semibold text-red-500">{actionError}</p>}

      {loading ? (
        <div className="flex h-32 items-center justify-center rounded-[1.45rem] border border-gray-100 bg-white dark:border-white/[0.06] dark:bg-[#111827]">
          <Loader2 size={20} className="animate-spin text-indigo-500" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 rounded-[1.45rem] border border-gray-100 bg-white py-10 dark:border-white/[0.06] dark:bg-[#111827]">
          <p className="text-[12.5px] font-semibold text-red-500">{error}</p>
          <button type="button" onClick={() => load()} className="text-[12px] font-bold text-indigo-500">تلاش مجدد</button>
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex min-h-[230px] flex-col items-center justify-center rounded-[1.45rem] border border-dashed border-gray-200 bg-white text-center dark:border-white/[0.07] dark:bg-[#111827]"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-500/10 dark:to-violet-500/10">
            {search ? <Search size={19} className="text-indigo-400" /> : <FileSignature size={19} className="text-indigo-400" />}
          </div>
          <h3 className="text-[12.5px] font-extrabold text-gray-800 dark:text-white">قراردادی پیدا نشد</h3>
          <p className="mt-1.5 max-w-xs text-[10.5px] font-semibold leading-5 text-gray-400">
            {search || status ? "نتیجه‌ای مطابق جستجو یا فیلتر شما وجود ندارد." : "هنوز قراردادی ثبت نشده است."}
          </p>
        </motion.div>
      ) : (
        <motion.div layout className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {items.map((c, i) => {
              const busy = busyId === c.id;
              return (
                <motion.div key={c.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.035 }}>
                  <div className="group overflow-hidden rounded-[1.45rem] border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-xl hover:shadow-black/[0.04] dark:border-white/[0.06] dark:bg-[#111827] dark:hover:shadow-black/20">
                    <div className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm">
                          <FileSignature size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <button type="button" onClick={() => setDetail(c)} className="block max-w-full truncate text-right text-[13px] font-extrabold text-gray-900 transition hover:text-indigo-500 dark:text-white">
                                {c.title}
                              </button>
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-white/[0.06]">
                                  <UserRound size={10} className="text-gray-400" />
                                </span>
                                <span className="truncate text-[10.5px] font-semibold text-gray-400">
                                  {c.employee_name ?? "—"}{c.department_name ? ` · ${c.department_name}` : ""}
                                </span>
                              </div>
                            </div>
                            <StatusBadge status={c.status} />
                          </div>
                          <p className="mt-1.5 text-[10.5px] font-semibold text-gray-400">{formatFaDate(c.created_at)}</p>
                        </div>
                      </div>

                      <div className="mt-3 h-px bg-gray-100 dark:bg-white/[0.06]" />

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {canManage && c.status === "draft" && (
                          <>
                            <button type="button" disabled={busy} className={ACTION_GHOST} onClick={() => setForm({ contract: c })}><Pencil size={12} /> ویرایش</button>
                            <button type="button" disabled={busy} className={ACTION_PRIMARY} onClick={() => act(c, () => contractsApi.send(c.id), "قرارداد برای امضا ارسال شود؟")}><Send size={12} /> ارسال</button>
                            <button type="button" disabled={busy} className={ACTION_GHOST} onClick={() => act(c, () => contractsApi.remove(c.id), "قرارداد حذف شود؟")}><Trash2 size={12} /> حذف</button>
                          </>
                        )}
                        {canManage && c.status === "pending" && (
                          <>
                            {!c.employer_signature && (
                              <button type="button" disabled={busy} className={ACTION_PRIMARY} onClick={() => setSigning({ contract: c, mode: "register" })}><BadgeCheck size={12} /> ثبت امضای کارفرما</button>
                            )}
                            <button type="button" disabled={busy} className={ACTION_GHOST} onClick={() => act(c, () => contractsApi.cancel(c.id), "قرارداد لغو شود؟")}><Ban size={12} /> لغو</button>
                          </>
                        )}
                        {!canManage && c.status === "pending" && (
                          <button type="button" disabled={busy} className={ACTION_PRIMARY} onClick={() => setSigning({ contract: c, mode: "sign" })}><PenLine size={12} /> امضا</button>
                        )}
                        <button type="button" disabled={busy} className={ACTION_GHOST} onClick={() => setDetail(c)}>جزئیات</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {!loading && !error && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} summary={`${count.toLocaleString("fa-IR")} قرارداد`} />
      )}

      {form && <ContractFormModal contract={form.contract} onClose={() => setForm(null)} onSaved={afterChange} />}
      {signing && <SignModal contract={signing.contract} mode={signing.mode} onClose={() => setSigning(null)} onDone={afterChange} />}
      {detail && <DetailModal contract={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
