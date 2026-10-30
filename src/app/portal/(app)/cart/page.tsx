"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingBag } from "lucide-react";
import { usePortalCartStore, type PortalCartItem } from "@/store/portalCartStore";
import { portalApi } from "@/lib/portal/portalApi";
import { apiMessage } from "@/lib/apiMessage";
import { toEnglishDigits } from "@/lib/digits";
import { toast } from "@/components/notifications/toast";
import type { PortalProduct } from "@/types/portal";

const fmt = (n: number) => n.toLocaleString("fa-IR");

/** Quantity input keeps a text draft; commits on blur/Enter so "0." or "" can be typed. */
function QuantityInput({ item }: { item: PortalCartItem }) {
  const setQuantity = usePortalCartStore((s) => s.setQuantity);
  const { product, quantity } = item;
  const [draft, setDraft] = useState(String(quantity));

  useEffect(() => setDraft(String(quantity)), [quantity]);

  const commit = () => {
    const value = Number(toEnglishDigits(draft).replace("٫", "."));
    if (!Number.isFinite(value) || value <= 0) {
      setDraft(String(quantity)); // invalid: revert
      return;
    }
    if (value > product.available_quantity) toast.error(`حداکثر موجودی ${fmt(product.available_quantity)} است`);
    setQuantity(product.id, value);
    setDraft(String(Math.min(value, product.available_quantity)));
  };

  return (
    <input
      dir="ltr"
      inputMode="decimal"
      value={draft}
      onChange={(e) => {
        const v = toEnglishDigits(e.target.value);
        if (/^\d*\.?\d*$/.test(v)) setDraft(v);
      }}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      autoComplete="off"
      className="w-24 rounded-lg border border-gray-200 bg-transparent px-2 py-2 text-center text-sm dark:border-white/10"
    />
  );
}

export default function PortalCartPage() {
  const router = useRouter();
  const items = usePortalCartStore((s) => s.items);
  const { remove, clear, total, syncProducts } = usePortalCartStore();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Refresh price/stock of cart items from server (matched by id via name search)
  const refresh = useCallback(async () => {
    const current = usePortalCartStore.getState().items;
    if (!current.length) return;
    try {
      const pages = await Promise.all(
        current.map((i) => portalApi.products({ search: i.product.name, page_size: 50 })),
      );
      const fresh: PortalProduct[] = pages.flatMap((p) => p.results);
      syncProducts(fresh);
    } catch {
      /* keep cached values; server validates on submit */
    }
  }, [syncProducts]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submit = async () => {
    if (!items.length || busy) return;
    setBusy(true);
    setError("");
    try {
      await portalApi.createOrder({
        note,
        items: items.map((i) => ({ product: i.product.id, quantity: i.quantity })),
      });
      clear();
      toast.success("سفارش ثبت شد؛ موجودی رزرو نمی‌شود و کارمند سفارش را بررسی می‌کند");
      router.push("/portal/orders/");
    } catch (e) {
      setError(apiMessage(e, "ثبت سفارش انجام نشد"));
      void refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section dir="rtl">
      <h1 className="mb-5 text-[15px] font-black">سبد خرید</h1>
      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>
      )}

      {!items.length ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-500 dark:border-white/10">
          <ShoppingBag className="mx-auto mb-3" size={30} />
          سبد خرید شما خالی است
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.product.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="min-w-0">
                  <h2 className="font-bold">{item.product.name}</h2>
                  <p className="mt-1 text-xs text-gray-500">{fmt(Number(item.product.sale_price))} تومان / واحد</p>
                </div>
                <div className="flex items-center gap-2">
                  <QuantityInput item={item} />
                  <button
                    onClick={() => remove(item.product.id)}
                    className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                    aria-label="حذف"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
                <p className="w-full text-left text-sm font-black text-indigo-600 dark:text-indigo-300">
                  {fmt(Number(item.product.sale_price) * item.quantity)} تومان
                </p>
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
            <label className="mb-2 block text-xs font-bold">توضیحات سفارش</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="توضیحات تکمیلی..."
              className="w-full rounded-xl border border-gray-200 bg-transparent p-3 text-sm outline-none dark:border-white/10"
            />
            <div className="my-5 flex justify-between text-sm">
              <span>جمع تقریبی</span>
              <strong>{fmt(total())} تومان</strong>
            </div>
            <p className="mb-4 text-[11px] leading-6 text-amber-600">
              قیمت و موجودی نهایی توسط سرور بررسی می‌شود. ثبت سفارش موجودی را رزرو نمی‌کند.
            </p>
            <button
              disabled={busy}
              onClick={() => void submit()}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              {busy ? "در حال ثبت..." : "ثبت سفارش"}
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}
