"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { customerPortalApi, customersApi } from "@/lib/api";
import type { PortalOrder, OrderStatus } from "@/types/portal";
import type { Customer } from "@/types/customer";
import AsyncSelect, { type AsyncOption } from "@/components/ui/AsyncSelect";
import Pagination from "@/components/ui/Pagination";
import { NiceSelect, type SelectOption } from "@/components/ui/NiceSelect";
import { FloatingInput, FloatingTextarea } from "@/components/ui/FloatingField";
import { apiMessage } from "@/lib/apiMessage";
import { toast } from "@/components/notifications/toast";

type Decision = "confirmed" | "rejected";
type Filters = { status?: OrderStatus; customer?: number };

const LABELS: Record<OrderStatus, string> = {
  pending: "در انتظار بررسی",
  confirmed: "تأیید شد",
  rejected: "رد شد",
  cancelled: "لغو توسط مشتری",
};
const TONES: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  cancelled: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
};

// NiceSelect works with numeric ids, so map them to statuses
const STATUS_OPTIONS: (SelectOption & { value: OrderStatus | "all" })[] = [
  { id: 1, value: "pending", label: "در انتظار بررسی" },
  { id: 2, value: "confirmed", label: "تأیید شده" },
  { id: 3, value: "rejected", label: "رد شده" },
  { id: 4, value: "cancelled", label: "لغو شده" },
  { id: 5, value: "all", label: "همه وضعیت‌ها" },
];

const money = (n: number) => `${n.toLocaleString("fa-IR")} تومان`;

function StatusPill({ order, size = "sm" }: { order: PortalOrder; size?: "sm" | "md" }) {
  const pad = size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-1 text-[10px]";
  return (
    <span className={`rounded-full font-bold ${pad} ${TONES[order.status]}`}>
      {order.status_display || LABELS[order.status]}
    </span>
  );
}

function OrderDetailModal({
  order,
  onDecide,
  onClose,
}: {
  order: PortalOrder;
  onDecide: (d: Decision) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 dark:bg-gray-900">
        <div className="mb-4 flex justify-between">
          <div>
            <h2 className="font-black">سفارش #{order.id}</h2>
            <p className="mt-1 text-xs text-gray-500">{order.customer_name} · {order.company_name}</p>
          </div>
          <button onClick={onClose} aria-label="بستن"><X size={18} /></button>
        </div>
        <StatusPill order={order} size="md" />
        <div className="my-4 space-y-2">
          {order.items.map((i) => (
            <div key={i.id} className="flex justify-between border-b border-gray-100 py-2 text-sm dark:border-white/10">
              <span>{i.product_name} × {i.quantity}</span>
              <b>{money(i.line_total)}</b>
            </div>
          ))}
        </div>
        {order.note && <p className="mb-3 rounded-xl bg-gray-50 p-3 text-xs dark:bg-white/5">یادداشت مشتری: {order.note}</p>}
        {order.staff_note && <p className="mb-3 rounded-xl bg-indigo-50 p-3 text-xs dark:bg-indigo-500/10">یادداشت کارشناس: {order.staff_note}</p>}
        <p className="mb-4 text-left font-black">{money(order.total_price)}</p>
        {order.status === "pending" && (
          <div className="flex gap-2">
            <button onClick={() => onDecide("confirmed")} className="flex-1 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white">تأیید سفارش</button>
            <button onClick={() => onDecide("rejected")} className="flex-1 rounded-xl bg-rose-600 py-3 text-xs font-bold text-white">رد سفارش</button>
          </div>
        )}
        <button onClick={onClose} className="mt-2 w-full rounded-xl bg-gray-100 py-3 text-xs font-bold dark:bg-white/10">بستن</button>
      </div>
    </div>
  );
}

