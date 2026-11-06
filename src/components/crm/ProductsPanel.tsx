"use client";

import { useState } from "react";
import { Check, Package, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState } from "@/components/ui/Feedback";
import Pagination from "@/components/ui/Pagination";
import { ListSkeleton } from "@/components/ui/skeletons";
import { Switch } from "@/components/ui/Switch";
import { toast } from "@/components/notifications/toast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { usePermissions } from "@/hooks/usePermissions";
import { productsApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import type { FeedProduct } from "@/types/crm";
import { Card, SectionTitle } from "./ui";

function ProductRow({
  product,
  onChanged,
  onDelete,
  canEdit,
  canDelete,
}: {
  product: FeedProduct;
  onChanged: () => void;
  onDelete: (p: FeedProduct) => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [busy, setBusy] = useState(false);

  async function patch(payload: Partial<Pick<FeedProduct, "name" | "is_active">>) {
    setBusy(true);
    try {
      await productsApi.update(product.id, payload);
      onChanged();
      return true;
    } catch (e) {
      toast.error(apiMessage(e, "ذخیره‌ی تغییرات ناموفق بود"));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
        <Package size={16} />
      </span>

      {editing ? (
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === "Enter" && name.trim()) {
              if (await patch({ name: name.trim() })) setEditing(false);
            }
            if (e.key === "Escape") {
              setEditing(false);
              setName(product.name);
            }
          }}
          className="h-10 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-[13px] font-bold text-gray-900 outline-none focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
      ) : (
        <span
          className={`min-w-0 flex-1 truncate text-[13px] font-extrabold ${
            product.is_active ? "text-gray-900 dark:text-white" : "text-gray-400 line-through"
          }`}
        >
          {product.name}
        </span>
      )}

      {editing ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="ذخیره"
            disabled={busy || !name.trim()}
            onClick={async () => {
              if (await patch({ name: name.trim() })) setEditing(false);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 disabled:opacity-50 dark:bg-emerald-500/15"
          >
            <Check size={15} />
          </button>
          <button
            type="button"
            aria-label="انصراف"
            onClick={() => {
              setEditing(false);
              setName(product.name);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-white/10"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="hidden text-[10.5px] font-bold text-gray-400 sm:inline">
            {product.is_active ? "فعال" : "غیرفعال"}
          </span>
          {canEdit && <Switch
            checked={product.is_active}
            disabled={busy}
            onChange={(v) => void patch({ is_active: v })}
          />}
          {canEdit && <button
            type="button"
            aria-label="تغییر نام"
            onClick={() => setEditing(true)}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10"
          >
            <Pencil size={14} />
          </button>}
          {canDelete && <button
            type="button"
            aria-label="حذف"
            onClick={() => onDelete(product)}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
          >
            <Trash2 size={14} />
          </button>}
        </div>
      )}
    </li>
  );
}

/** مدیریت کالاها (فقط ادمین): نهاده‌هایی که می‌شود فروخت */
export default function ProductsPanel() {
  const { can } = usePermissions();
  const canCreate = can("products", "create");
  const canEdit = can("products", "edit");
  const canDelete = can("products", "delete");
  const list = usePaginatedList<FeedProduct>(
    (params, signal) => productsApi.page(params, signal),
    { pageSize: 20 },
  );

  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [toDelete, setToDelete] = useState<FeedProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function add() {
    const value = name.trim();
    if (!value) return;
    setAdding(true);
    try {
      await productsApi.create(value);
      setName("");
      list.refetch();
      toast.success("کالا اضافه شد");
    } catch (e) {
      toast.error(apiMessage(e, "افزودن کالا ناموفق بود"));
    } finally {
      setAdding(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await productsApi.remove(toDelete.id);
      setToDelete(null);
      list.refetch();
      toast.success("کالا حذف شد");
    } catch (e) {
      setDeleteError(apiMessage(e, "حذف کالا ناموفق بود"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card>
      <SectionTitle icon={<Package size={16} />} title="کالاهای قابل فروش" />

      {canCreate && <form
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
        className="mb-4 flex flex-col gap-2 sm:flex-row"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="نام کالا، مثلاً ذرت دامی"
          maxLength={255}
          className="h-11 min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white px-4 text-[13px] text-gray-900 outline-none placeholder:text-gray-400 focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
        <Button type="submit" icon={<Plus size={14} />} loading={adding} disabled={!name.trim()}>
          افزودن کالا
        </Button>
      </form>}

      {list.loading ? (
        <ListSkeleton rows={4} />
      ) : list.error ? (
        <ErrorState message="دریافت کالاها ناموفق بود" onRetry={list.refetch} />
      ) : list.data.length === 0 ? (
        <EmptyState
          title="هنوز کالایی تعریف نشده است"
          description="اولین کالا (مثلاً ذرت، جو یا کنجاله سویا) را اضافه کنید تا بتوان فروش ثبت کرد."
          icon={<Package size={26} />}
        />
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {list.data.map((p) => (
              <ProductRow
                key={p.id}
                product={p}
                onChanged={list.refetch}
                canEdit={canEdit}
                canDelete={canDelete}
                onDelete={(item) => {
                  setDeleteError(null);
                  setToDelete(item);
                }}
              />
            ))}
          </ul>
          {list.totalPages > 1 && (
            <div className="mt-3">
              <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} compact />
            </div>
          )}
        </>
      )}

      <p className="mt-4 text-[11px] leading-6 text-gray-400">
        کالایی که در فروش‌ها استفاده شده قابل حذف نیست؛ آن را غیرفعال کنید تا در فروش‌های جدید نمایش داده نشود.
      </p>

      <ConfirmDialog
        open={toDelete != null}
        title="حذف کالا"
        message={toDelete ? `«${toDelete.name}» حذف شود؟` : undefined}
        confirmLabel="حذف"
        danger
        loading={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </Card>
  );
}
