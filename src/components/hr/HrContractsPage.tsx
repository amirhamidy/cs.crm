"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Loader2, PenLine, UserCog, Plus, RefreshCw, Send, Trash2, XCircle } from "lucide-react";
import { hrContractsApi } from "@/lib/hrContractsApi";
import { formatDateTime, parseApiError } from "@/lib/minutesUtils";
import SignModal from "@/components/minutes/SignModal";
import ConfirmDialog from "@/components/minutes/ConfirmDialog";
import Modal from "@/components/minutes/Modal";
import { BTN_GHOST, BTN_PRIMARY, CARD, INPUT, LABEL } from "@/components/minutes/ui";
import { accountsApi } from "@/lib/api/accounts";
import type { ContractStatus, HrContractDetail, HrContractListItem, HrSignature, HrSummary } from "@/types/hrContracts";

const STATUS: Record<ContractStatus, string> = {
  draft: "پیش‌نویس",
  pending: "در انتظار امضا",
  completed: "تکمیل‌شده",
  cancelled: "لغوشده",
};

type Action = { kind: "send" | "cancel" | "delete"; item: HrContractListItem };

export default function HrContractsPage() {
  const [summary, setSummary] = useState<HrSummary | null>(null);
  const [items, setItems] = useState<HrContractListItem[]>([]);
  const [status, setStatus] = useState<ContractStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signing, setSigning] = useState<HrContractListItem | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [creating, setCreating] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [pickResp, setPickResp] = useState(false);

  const canManage = !!summary?.can_manage;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [s, list] = await Promise.all([hrContractsApi.summary(), hrContractsApi.list({ status })]);
      setSummary(s);
      setItems(list);
    } catch (e) {
      setError(parseApiError(e, "خطا در دریافت قراردادها").message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const runAction = async () => {
    if (!action) return;
    setActionBusy(true);
    setActionError("");
    try {
      if (action.kind === "send") await hrContractsApi.send(action.item.id);
      else if (action.kind === "cancel") await hrContractsApi.cancel(action.item.id);
      else await hrContractsApi.remove(action.item.id);
      setAction(null);
      await load();
    } catch (e) {
      setActionError(parseApiError(e).message);
    } finally {
      setActionBusy(false);
    }
  };

  const submitSign = async (img: string) => {
    if (!signing?.my_signature) return;
    try {
      await hrContractsApi.sign(signing.my_signature, img);
      setSigning(null);
      await load();
    } catch (e) {
      return parseApiError(e, "ثبت امضا ناموفق بود").message;
    }
  };

  const labels = { send: "ارسال", cancel: "لغو", delete: "حذف" } as const;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">قراردادهای منابع انسانی</h1>
          {summary && (
            <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">
              {summary.pending_signatures.toLocaleString("fa-IR")} امضای در انتظار •{" "}
              {summary.visible_contracts.toLocaleString("fa-IR")} قرارداد
              {summary.responsible ? ` • مسئول: ${summary.responsible.name}` : ""}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {summary?.is_admin && (
            <button type="button" className={BTN_GHOST} onClick={() => setPickResp(true)}>
              <UserCog size={14} /> مسئول HR
            </button>
          )}
          {canManage && (
            <button type="button" className={BTN_PRIMARY} onClick={() => setCreating(true)}>
              <Plus size={14} /> قرارداد جدید
            </button>
          )}
          <button type="button" className={BTN_GHOST} onClick={load} disabled={loading} aria-label="بارگذاری مجدد">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <select className={INPUT} value={status} onChange={(e) => setStatus(e.target.value as ContractStatus | "")}>
        <option value="">همه وضعیت‌ها</option>
        {(Object.keys(STATUS) as ContractStatus[]).map((k) => (
          <option key={k} value={k}>{STATUS[k]}</option>
        ))}
      </select>

      {loading && <Loader2 className="mx-auto animate-spin text-gray-400" />}
      {!loading && error && <p className="text-center text-[12.5px] font-semibold text-red-500">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="py-12 text-center text-[12.5px] text-gray-500">قراردادی یافت نشد</p>
      )}

      <ul className="flex flex-col gap-2.5">
        {items.map((c) => (
          <li key={c.id} className={`${CARD} flex flex-col gap-2 p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-extrabold text-gray-800 dark:text-gray-100">{c.title}</p>
                <p className="mt-1 text-[11.5px] text-gray-400">
                  {c.department_name} • {formatDateTime(c.sent_at ?? c.created_at)}
                </p>
                <p className="mt-1 text-[11.5px] text-gray-500">
                  امضا: {c.signed_count.toLocaleString("fa-IR")} از {c.signatures_count.toLocaleString("fa-IR")}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-bold text-gray-600 dark:bg-white/5 dark:text-gray-300">
                {STATUS[c.status]}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {c.status === "pending" && c.my_signature != null && !c.i_signed && (
                <button type="button" className={BTN_PRIMARY} onClick={() => setSigning(c)}>
                  <PenLine size={14} /> منتظر امضای شما
                </button>
              )}
              {c.i_signed && <span className="text-[11.5px] font-semibold text-emerald-500">امضا کرده‌اید</span>}
              {(canManage || c.my_signature != null) && (
                <button type="button" className={BTN_GHOST} onClick={() => setDetailId(c.id)}>
                  <Eye size={14} /> جزئیات
                </button>
              )}
              {canManage && c.status === "draft" && (
                <button type="button" className={BTN_GHOST} onClick={() => setAction({ kind: "send", item: c })}>
                  <Send size={14} /> ارسال
                </button>
              )}
              {canManage && (c.status === "draft" || c.status === "pending") && (
                <button type="button" className={BTN_GHOST} onClick={() => setAction({ kind: "cancel", item: c })}>
                  <XCircle size={14} /> لغو
                </button>
              )}
              {canManage && (
                <button type="button" className={BTN_GHOST} onClick={() => setAction({ kind: "delete", item: c })}>
                  <Trash2 size={14} /> حذف
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {signing && <SignModal title={`امضای ${signing.title}`} onSubmit={submitSign} onClose={() => setSigning(null)} />}
      {action && (
        <ConfirmDialog
          title={`${labels[action.kind]} قرارداد`}
          description={`«${action.item.title}» ${labels[action.kind]} شود؟${action.kind === "send" ? " برای اعضای دپارتمان پیامک ارسال می‌شود." : ""}`}
          confirmLabel={labels[action.kind]}
          tone={action.kind === "send" ? "primary" : "danger"}
          loading={actionBusy}
          error={actionError}
          onConfirm={runAction}
          onCancel={() => setAction(null)}
        />
      )}
      {detailId != null && (
        <DetailModal id={detailId} canManage={canManage} onClose={() => setDetailId(null)} onChanged={load} />
      )}
      {pickResp && summary && (
        <ResponsibleModal
          current={summary.responsible?.id ?? null}
          onClose={() => setPickResp(false)}
          onDone={() => { setPickResp(false); load(); }}
        />
      )}
      {creating && summary && (
        <CreateModal
          departments={summary.departments}
          onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); load(); }}
        />
      )}
    </div>
  );
}

function CreateModal({ departments, onClose, onCreated }: {
  departments: HrSummary["departments"]; onClose: () => void; onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState<number | "">(departments[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!title.trim() || !department) return setError("عنوان و دپارتمان الزامی است.");
    setBusy(true);
    setError("");
    try {
      await hrContractsApi.create({ title: title.trim(), department: Number(department), body });
      onCreated();
    } catch (e) {
      setError(parseApiError(e).message);
      setBusy(false);
    }
  };

  return (
    <Modal title="قرارداد جدید" onClose={onClose} busy={busy}>
      <div className="flex flex-col gap-3">
        <div>
          <label className={LABEL}>عنوان</label>
          <input className={INPUT} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>دپارتمان</label>
          <select className={INPUT} value={department} onChange={(e) => setDepartment(Number(e.target.value))}>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>متن قرارداد</label>
          <textarea className={INPUT} rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        {error && <p className="text-[12px] font-semibold text-red-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className={BTN_GHOST} onClick={onClose} disabled={busy}>انصراف</button>
          <button type="button" className={BTN_PRIMARY} onClick={submit} disabled={busy}>ثبت</button>
        </div>
      </div>
    </Modal>
  );
}

function DetailModal({ id, canManage, onClose, onChanged }: {
  id: number; canManage: boolean; onClose: () => void; onChanged: () => void;
}) {
  const [data, setData] = useState<HrContractDetail | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [images, setImages] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    try {
      setData(await hrContractsApi.get(id));
    } catch (e) {
      setError(parseApiError(e, "قرارداد پیدا نشد").message);
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const register = async (sig: HrSignature) => {
    setBusyId(sig.id);
    setError("");
    try {
      await hrContractsApi.register(sig.id);
      await load();
      onChanged();
    } catch (e) {
      setError(parseApiError(e).message);
    } finally {
      setBusyId(null);
    }
  };

  const showImage = async (sig: HrSignature) => {
    setBusyId(sig.id);
    try {
      const d = await hrContractsApi.getSignature(sig.id);
      if (d.signature_image) setImages((m) => ({ ...m, [sig.id]: d.signature_image as string }));
    } catch (e) {
      setError(parseApiError(e).message);
    } finally {
      setBusyId(null);
    }
  };

  const sigs = Array.isArray(data?.signatures) ? data!.signatures! : [];
  const text = (data?.body ?? data?.description) as string | undefined;

  return (
    <Modal title={data?.title ?? "قرارداد"} onClose={onClose} maxWidthClass="max-w-2xl">
      <div className="flex flex-col gap-3">
        {!data && !error && <Loader2 className="mx-auto animate-spin text-gray-400" />}
        {text && <p className="whitespace-pre-wrap text-[12.5px] leading-6 text-gray-700 dark:text-gray-200">{text}</p>}
        {error && <p className="text-[12px] font-semibold text-red-500">{error}</p>}
        {sigs.map((sig) => (
          <div key={sig.id} className={`${CARD} flex flex-col gap-2 p-3`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12.5px] font-bold">{sig.user_name ?? `امضا ${sig.id}`}</span>
              <span className={`text-[11.5px] font-semibold ${sig.is_signed ? "text-emerald-500" : "text-amber-500"}`}>
                {sig.is_signed ? `امضا شد${sig.signed_at ? " • " + formatDateTime(sig.signed_at) : ""}` : "امضا نشده"}
              </span>
            </div>
            {canManage && (
              <div className="flex gap-2">
                {!sig.is_signed && data?.status === "pending" && (
                  <button type="button" className={BTN_GHOST} disabled={busyId === sig.id} onClick={() => register(sig)}>
                    <PenLine size={14} /> ثبت امضا به جای کارمند
                  </button>
                )}
                {sig.is_signed && !images[sig.id] && (
                  <button type="button" className={BTN_GHOST} disabled={busyId === sig.id} onClick={() => showImage(sig)}>
                    <Eye size={14} /> نمایش امضا
                  </button>
                )}
              </div>
            )}
            {images[sig.id] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[sig.id]} alt="امضا" className="h-24 rounded-lg bg-white object-contain p-1" />
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}

function ResponsibleModal({ current, onClose, onDone }: {
  current: number | null; onClose: () => void; onDone: () => void;
}) {
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [sel, setSel] = useState<number | "">(current ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    accountsApi.employees.all().then((list) =>
      setUsers(list.map((e) => ({ id: (e.user_id ?? e.user ?? e.id) as number, name: e.full_name || e.username }))),
    ).catch(() => setError("دریافت کارمندان ناموفق بود"));
  }, []);

  const save = async (value: number | null) => {
    setBusy(true);
    setError("");
    try {
      await hrContractsApi.setResponsible(value);
      onDone();
    } catch (e) {
      const p = parseApiError(e);
      setError(p.fields.user || p.message);
      setBusy(false);
    }
  };

  return (
    <Modal title="مسئول منابع انسانی" onClose={onClose} busy={busy}>
      <div className="flex flex-col gap-3">
        <select className={INPUT} value={sel} onChange={(e) => setSel(e.target.value ? Number(e.target.value) : "")}>
          <option value="">— انتخاب کارمند —</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        {error && <p className="text-[12px] font-semibold text-red-500">{error}</p>}
        <div className="flex justify-between gap-2">
          <button type="button" className={BTN_GHOST} disabled={busy || current == null} onClick={() => save(null)}>برداشتن مسئول</button>
          <button type="button" className={BTN_PRIMARY} disabled={busy || sel === ""} onClick={() => save(Number(sel))}>ثبت</button>
        </div>
      </div>
    </Modal>
  );
}
