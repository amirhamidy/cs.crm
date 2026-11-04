"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Package, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, PageHeader, SearchInput } from "@/components/ui/Feedback";
import Pagination from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { ListSkeleton, TableSkeleton } from "@/components/ui/skeletons";
import { toast } from "@/components/notifications/toast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { productsApi, salesApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import { formatJalaliDate, formatMoney, formatNumber, formatWeight, toNumber } from "@/lib/crm/format";
import { useAuthStore } from "@/store/authStore";
import type { FeedProduct, Sale, TopCustomerRow } from "@/types/crm";
import JalaliDateField from "./JalaliDateField";
import SaleFormModal from "./SaleFormModal";
import SalesTable from "./SalesTable";
import { Card, CARD, SectionTitle, StatTile, Tabs } from "./ui";
import ProductsPanel from "./ProductsPanel";

type TabKey = "sales" | "top" | "products";

type SaleFilters = {
  product: number | undefined;
  date_from: string | undefined;
  date_to: string | undefined;
};

function useProducts() {
  const [products, setProducts] = useState<FeedProduct[]>([]);
  useEffect(() => {
    let alive = true;
    productsApi
      .page({ page_size: 100 })
      .then((r) => alive && setProducts(r.results))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return products;
}

/* ───────────── تب فروش‌ها ───────────── */
function SalesList() {
  const userId = useAuthStore((s) => s.userId);
  const userType = useAuthStore((s) => s.userType);
  const products = useProducts();

  const list = usePaginatedList<Sale, SaleFilters>(
    (params, signal) =>
      salesApi.page(
        {
          page: params.page,
          page_size: params.page_size,
          search: params.search,
          product: params.product,
          date_from: params.date_from,
          date_to: params.date_to,
        },
        signal,
      ),
    { pageSize: 15, filters: { product: undefined, date_from: undefined, date_to: undefined } },
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [toDelete, setToDelete] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canModify = (s: Sale) => userType === 1 || s.created_by === userId;

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await salesApi.remove(toDelete.id);
      setToDelete(null);
      list.refetch();
      toast.success("فروش حذف شد");
    } catch (e) {
      setDeleteError(apiMessage(e, "حذف فروش ناموفق بود"));
    } finally {
      setDeleting(false);
    }
  }

  const { filters } = list;

  return (
    <div className="flex flex-col gap-4">
      <div className={`${CARD} grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-4`}>
        <SearchInput
          value={list.search}
          onChange={list.setSearch}
          placeholder="مشتری، شرکت، کالا..."
          className="xl:col-span-1"
        />
        <Select
          aria-label="کالا"
          options={[
            { value: "", label: "همه کالاها" },
            ...products.map((p) => ({ value: String(p.id), label: p.name })),
          ]}
          value={filters.product != null ? String(filters.product) : ""}
          onChange={(v) => list.setFilters({ product: v ? Number(v) : undefined })}
          searchable={products.length > 8}
        />
        <JalaliDateField
          label="از تاریخ"
          clearable
          value={filters.date_from ?? ""}
          onChange={(v) => list.setFilters({ date_from: v || undefined })}
        />
        <JalaliDateField
          label="تا تاریخ"
          clearable
          value={filters.date_to ?? ""}
          onChange={(v) => list.setFilters({ date_to: v || undefined })}
        />
      </div>

      <Card>
        <SectionTitle
          icon={<ShoppingBag size={16} />}
          title={`فروش‌ها${list.count ? ` (${formatNumber(list.count)})` : ""}`}
          actions={
            <Button
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              ثبت فروش
            </Button>
          }
        />

        {list.loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : list.error ? (
          <ErrorState message="دریافت فروش‌ها ناموفق بود" onRetry={list.refetch} />
        ) : list.data.length === 0 ? (
          <EmptyState
            title="فروشی پیدا نشد"
            description="فیلترها را تغییر دهید یا فروش جدید ثبت کنید."
            icon={<ShoppingBag size={26} />}
          />
        ) : (
          <>
            <SalesTable
              sales={list.data}
              canModify={canModify}
              onEdit={(s) => {
                setEditing(s);
                setFormOpen(true);
              }}
              onDelete={(s) => {
                setDeleteError(null);
                setToDelete(s);
              }}
            />
            {list.totalPages > 1 && (
              <div className="mt-3">
                <Pagination
                  page={list.page}
                  totalPages={list.totalPages}
                  onChange={list.setPage}
                  summary={`${formatNumber(list.count)} فروش`}
                />
              </div>
            )}
          </>
        )}
      </Card>

      <SaleFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        sale={editing}
        onSaved={() => {
          list.refetch();
          toast.success(editing ? "فروش ویرایش شد" : "فروش ثبت شد");
        }}
      />

      <ConfirmDialog
        open={toDelete != null}
        title="حذف فروش"
        message="این فروش از گزارش‌ها و جمع فروش مشتری حذف می‌شود. ادامه می‌دهید؟"
        confirmLabel="حذف"
        danger
        loading={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

/* ───────────── تب مشتریان برتر ───────────── */
function TopCustomers({ basePath }: { basePath: "/admin" | "/user" }) {
  const products = useProducts();
  const [by, setBy] = useState<"amount" | "quantity">("amount");
  const [product, setProduct] = useState<number | undefined>();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [limit, setLimit] = useState(10);

  const [rows, setRows] = useState<TopCustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await salesApi.topCustomers({
        by,
        limit,
        product,
        date_from: from || undefined,
        date_to: to || undefined,
      });
      setRows(r.results);
    } catch (e) {
      setError(apiMessage(e, "دریافت گزارش ناموفق بود"));
    } finally {
      setLoading(false);
    }
  }, [by, limit, product, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxValue = Math.max(
    1,
    ...rows.map((r) => toNumber(by === "amount" ? r.total_amount : r.total_quantity_kg)),
  );
  const totalAmount = rows.reduce((a, r) => a + toNumber(r.total_amount), 0);
  const totalKg = rows.reduce((a, r) => a + toNumber(r.total_quantity_kg), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className={`${CARD} grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-5`}>
        <Select
          aria-label="مرتب‌سازی بر اساس"
          options={[
            { value: "amount", label: "بر اساس مبلغ فروش" },
            { value: "quantity", label: "بر اساس مقدار (کیلوگرم)" },
          ]}
          value={by}
          onChange={(v) => setBy(v as "amount" | "quantity")}
        />
        <Select
          aria-label="کالا"
          options={[
            { value: "", label: "همه کالاها" },
            ...products.map((p) => ({ value: String(p.id), label: p.name })),
          ]}
          value={product != null ? String(product) : ""}
          onChange={(v) => setProduct(v ? Number(v) : undefined)}
        />
        <JalaliDateField label="از تاریخ" clearable value={from} onChange={setFrom} />
        <JalaliDateField label="تا تاریخ" clearable value={to} onChange={setTo} />
        <Select
          aria-label="تعداد نمایش"
          options={[10, 20, 50, 100].map((n) => ({ value: String(n), label: `${n.toLocaleString("fa-IR")} مشتری برتر` }))}
          value={String(limit)}
          onChange={(v) => setLimit(Number(v))}
        />
      </div>

      {loading ? (
        <ListSkeleton rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            title="در این بازه فروشی ثبت نشده است"
            description="بازه‌ی زمانی یا کالا را تغییر دهید."
            icon={<BarChart3 size={26} />}
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatTile label="مجموع فروش این فهرست" value={formatMoney(totalAmount)} tone="good" />
            <StatTile label="مجموع مقدار" value={formatWeight(totalKg)} />
            <StatTile
              label="مشتری برتر"
              value={rows[0].full_name}
              hint={by === "amount" ? formatMoney(rows[0].total_amount) : formatWeight(rows[0].total_quantity_kg)}
              tone="warn"
            />
          </div>

          <Card>
            <SectionTitle icon={<BarChart3 size={16} />} title="بیشترین فروش ما به مشتریان" />
            <ol className="flex flex-col gap-3.5">
              {rows.map((r) => {
                const value = toNumber(by === "amount" ? r.total_amount : r.total_quantity_kg);
                const pct = Math.max(3, Math.round((value / maxValue) * 100));
                return (
                  <li key={r.customer_id}>
                    <Link
                      href={`${basePath}/customer/${r.customer_id}/`}
                      className="group block rounded-2xl p-2 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-[12px] font-black text-gray-600 dark:bg-white/10 dark:text-gray-300">
                            {r.rank.toLocaleString("fa-IR")}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-[13px] font-extrabold text-gray-900 group-hover:text-brand dark:text-white">
                              {r.full_name}
                            </div>
                            <div className="truncate text-[10.5px] text-gray-400">
                              {r.company_name || "—"} • آخرین خرید {formatJalaliDate(r.last_sale_date)}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 text-left">
                          <div className="text-[13px] font-black text-gray-900 dark:text-white">
                            {by === "amount" ? formatMoney(r.total_amount) : formatWeight(r.total_quantity_kg)}
                          </div>
                          <div className="text-[10.5px] text-gray-400">
                            {by === "amount" ? formatWeight(r.total_quantity_kg) : formatMoney(r.total_amount)}
                          </div>
                        </div>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-teal-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 text-[10.5px] text-gray-400">
                        <span>{formatNumber(r.sales_count)} فروش</span>
                        {r.top_product && (
                          <span className="flex items-center gap-1">
                            <Package size={10} /> پرفروش‌ترین کالا: {r.top_product.name} (
                            {formatWeight(r.top_product.quantity_kg)})
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </Card>
        </>
      )}
    </div>
  );
}

/* ───────────── صفحه ───────────── */
export default function SalesPage({ basePath }: { basePath: "/admin" | "/user" }) {
  const userType = useAuthStore((s) => s.userType);
  const [tab, setTab] = useState<TabKey>("sales");

  const items = [
    { key: "sales" as const, label: "فروش‌ها", icon: <ShoppingBag size={14} /> },
    { key: "top" as const, label: "مشتریان برتر", icon: <BarChart3 size={14} /> },
    ...(userType === 1
      ? [{ key: "products" as const, label: "کالاها", icon: <Package size={14} /> }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageHeader
        icon={<ShoppingBag size={20} />}
        title="فروش"
        subtitle="ثبت فروش به مشتریان و گزارش بیشترین خرید"
      />
      <Tabs<TabKey> label="بخش‌های فروش" items={items} value={tab} onChange={setTab} />
      {tab === "sales" && <SalesList />}
      {tab === "top" && <TopCustomers basePath={basePath} />}
      {tab === "products" && userType === 1 && <ProductsPanel />}
    </div>
  );
}
