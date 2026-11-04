"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ShoppingBag } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FloatingInput, FloatingTextarea } from "@/components/ui/FloatingField";
import { NiceSelect } from "@/components/ui/NiceSelect";
import AsyncSelect, { type AsyncOption } from "@/components/ui/AsyncSelect";
import { customersApi, productsApi, salesApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import {
  cleanDecimal,
  formatMoney,
  formatWeight,
  isPositiveNumber,
  toNumber,
  todayIso,
} from "@/lib/crm/format";
import type { Customer } from "@/types/customer";
import type { FeedProduct, Sale } from "@/types/crm";
import JalaliDateField from "./JalaliDateField";

interface Props {
  open: boolean;
  onClose: () => void;
  /** اگر داده شود، فرم ویرایش است */
  sale?: Sale | null;
  /** اگر داده شود مشتری ثابت است (فرم داخل پروفایل مشتری) */
  fixedCustomer?: { id: number; name: string } | null;
  onSaved: (sale: Sale) => void;
}

export default function SaleFormModal({ open, onClose, sale, fixedCustomer, onSaved }: Props) {
  const editing = !!sale;

  const [products, setProducts] = useState<FeedProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [customer, setCustomer] = useState<AsyncOption | null>(null);
  const [productId, setProductId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [saleDate, setSaleDate] = useState(todayIso());
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let alive = true;

    setError("");
    setSaving(false);
    setProductId(sale?.product ?? null);
    setQuantity(sale ? String(toNumber(sale.quantity_kg)) : "");
    setPrice(sale ? String(toNumber(sale.unit_price)) : "");
    setSaleDate(sale?.sale_date ?? todayIso());
    setDescription(sale?.description ?? "");
    setCustomer(
      fixedCustomer
        ? { id: fixedCustomer.id, label: fixedCustomer.name }
        : sale
          ? { id: sale.customer, label: sale.customer_name, sub: sale.company_name }
          : null,
    );

    setLoadingProducts(true);
    productsApi
      .active()
      .then((list) => {
        if (!alive) return;
        // در ویرایش، کالای فعلی حتی اگر غیرفعال شده باشد باید در لیست بماند
        if (sale && !list.some((p) => p.id === sale.product)) {
          list = [
            ...list,
            { id: sale.product, name: sale.product_name, is_active: false, created_at: "" },
          ];
        }
        setProducts(list);
      })
      .catch((e) => alive && setError(apiMessage(e, "دریافت لیست کالاها ناموفق بود")))
      .finally(() => alive && setLoadingProducts(false));

    return () => {
      alive = false;
    };
  }, [open, sale, fixedCustomer]);

  const options = useMemo(
    () =>
      products.map((p) => ({
        id: p.id,
        label: p.name,
        sub: p.is_active ? undefined : "غیرفعال",
      })),
    [products],
  );

  const total = toNumber(cleanDecimal(quantity)) * toNumber(cleanDecimal(price));
  const valid =
    customer != null &&
    productId != null &&
    isPositiveNumber(quantity) &&
    isPositiveNumber(price) &&
    !!saleDate;

  async function submit() {
    if (!valid || customer == null || productId == null) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        customer: customer.id,
        product: productId,
        quantity_kg: cleanDecimal(quantity),
        unit_price: cleanDecimal(price),
        sale_date: saleDate,
        description: description.trim(),
      };
      const saved = sale
        ? await salesApi.update(sale.id, payload)
        : await salesApi.create(payload);
      onSaved(saved);
      onClose();
    } catch (e) {
      setError(apiMessage(e, "ذخیره‌ی فروش ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={saving}
      title={editing ? "ویرایش فروش" : "ثبت فروش جدید"}
      subtitle={fixedCustomer ? `مشتری: ${fixedCustomer.name}` : undefined}
      icon={<ShoppingBag size={18} />}
      footer={
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving} className="flex-1">
            انصراف
          </Button>
          <Button onClick={submit} disabled={!valid} loading={saving} className="flex-[2]">
            {editing ? "ذخیره تغییرات" : "ثبت فروش"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 px-1 pb-1">
        {!fixedCustomer && (
          <AsyncSelect<Customer>
            label="مشتری"
            placeholder="انتخاب مشتری"
            emptyText="مشتری‌ای یافت نشد"
            value={customer?.id ?? null}
            selected={customer}
            disabled={editing}
            fetcher={(params, signal) => customersApi.page(params, signal)}
            toOption={(c) => ({ id: c.id, label: c.full_name, sub: c.company_name || undefined })}
            onChange={(option) => {
              setCustomer(option);
              setError("");
            }}
          />
        )}

        <NiceSelect
          label="کالا"
          placeholder={loadingProducts ? "در حال دریافت..." : "انتخاب کالا"}
          emptyText="کالای فعالی تعریف نشده است"
          options={options}
          value={productId}
          disabled={loadingProducts}
          onChange={(id) => {
            setProductId(id);
            setError("");
          }}
        />

        <div className="grid grid-cols-2 gap-3">
          <FloatingInput
            id="sale_form_quantity"
            label="مقدار (کیلوگرم)"
            inputMode="decimal"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <FloatingInput
            id="sale_form_price"
            label="قیمت هر کیلوگرم"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between rounded-2xl bg-brand-soft px-4 py-3">
            <span className="text-[12px] font-bold text-brand">
              {formatWeight(cleanDecimal(quantity))}
            </span>
            <span className="text-[13px] font-black text-brand">مبلغ کل: {formatMoney(total)}</span>
          </div>
        )}

        <JalaliDateField label="تاریخ فروش" value={saleDate} onChange={setSaleDate} />

        <FloatingTextarea
          id="sale_form_description"
          label="توضیحات (اختیاری)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-2xl bg-red-50 px-3.5 py-3 dark:bg-red-500/10"
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
            <p className="flex-1 text-[12px] font-semibold leading-5 text-red-500 dark:text-red-400">
              {error}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
