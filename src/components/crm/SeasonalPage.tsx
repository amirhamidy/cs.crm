"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarRange, ListChecks, Pencil, Phone, Plus, Sprout, Trash2 } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, PageHeader, SearchInput } from "@/components/ui/Feedback";
import { FloatingInput, FloatingTextarea } from "@/components/ui/FloatingField";
import { Modal } from "@/components/ui/Modal";
import { NiceSelect } from "@/components/ui/NiceSelect";
import AsyncSelect, { type AsyncOption } from "@/components/ui/AsyncSelect";
import Pagination from "@/components/ui/Pagination";
import { ListSkeleton, TableSkeleton } from "@/components/ui/skeletons";
import { toast } from "@/components/notifications/toast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { customersApi, productsApi, seasonalApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import { cleanDecimal, formatJalaliDate, formatNumber, formatWeight, isPositiveNumber } from "@/lib/crm/format";
import type { Customer } from "@/types/customer";
import type { FeedProduct, SeasonalSuggestions, SeasonalSupply, SuggestionGroup } from "@/types/crm";
import { SalesSelect } from "./SalesSelect";
import { MONTH_OPTIONS, monthName, monthRange } from "./seasonalShared";
import { Card, SectionTitle, Tabs } from "./ui";

type TabKey = "suggest" | "manage";