function DecisionModal({
  decision,
  busy,
  error,
  note,
  onNote,
  onSubmit,
  onClose,
}: {
  decision: Decision;
  busy: boolean;
  error: string | null;
  note: string;
  onNote: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 dark:bg-gray-900">
        <h3 className="font-black">{decision === "confirmed" ? "تأیید سفارش" : "رد سفارش"}</h3>
        <p className="mb-4 mt-2 text-xs text-gray-500">
          {decision === "rejected" ? "پیشنهاد می‌شود دلیل رد سفارش را برای مشتری بنویسید." : "پیام اختیاری برای مشتری"}
        </p>
        <FloatingTextarea id="decision-note" label="پیام به مشتری" value={note} onChange={(e) => onNote(e.target.value)} rows={4} />
        {error && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button disabled={busy} onClick={onSubmit} className="flex-1 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white disabled:opacity-50">
            {busy ? "در حال ثبت..." : "ثبت وضعیت"}
          </button>
          <button disabled={busy} onClick={onClose} className="rounded-xl bg-gray-100 px-4 py-3 text-xs font-bold dark:bg-white/10">انصراف</button>
        </div>
      </div>
    </div>
  );
}

export default function CustomerOrdersPage() {
  const [statusId, setStatusId] = useState(1);
  const [customer, setCustomer] = useState<AsyncOption | null>(null);
  const [selected, setSelected] = useState<PortalOrder | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const list = usePaginatedList<PortalOrder, Filters>(
    (params, signal) => customerPortalApi.orders.page(params, signal),
    { pageSize: 15, filters: { status: "pending" } },
  );

  const openDecision = (order: PortalOrder, value: Decision) => {
    setSelected(order);
    setDecision(value);
    setNote("");
    setDecisionError(null);
  };

  const closeDecision = () => {
    if (!busy) setDecision(null);
  };

  const submitDecision = async () => {
    if (!selected || !decision) return;
    setBusy(true);
    setDecisionError(null);
    try {
      const updated = await customerPortalApi.orders.setStatus(selected.id, decision, note);
      setSelected(updated);
      setDecision(null);
      list.refetch();
      toast.success(decision === "confirmed" ? "سفارش تأیید شد" : "سفارش رد شد");
    } catch (e) {
      setDecisionError(apiMessage(e, "تغییر وضعیت سفارش انجام نشد"));
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = (id: number) => {
    setStatusId(id);
    const value = STATUS_OPTIONS.find((o) => o.id === id)?.value ?? "all";
    list.setFilters({ ...list.filters, status: value === "all" ? undefined : value });
  };

  const changeCustomer = (option: AsyncOption | null) => {
    setCustomer(option);
    list.setFilters({ ...list.filters, customer: option?.id });
  };

  return (
    <section dir="rtl">
      <div className="mb-6">
        <h1 className="text-[15px] font-black">سفارش‌های مشتریان</h1>
        <p className="mt-1 text-xs text-gray-500">بررسی و تعیین وضعیت سفارش‌های ثبت‌شده</p>
      </div>

      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_220px_220px]">
        <FloatingInput
          id="orders-search"
          label="جستجوی مشتری، شرکت، موبایل یا نام کاربری"
          value={list.search}
          onChange={(e) => list.setSearch(e.target.value)}
          autoComplete="off"
        />
        <NiceSelect label="وضعیت" options={STATUS_OPTIONS} value={statusId} onChange={changeStatus} />
        <AsyncSelect<Customer>
          label="فیلتر مشتری"
          placeholder="انتخاب مشتری..."
          emptyText="مشتری پیدا نشد"
          value={customer?.id ?? null}
          selected={customer}
          fetcher={(p, s) => customersApi.page(p, s)}
          toOption={(c) => ({ id: c.id, label: c.full_name, sub: c.company_name })}
          onChange={changeCustomer}
        />
      </div>
      {customer && (
        <button onClick={() => changeCustomer(null)} className="mb-3 text-xs text-indigo-600">حذف فیلتر مشتری ×</button>
      )}

      {list.loading ? (
        <div className="py-16 text-center text-sm text-gray-500">در حال دریافت سفارش‌ها...</div>
      ) : list.error ? (
        <div className="py-12 text-center text-sm text-rose-500">
          دریافت سفارش‌ها انجام نشد <button onClick={list.refetch} className="underline">تلاش مجدد</button>
        </div>
      ) : !list.data.length ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-500 dark:border-white/10">
          سفارشی با این فیلتر پیدا نشد
        </div>
      ) : (
        <div className="space-y-3">
          {list.data.map((o) => (
            <article key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <button onClick={() => setSelected(o)} className="min-w-0 flex-1 text-right">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-extrabold">#{o.id} · {o.customer_name}</h2>
                  <StatusPill order={o} />
                </div>
                <p className="mt-1 text-xs text-gray-500">{o.company_name} · {o.customer_phone}</p>
                <p className="mt-2 text-[11px] text-gray-400">
                  {new Date(o.created_at).toLocaleString("fa-IR")} · {o.items.length} قلم
                </p>
              </button>
              <div className="text-left">
                <p className="font-black">{money(o.total_price)}</p>
                {o.status === "pending" && (
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => openDecision(o, "confirmed")} aria-label="تأیید" className="rounded-lg bg-emerald-600 px-3 py-2 text-white"><CheckCircle2 size={14} /></button>
                    <button onClick={() => openDecision(o, "rejected")} aria-label="رد" className="rounded-lg bg-rose-600 px-3 py-2 text-white"><XCircle size={14} /></button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {list.totalPages > 1 && (
        <div className="mt-6"><Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} /></div>
      )}

      {selected && (
        <OrderDetailModal order={selected} onDecide={(d) => openDecision(selected, d)} onClose={() => setSelected(null)} />
      )}
      {decision && selected && (
        <DecisionModal
          decision={decision}
          busy={busy}
          error={decisionError}
          note={note}
          onNote={setNote}
          onSubmit={() => void submitDecision()}
          onClose={closeDecision}
        />
      )}
    </section>
  );
}
