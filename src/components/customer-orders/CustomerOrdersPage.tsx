
"use client";

import { useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
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
import { Backdrop } from "@/components/ui/Backdrop";
import { panelMotion } from "@/lib/motion";

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

const STATUS_OPTIONS: (SelectOption & { value: OrderStatus | "all" })[] = [
  { id: 1, value: "pending", label: "در انتظار بررسی" },
  { id: 2, value: "confirmed", label: "تأیید شده" },
  { id: 3, value: "rejected", label: "رد شده" },
  { id: 4, value: "cancelled", label: "لغو شده" },
  { id: 5, value: "all", label: "همه وضعیت‌ها" },
];

const money = (n: number) => `${n.toLocaleString("fa-IR")} تومان`;

function StatusPill({
  order,
  size = "sm",
}: {
  order: PortalOrder;
  size?: "sm" | "md";
}) {
  const pad =
    size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-1 text-[10px]";

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
  const reduced = useReducedMotion() ?? false;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <Backdrop onClick={onClose} />
      <m.div
        {...panelMotion(false, reduced)}
        className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 dark:bg-gray-900"
      >
        <div className="mb-4 flex justify-between">
          <div>
            <h2 className="font-black">سفارش #{order.id}</h2>
            <p className="mt-1 text-xs text-gray-500">
              {order.customer_name} · {order.company_name}
            </p>
          </div>

          <button onClick={onClose} aria-label="بستن">
            <X size={18} />
          </button>
        </div>

        <StatusPill order={order} size="md" />

        <div className="my-4 space-y-2">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between border-b border-gray-100 py-2 text-sm dark:border-white/10"
            >
              <span>
                {item.product_name} × {item.quantity}
              </span>
              <b>{money(item.line_total)}</b>
            </div>
          ))}
        </div>

        {order.note && (
          <p className="mb-3 rounded-xl bg-gray-50 p-3 text-xs dark:bg-white/5">
            یادداشت مشتری: {order.note}
          </p>
        )}

        {order.staff_note && (
          <p className="mb-3 rounded-xl bg-indigo-50 p-3 text-xs dark:bg-indigo-500/10">
            یادداشت کارشناس: {order.staff_note}
          </p>
        )}

        <p className="mb-4 text-left font-black">
          {money(order.total_price)}
        </p>

        {order.status === "pending" && (
          <div className="flex gap-2">
            <button
              onClick={() => onDecide("confirmed")}
              className="flex-1 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white"
            >
              تأیید سفارش
            </button>

            <button
              onClick={() => onDecide("rejected")}
              className="flex-1 rounded-xl bg-rose-600 py-3 text-xs font-bold text-white"
            >
              رد سفارش
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-2 w-full rounded-xl bg-gray-100 py-3 text-xs font-bold dark:bg-white/10"
        >
          بستن
        </button>
      </m.div>
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
  const isReject = decision === "rejected";
  const reduced = useReducedMotion() ?? false;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <Backdrop onClick={() => !busy && onClose()} />
      <m.div
        {...panelMotion(false, reduced)}
        className="relative w-full max-w-md rounded-3xl bg-white p-6 dark:bg-gray-900"
      >
        <h3 className="font-black">
          {isReject ? "رد درخواست مشتری" : "تأیید درخواست مشتری"}
        </h3>

        <p className="mb-4 mt-2 text-xs text-gray-500">
          {isReject
            ? "در صورت امکان دلیل رد درخواست را برای مشتری بنویسید."
            : "در صورت نیاز یادداشتی برای مشتری ثبت کنید."}
        </p>

        <FloatingTextarea
          id="decision-note"
          label="یادداشت کارشناس"
          value={note}
          onChange={(e) => onNote(e.target.value)}
          rows={4}
        />

        {error && (
          <p className="mt-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            disabled={busy}
            onClick={onSubmit}
            className={`flex-1 rounded-xl py-3 text-xs font-bold text-white disabled:opacity-50 ${isReject ? "bg-rose-600" : "bg-emerald-600"
              }`}
          >
            {busy
              ? "در حال ثبت..."
              : isReject
                ? "ثبت رد درخواست"
                : "ثبت تأیید درخواست"}
          </button>

          <button
            disabled={busy}
            onClick={onClose}
            className="rounded-xl bg-gray-100 px-4 py-3 text-xs font-bold dark:bg-white/10"
          >
            انصراف
          </button>
        </div>
      </m.div>
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
    { pageSize: 15, filters: { status: "pending" } }
  );

  const openDecision = (order: PortalOrder, value: Decision) => {
    setSelected(order);
    setDecision(value);
    setNote("");
    setDecisionError(null);
  };

  const closeDecision = () => {
    if (!busy) {
      setDecision(null);
      setDecisionError(null);
    }
  };

  const submitDecision = async () => {
    if (!selected || !decision || busy) return;

    setBusy(true);
    setDecisionError(null);

    try {
      const updated =
        decision === "confirmed"
          ? await customerPortalApi.orders.approve(selected.id, note)
          : await customerPortalApi.orders.reject(selected.id, note);

      setSelected(updated);
      setDecision(null);
      setNote("");

      list.refetch();

      toast.success(
        decision === "confirmed"
          ? "درخواست مشتری با موفقیت تأیید شد"
          : "درخواست مشتری با موفقیت رد شد"
      );
    } catch (error) {
      setDecisionError(
        apiMessage(error, "تغییر وضعیت درخواست مشتری انجام نشد")
      );
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = (id: number) => {
    setStatusId(id);

    const value =
      STATUS_OPTIONS.find((option) => option.id === id)?.value ?? "all";

    list.setFilters({
      ...list.filters,
      status: value === "all" ? undefined : value,
    });
  };

  const changeCustomer = (option: AsyncOption | null) => {
    setCustomer(option);

    list.setFilters({
      ...list.filters,
      customer: option?.id,
    });
  };

  return (
    <section dir="rtl">
      <div className="mb-6">
        <h1 className="text-[15px] font-black">سفارش‌های مشتریان</h1>
        <p className="mt-1 text-xs text-gray-500">
          بررسی و تعیین وضعیت سفارش‌های ثبت‌شده
        </p>
      </div>

      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_220px_220px]">
        <FloatingInput
          id="orders-search"
          label="جستجوی مشتری، شرکت، موبایل یا نام کاربری"
          value={list.search}
          onChange={(e) => list.setSearch(e.target.value)}
          autoComplete="off"
        />

        <NiceSelect
          label="وضعیت"
          options={STATUS_OPTIONS}
          value={statusId}
          onChange={changeStatus}
        />

        <AsyncSelect<Customer>
          label="فیلتر مشتری"
          placeholder="انتخاب مشتری..."
          emptyText="مشتری پیدا نشد"
          value={customer?.id ?? null}
          selected={customer}
          fetcher={(params, signal) => customersApi.page(params, signal)}
          toOption={(item) => ({
            id: item.id,
            label: item.full_name,
            sub: item.company_name,
          })}
          onChange={changeCustomer}
        />
      </div>

      {customer && (
        <button
          onClick={() => changeCustomer(null)}
          className="mb-3 text-xs text-indigo-600"
        >
          حذف فیلتر مشتری ×
        </button>
      )}

      {list.loading ? (
        <div className="py-16 text-center text-sm text-gray-500">
          در حال دریافت سفارش‌ها...
        </div>
      ) : list.error ? (
        <div className="py-12 text-center text-sm text-rose-500">
          دریافت سفارش‌ها انجام نشد{" "}
          <button onClick={list.refetch} className="underline">
            تلاش مجدد
          </button>
        </div>
      ) : !list.data.length ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-500 dark:border-white/10">
          سفارشی با این فیلتر پیدا نشد
        </div>
      ) : (
        <div className="space-y-3">
          {list.data.map((order) => (
            <article
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]"
            >
              <button
                onClick={() => setSelected(order)}
                className="min-w-0 flex-1 text-right"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-extrabold">
                    #{order.id} · {order.customer_name}
                  </h2>

                  <StatusPill order={order} />
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  {order.company_name} · {order.customer_phone}
                </p>

                <p className="mt-2 text-[11px] text-gray-400">
                  {new Date(order.created_at).toLocaleString("fa-IR")} ·{" "}
                  {order.items.length} قلم
                </p>
              </button>

              <div className="text-left">
                <p className="font-black">
                  {money(order.total_price)}
                </p>

                {order.status === "pending" && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => openDecision(order, "confirmed")}
                      aria-label="تأیید"
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-white"
                    >
                      <CheckCircle2 size={14} />
                    </button>

                    <button
                      onClick={() => openDecision(order, "rejected")}
                      aria-label="رد"
                      className="rounded-lg bg-rose-600 px-3 py-2 text-white"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {list.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            page={list.page}
            totalPages={list.totalPages}
            onChange={list.setPage}
          />
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <OrderDetailModal
            key="detail"
            order={selected}
            onDecide={(value) => openDecision(selected, value)}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {decision && selected && (
          <DecisionModal
            key="decision"
            decision={decision}
            busy={busy}
            error={decisionError}
            note={note}
            onNote={setNote}
            onSubmit={() => void submitDecision()}
            onClose={closeDecision}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
