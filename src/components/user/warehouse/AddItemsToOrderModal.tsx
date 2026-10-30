"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { AlertTriangle, Check, CheckCircle2, Loader2, MapPin, PackagePlus, Search, X } from "lucide-react";
import type { ApiOrderTask } from "@/types/warehouse";
import type { PicklistProduct } from "@/types/warehouseShelf";
import { addItemsToOrder, fetchPicklist } from "@/lib/warehouseShelfApi";
import { useWarehouseShelves } from "@/hooks/useWarehouseShelves";
import { extractApiError, formatQuantity, formatToman, parseQuantity, sanitizeQuantityInput } from "@/utils/warehouseShelf";
import ShelfFilterBar from "./ShelfFilterBar";

interface Props {
  isOpen: boolean;
  orderTaskId: number;
  orderTaskTitle?: string;
  warehouseId: number | null;
  onClose: () => void;
  onAdded: (orderTask: ApiOrderTask) => void;
}

type SelectedEntry = {
  product: PicklistProduct;
  quantity: string;
};

type ShelfGroup = {
  key: string;
  label: string;
  items: PicklistProduct[];
};

const NO_SHELF_KEY = "__no_shelf__";

export default function AddItemsToOrderModal({
  isOpen,
  orderTaskId,
  orderTaskTitle,
  warehouseId,
  onClose,
  onAdded,
}: Props) {
  const [shelfCode, setShelfCode] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [items, setItems] = useState<PicklistProduct[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listError, setListError] = useState("");

  const [selected, setSelected] = useState<Record<number, SelectedEntry>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const requestRef = useRef<AbortController | null>(null);

  const { shelves, loading: shelvesLoading } = useWarehouseShelves(isOpen, reloadKey);

  useEffect(() => {
    if (!isOpen) return;

    setShelfCode("");
    setSearchInput("");
    setSearch("");
    setInStockOnly(false);
    setItems([]);
    setCount(0);
    setPage(1);
    setListError("");
    setSelected({});
    setSubmitError("");
    setSuccessMessage("");
    setSubmitting(false);
  }, [isOpen, orderTaskId]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    setLoading(true);
    setListError("");
    setPage(1);

    fetchPicklist(
      {
        warehouseId,
        orderTaskId,
        shelfCode: shelfCode || undefined,
        search,
        inStock: inStockOnly && warehouseId != null,
        page: 1,
      },
      controller.signal,
    )
      .then((result) => {
        if (controller.signal.aborted) return;
        setItems(result.items);
        setCount(result.count);
      })
      .catch((err) => {
        if (controller.signal.aborted || err?.code === "ERR_CANCELED") return;
        setItems([]);
        setCount(0);
        setListError(extractApiError(err, "دریافت لیست کالاها انجام نشد"));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [isOpen, warehouseId, orderTaskId, shelfCode, search, inStockOnly, reloadKey]);

  const loadMore = useCallback(async () => {
    if (loadingMore || loading) return;

    const nextPage = page + 1;
    setLoadingMore(true);
    setListError("");

    try {
      const result = await fetchPicklist({
        warehouseId,
        orderTaskId,
        shelfCode: shelfCode || undefined,
        search,
        inStock: inStockOnly && warehouseId != null,
        page: nextPage,
      });

      setItems((prev) => {
        const known = new Set(prev.map((item) => item.id));
        return [...prev, ...result.items.filter((item) => !known.has(item.id))];
      });
      setCount(result.count);
      setPage(nextPage);
    } catch (err) {
      setListError(extractApiError(err, "دریافت ادامه لیست انجام نشد"));
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loading, page, warehouseId, orderTaskId, shelfCode, search, inStockOnly]);

  const groups = useMemo<ShelfGroup[]>(() => {
    const map = new Map<string, ShelfGroup>();

    items.forEach((product) => {
      const code = (product.shelf_code ?? "").trim();
      const key = code || NO_SHELF_KEY;
      if (!map.has(key)) {
        map.set(key, { key, label: code || "بدون قفسه", items: [] });
      }
      map.get(key)!.items.push(product);
    });

    const list = Array.from(map.values());
    const withShelf = list.filter((group) => group.key !== NO_SHELF_KEY);
    const withoutShelf = list.filter((group) => group.key === NO_SHELF_KEY);
    return [...withShelf, ...withoutShelf];
  }, [items]);

  const selectedList = useMemo(() => Object.values(selected), [selected]);
  const selectedCount = selectedList.length;
  const alreadyInOrderCount = selectedList.filter((entry) => entry.product.in_order).length;
  const hasMore = items.length < count;

  function toggleProduct(product: PicklistProduct) {
    if (submitting) return;

    setSubmitError("");
    setSuccessMessage("");

    setSelected((prev) => {
      if (prev[product.id]) {
        const next = { ...prev };
        delete next[product.id];
        return next;
      }
      return { ...prev, [product.id]: { product, quantity: "1" } };
    });
  }

  function updateQuantity(productId: number, value: string) {
    setSubmitError("");
    setSelected((prev) => {
      const entry = prev[productId];
      if (!entry) return prev;
      return { ...prev, [productId]: { ...entry, quantity: sanitizeQuantityInput(value) } };
    });
  }

  function clearSelection() {
    if (submitting) return;
    setSelected({});
    setSubmitError("");
  }

  async function handleSubmit() {
    if (submitting || selectedCount === 0) return;

    const payload: { product_id: number; quantity: number }[] = [];

    for (const entry of selectedList) {
      const quantity = parseQuantity(entry.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        setSubmitError(`تعداد «${entry.product.name}» باید بزرگ‌تر از صفر باشد`);
        return;
      }
      payload.push({ product_id: entry.product.id, quantity });
    }

    setSubmitting(true);
    setSubmitError("");
    setSuccessMessage("");

    try {
      const updatedOrder = await addItemsToOrder(orderTaskId, payload);
      setSuccessMessage(`${formatQuantity(payload.length)} کالا به فاکتور اضافه شد`);
      setSelected({});
      setReloadKey((key) => key + 1);
      onAdded(updatedOrder);
    } catch (err) {
      setSubmitError(extractApiError(err, "افزودن کالاها به فاکتور انجام نشد"));
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (submitting) return;
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4"
        >
          <m.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
            className="relative flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl dark:border-white/[0.06] dark:bg-[#111827]"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/[0.06]">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10">
                  <PackagePlus size={18} className="text-indigo-500" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                    افزودن کالا به فاکتور
                  </h2>
                  <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                    {orderTaskTitle
                      ? `${orderTaskTitle} · سفارش #${formatQuantity(orderTaskId)}`
                      : `سفارش #${formatQuantity(orderTaskId)}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.06]"
              >
                <X size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-3 border-b border-gray-100 px-5 py-3.5 dark:border-white/[0.06]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search
                    size={14}
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="جستجو در نام کالا یا کد قفسه"
                    autoComplete="off"
                    className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-3 pr-9 text-[12.5px] text-gray-900 outline-none transition-colors focus:border-indigo-400 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                  />
                </div>

                {warehouseId != null && (
                  <button
                    type="button"
                    onClick={() => setInStockOnly((value) => !value)}
                    className={`flex shrink-0 items-center justify-center gap-1.5 rounded-2xl border px-3.5 py-2.5 text-[11.5px] font-bold transition-colors ${
                      inStockOnly
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-gray-200 text-gray-600 hover:border-emerald-300 dark:border-white/[0.08] dark:text-gray-300"
                    }`}
                  >
                    {inStockOnly && <Check size={12} />}
                    فقط کالاهای موجود
                  </button>
                )}
              </div>

              <ShelfFilterBar
                shelves={shelves}
                value={shelfCode}
                onChange={setShelfCode}
                loading={shelvesLoading}
              />
            </div>

            <div className="min-h-[220px] flex-1 overflow-y-auto px-5 py-4">
              {loading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 size={22} className="animate-spin text-indigo-500" />
                </div>
              ) : listError && items.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
                  <AlertTriangle size={20} className="text-red-500" />
                  <p className="text-[12px] font-semibold text-red-500">{listError}</p>
                  <button
                    type="button"
                    onClick={() => setReloadKey((key) => key + 1)}
                    className="rounded-xl bg-gray-100 px-3 py-1.5 text-[11.5px] font-bold text-gray-700 hover:bg-gray-200 dark:bg-white/[0.06] dark:text-gray-200"
                  >
                    تلاش دوباره
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-[12px] font-semibold text-gray-400">
                  کالایی برای نمایش وجود ندارد
                </div>
              ) : (
                <div className="space-y-5">
                  {groups.map((group) => (
                    <section key={group.key}>
                      <div className="mb-2 flex items-center gap-2">
                        <MapPin
                          size={12}
                          className={
                            group.key === NO_SHELF_KEY ? "text-gray-400" : "text-indigo-500"
                          }
                        />
                        <h3
                          className="text-[12px] font-extrabold text-gray-700 dark:text-gray-200"
                          dir={group.key === NO_SHELF_KEY ? "rtl" : "ltr"}
                        >
                          {group.key === NO_SHELF_KEY ? group.label : `قفسه ${group.label}`}
                        </h3>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                          {formatQuantity(group.items.length)}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {group.items.map((product) => {
                          const entry = selected[product.id];
                          const isSelected = Boolean(entry);
                          const stock = product.current_stock;
                          const noStock = warehouseId != null && stock != null && Number(stock) <= 0;
                          const categoryName = product.name_category ?? product.category_name ?? "";

                          return (
                            <div
                              key={product.id}
                              className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors ${
                                isSelected
                                  ? "border-indigo-400 bg-indigo-50/60 dark:border-indigo-400/50 dark:bg-indigo-500/10"
                                  : "border-gray-100 bg-gray-50/60 dark:border-white/[0.06] dark:bg-white/[0.03]"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => toggleProduct(product)}
                                aria-pressed={isSelected}
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                                  isSelected
                                    ? "border-indigo-500 bg-indigo-500 text-white"
                                    : "border-gray-300 bg-white dark:border-white/20 dark:bg-transparent"
                                }`}
                              >
                                {isSelected && <Check size={14} strokeWidth={3} />}
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleProduct(product)}
                                className="min-w-0 flex-1 text-right"
                              >
                                <p className="truncate text-[12.5px] font-extrabold text-gray-900 dark:text-white">
                                  {product.name}
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] font-semibold text-gray-500 dark:text-gray-400">
                                  {categoryName && <span>{categoryName}</span>}
                                  {product.unit_label && <span>{product.unit_label}</span>}
                                  <span>{formatToman(product.sale_price)} تومان</span>

                                  {warehouseId != null && stock != null && (
                                    <span
                                      className={`rounded-lg px-1.5 py-0.5 text-[10px] font-extrabold ${
                                        noStock
                                          ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300"
                                          : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                                      }`}
                                    >
                                      {noStock
                                        ? "موجودی صفر"
                                        : `موجودی: ${formatQuantity(stock)}`}
                                    </span>
                                  )}

                                  {product.in_order && (
                                    <span className="rounded-lg bg-amber-50 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                                      در فاکتور: {formatQuantity(product.ordered_quantity)}
                                    </span>
                                  )}
                                </div>
                              </button>

                              {isSelected && (
                                <div className="flex shrink-0 flex-col items-center gap-0.5">
                                  <span className="text-[9.5px] font-bold text-gray-400">تعداد</span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    dir="ltr"
                                    value={entry.quantity}
                                    onChange={(e) => updateQuantity(product.id, e.target.value)}
                                    onFocus={(e) => e.currentTarget.select()}
                                    disabled={submitting}
                                    className="w-20 rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-center text-[12.5px] font-extrabold text-gray-900 outline-none focus:border-indigo-400 dark:border-white/[0.1] dark:bg-white/[0.06] dark:text-white"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}

                  {hasMore && (
                    <div className="flex justify-center pt-1">
                      <button
                        type="button"
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2 text-[12px] font-bold text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-60 dark:bg-white/[0.06] dark:text-gray-200 dark:hover:bg-white/[0.1]"
                      >
                        {loadingMore && <Loader2 size={13} className="animate-spin" />}
                        نمایش بیشتر
                      </button>
                    </div>
                  )}

                  {listError && (
                    <p className="text-center text-[11.5px] font-semibold text-red-500">
                      {listError}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2.5 border-t border-gray-100 px-5 py-4 dark:border-white/[0.06]">
              {alreadyInOrderCount > 0 && (
                <div className="flex items-start gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-5 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>
                    {formatQuantity(alreadyInOrderCount)} مورد از کالاهای انتخابی از قبل در فاکتور
                    هستند و تعداد جدید به تعداد قبلی اضافه می‌شود.
                  </span>
                </div>
              )}

              {submitError && (
                <p className="rounded-2xl bg-red-50 px-3 py-2 text-[11.5px] font-semibold leading-5 text-red-600 dark:bg-red-500/10 dark:text-red-300">
                  {submitError}
                </p>
              )}

              {successMessage && (
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-[11.5px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <CheckCircle2 size={14} />
                  {successMessage}
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[11.5px] font-bold text-gray-600 dark:text-gray-300">
                  <span>
                    {selectedCount > 0
                      ? `${formatQuantity(selectedCount)} کالا انتخاب شده`
                      : "کالایی انتخاب نشده"}
                  </span>
                  {selectedCount > 0 && (
                    <button
                      type="button"
                      onClick={clearSelection}
                      disabled={submitting}
                      className="text-[11px] font-bold text-red-500 hover:underline disabled:opacity-50"
                    >
                      پاک کردن
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={submitting}
                    className="rounded-2xl px-4 py-2.5 text-[12px] font-bold text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/[0.06]"
                  >
                    بستن
                  </button>
                  <m.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={submitting || selectedCount === 0}
                    className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-[12.5px] font-extrabold text-white shadow-lg shadow-indigo-600/25 transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <PackagePlus size={14} />
                    )}
                    افزودن به فاکتور
                  </m.button>
                </div>
              </div>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