function GroupList({
  groups,
  basePath,
  history,
}: {
  groups: SuggestionGroup[];
  basePath: "/admin" | "/user";
  history?: boolean;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {groups.map((g) => (
        <div
          key={g.product.id}
          className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.03]"
        >
          <div className="mb-2 flex items-center gap-1.5 text-[13.5px] font-extrabold text-gray-900 dark:text-white">
            <Sprout size={14} className="text-emerald-500" />
            {g.product.name}
            <span className="text-[11px] font-bold text-gray-400">({formatNumber(g.customers.length)} مشتری)</span>
          </div>
          <ul className="flex flex-col gap-1.5">
            {g.customers.map((c) => (
              <li key={c.id} className="rounded-xl bg-white px-3 py-2 dark:bg-white/[0.04]">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`${basePath}/customer/${c.id}/`}
                    className="min-w-0 truncate text-[12.5px] font-extrabold text-gray-800 hover:text-brand dark:text-gray-100"
                  >
                    {c.full_name}
                    {c.company_name && (
                      <span className="ms-1 text-[10.5px] font-normal text-gray-400">{c.company_name}</span>
                    )}
                  </Link>
                  {c.phone_number && (
                    <a
                      href={`tel:${c.phone_number}`}
                      dir="ltr"
                      className="flex shrink-0 items-center gap-1 text-[11.5px] text-gray-500 hover:text-brand"
                    >
                      <Phone size={11} /> {c.phone_number}
                    </a>
                  )}
                </div>
                <div className="mt-0.5 text-[10.5px] text-gray-400">
                  {history ? (
                    <>
                      آخرین خرید: {formatJalaliDate(c.last_purchase_date)} · {c.purchases_count} بار ·{" "}
                      {formatWeight(c.total_quantity_kg)}
                    </>
                  ) : (
                    <>
                      {monthRange(c.start_month ?? 1, c.end_month ?? 1)}
                      {c.expected_quantity_kg ? ` · حدود ${formatWeight(c.expected_quantity_kg)}` : ""}
                      {c.notes ? ` · ${c.notes}` : ""}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Suggestions({ basePath }: { basePath: "/admin" | "/user" }) {
  const [month, setMonth] = useState<number | undefined>();
  const [data, setData] = useState<SeasonalSuggestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    seasonalApi
      .suggestions(month, controller.signal)
      .then(setData)
      .catch((e) => {
        if (!controller.signal.aborted) setError(apiMessage(e, "دریافت پیشنهادها ناموفق بود"));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [month, reload]);

  const shownMonth = month ?? data?.month ?? 1;
  const empty = data && !data.current.length && !data.upcoming.length && !data.from_history.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="max-w-xs">
        <SalesSelect
          label="ماه"
          avatar={false}
          searchable={false}
          options={MONTH_OPTIONS}
          value={shownMonth}
          onChange={setMonth}
        />
      </div>

      {loading && !data ? (
        <ListSkeleton rows={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setReload((n) => n + 1)} />
      ) : !data || empty ? (
        <EmptyState
          title="پیشنهادی برای این ماه نیست"
          description="از تب «فهرست فصلی» مشخص کنید هر مشتری چه کالایی را در چه ماه‌هایی دارد."
          icon={<Sprout size={26} />}
        />
      ) : (
        <>
          {data.current.length > 0 && (
            <Card>
              <SectionTitle
                icon={<Sprout size={16} />}
                title={`${data.month_name}: این کالاها را از این مشتری‌ها بخرید`}
              />
              <GroupList groups={data.current} basePath={basePath} />
            </Card>
          )}
          {data.upcoming.length > 0 && (
            <Card>
              <SectionTitle
                icon={<CalendarRange size={16} />}
                title={`از ${data.next_month_name} شروع می‌شود (آماده‌ی هماهنگی)`}
              />
              <GroupList groups={data.upcoming} basePath={basePath} />
            </Card>
          )}
          {data.from_history.length > 0 && (
            <Card>
              <SectionTitle
                icon={<ListChecks size={16} />}
                title={`در ${data.month_name}‌های قبل از اینها خرید کرده‌اید`}
              />
              <GroupList groups={data.from_history} basePath={basePath} history />
            </Card>
          )}
        </>
      )}
    </div>
  );
}


function SupplyForm({
  open,
  entry,
  onClose,
  onSaved,
}: {
  open: boolean;
  entry: SeasonalSupply | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [products, setProducts] = useState<FeedProduct[]>([]);
  const [customer, setCustomer] = useState<AsyncOption | null>(null);
  const [productId, setProductId] = useState<number | null>(null);
  const [from, setFrom] = useState<number | null>(null);
  const [to, setTo] = useState<number | null>(null);
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setSaving(false);
    setCustomer(entry ? { id: entry.customer, label: entry.customer_name, sub: entry.company_name } : null);
    setProductId(entry?.product ?? null);
    setFrom(entry?.start_month ?? null);
    setTo(entry?.end_month ?? null);
    setQty(entry?.expected_quantity_kg ? String(Number(entry.expected_quantity_kg)) : "");
    setNotes(entry?.notes ?? "");
    let alive = true;
    productsApi
      .active()
      .then((list) => {
        if (!alive) return;
        if (entry && !list.some((p) => p.id === entry.product)) {
          list = [...list, { id: entry.product, name: entry.product_name, is_active: false, created_at: "" }];
        }
        setProducts(list);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [open, entry]);

  const valid = customer != null && productId != null && from != null && to != null && (qty === "" || isPositiveNumber(qty));

  async function submit() {
    if (!valid || customer == null || productId == null || from == null || to == null) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        customer: customer.id,
        product: productId,
        start_month: from,
        end_month: to,
        expected_quantity_kg: qty === "" ? null : cleanDecimal(qty),
        notes: notes.trim(),
      };
      if (entry) await seasonalApi.update(entry.id, payload);
      else await seasonalApi.create(payload);
      onSaved();
      onClose();
    } catch (e) {
      setError(apiMessage(e, "ذخیره ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={saving}
      title={entry ? "ویرایش مشتری فصلی" : "مشتری فصلی جدید"}
      subtitle="این مشتری در چه ماه‌هایی چه کالایی دارد؟"
      icon={<Sprout size={18} />}
      footer={
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving} className="flex-1">
            انصراف
          </Button>
          <Button onClick={submit} disabled={!valid} loading={saving} className="flex-[2]">
            ذخیره
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 px-1 pb-1">
        <AsyncSelect<Customer>
          label="مشتری"
          placeholder="انتخاب مشتری"
          emptyText="مشتری‌ای یافت نشد"
          value={customer?.id ?? null}
          selected={customer}
          disabled={!!entry}
          fetcher={(params, signal) => customersApi.page(params, signal)}
          toOption={(c) => ({ id: c.id, label: c.full_name, sub: c.company_name || undefined })}
          onChange={setCustomer}
        />
        <NiceSelect
          label="کالا"
          placeholder="انتخاب کالا"
          options={products.map((p) => ({ id: p.id, label: p.name, sub: p.is_active ? undefined : "غیرفعال" }))}
          value={productId}
          onChange={setProductId}
        />
        <div className="grid grid-cols-2 gap-3">
          <NiceSelect label="از ماه" options={MONTH_OPTIONS} value={from} onChange={setFrom} />
          <NiceSelect label="تا ماه" options={MONTH_OPTIONS} value={to} onChange={setTo} />
        </div>
        {from != null && to != null && from > to && (
          <p className="text-[11.5px] text-gray-400">
            بازه از آخر سال به اول سال بعد می‌رود ({monthName(from)} تا {monthName(to)}).
          </p>
        )}
        <FloatingInput
          id="seasonal_qty"
          label="مقدار تقریبی به کیلوگرم (اختیاری)"
          inputMode="decimal"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
        <FloatingTextarea
          id="seasonal_notes"
          label="توضیحات (اختیاری)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        {error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
            <p className="flex-1 text-[12px] font-semibold leading-5 text-red-500 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}


function Manage({ basePath }: { basePath: "/admin" | "/user" }) {
  const { can } = usePermissions();
  const list = usePaginatedList<SeasonalSupply>(
    (params, signal) => seasonalApi.page(params, signal),
    { pageSize: 15 },
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SeasonalSupply | null>(null);
  const [toDelete, setToDelete] = useState<SeasonalSupply | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await seasonalApi.remove(toDelete.id);
      setToDelete(null);
      list.refetch();
      toast.success("حذف شد");
    } catch (e) {
      toast.error(apiMessage(e, "حذف ناموفق بود"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card>
      <SectionTitle
        icon={<ListChecks size={16} />}
        title={`فهرست مشتریان فصلی${list.count ? ` (${formatNumber(list.count)})` : ""}`}
        actions={
          can("seasonal", "create") ? (
            <Button
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              افزودن
            </Button>
          ) : undefined
        }
      />
      <div className="mb-3 max-w-sm">
        <SearchInput value={list.search} onChange={list.setSearch} placeholder="مشتری یا کالا..." hideIcon />
      </div>

      {list.loading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : list.error ? (
        <ErrorState message="دریافت فهرست ناموفق بود" onRetry={list.refetch} />
      ) : list.data.length === 0 ? (
        <EmptyState
          title="هنوز موردی ثبت نشده است"
          description="مثلاً: آقای الف، جو، از خرداد تا تیر."
          icon={<Sprout size={26} />}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {list.data.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-2 rounded-2xl border border-gray-100 bg-gray-50/60 p-3 dark:border-white/[0.06] dark:bg-white/[0.03]"
            >
              <div className="min-w-0">
                <div className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                  <Link href={`${basePath}/customer/${s.customer}/`} className="hover:text-brand">
                    {s.customer_name}
                  </Link>
                  <span className="mx-1.5 text-gray-300">·</span>
                  {s.product_name}
                </div>
                <div className="text-[11.5px] text-gray-500 dark:text-gray-400">
                  {monthRange(s.start_month, s.end_month)}
                  {s.expected_quantity_kg ? ` · حدود ${formatWeight(s.expected_quantity_kg)}` : ""}
                  {s.notes ? ` · ${s.notes}` : ""}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {can("seasonal", "edit") && (
                  <button
                    type="button"
                    aria-label="ویرایش"
                    onClick={() => {
                      setEditing(s);
                      setFormOpen(true);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10"
                  >
                    <Pencil size={14} />
                  </button>
                )}
                {can("seasonal", "delete") && (
                  <button
                    type="button"
                    aria-label="حذف"
                    onClick={() => setToDelete(s)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {list.totalPages > 1 && (
        <div className="mt-3">
          <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />
        </div>
      )}

      <SupplyForm open={formOpen} entry={editing} onClose={() => setFormOpen(false)} onSaved={() => {
        list.refetch();
        toast.success("ذخیره شد");
      }} />

      <ConfirmDialog
        open={toDelete != null}
        title="حذف مشتری فصلی"
        message="این مورد از فهرست و پیشنهادها حذف می‌شود. ادامه می‌دهید؟"
        confirmLabel="حذف"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </Card>
  );
}


export default function SeasonalPage({ basePath }: { basePath: "/admin" | "/user" }) {
  const [tab, setTab] = useState<TabKey>("suggest");

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageHeader
        icon={<Sprout size={20} />}
        title="مشتریان فصلی"
        subtitle="هر ماه ببینید کدام مشتری‌ها چه کالایی دارند و از چه کسی بخرید"
      />
      <Tabs<TabKey>
        label="بخش‌های مشتریان فصلی"
        value={tab}
        onChange={setTab}
        items={[
          { key: "suggest", label: "پیشنهاد ماه", icon: <Sprout size={14} /> },
          { key: "manage", label: "فهرست فصلی", icon: <ListChecks size={14} /> },
        ]}
      />
      {tab === "suggest" ? <Suggestions basePath={basePath} /> : <Manage basePath={basePath} />}
    </div>
  );
}
