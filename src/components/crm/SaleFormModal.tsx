"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Building2, Paperclip, ShoppingBag, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FloatingInput, FloatingTextarea } from "@/components/ui/FloatingField";
import { NiceSelect } from "@/components/ui/NiceSelect";
import AsyncSelect, { type AsyncOption } from "@/components/ui/AsyncSelect";
import { attachmentsApi, customersApi, productsApi, salesApi } from "@/lib/api";
import { toast } from "@/components/notifications/toast";
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
import type { FeedProduct, Sale, TradeType } from "@/types/crm";
import JalaliDateField from "./JalaliDateField";
import { Segmented } from "./Segmented";

type Role = "seller" | "buyer";

interface Props {
  open: boolean;
  onClose: () => void;
  
  sale?: Sale | null;
  
  fixedCustomer?: { id: number; name: string } | null;
  onSaved: (sale: Sale) => void;
}

function CompanyBox({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
      <Building2 size={16} className="shrink-0 text-gray-400" />
      <div className="min-w-0">
        <div className="text-[10.5px] font-bold text-gray-400">{label}</div>
        <div className="text-[13px] font-extrabold text-gray-800 dark:text-gray-100">شرکت ما</div>
      </div>
    </div>
  );
}

export default function SaleFormModal({ open, onClose, sale, fixedCustomer, onSaved }: Props) {
  const editing = !!sale;
  const { can } = usePermissions();

  const [tradeType, setTradeType] = useState<TradeType>("sale");
  const [brokerRole, setBrokerRole] = useState<Role>("buyer");
  const [seller, setSeller] = useState<AsyncOption | null>(null);
  const [buyer, setBuyer] = useState<AsyncOption | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const [products, setProducts] = useState<FeedProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productId, setProductId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [saleDate, setSaleDate] = useState(todayIso());
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fixedOption: AsyncOption | null = fixedCustomer
    ? { id: fixedCustomer.id, label: fixedCustomer.name }
    : null;

  const lockedSlot: Role | null =
    !editing && fixedCustomer
      ? tradeType === "sale"
        ? "buyer"
        : tradeType === "purchase"
          ? "seller"
          : brokerRole
      : null;

  useEffect(() => {
    if (!open) return;
    let alive = true;

    setError("");
    setSaving(false);
    setPendingFiles([]);
    setProductId(sale?.product ?? null);
    setQuantity(sale ? String(toNumber(sale.quantity_kg)) : "");
    setPrice(sale ? String(toNumber(sale.unit_price)) : "");
    setSaleDate(sale?.sale_date ?? todayIso());
    setDescription(sale?.description ?? "");
    setBrokerRole("buyer");

    if (sale) {
      setTradeType(sale.trade_type);
      setSeller(
        sale.seller
          ? { id: sale.seller, label: sale.seller_name, sub: sale.seller_company || undefined }
          : null,
      );
      setBuyer(
        sale.buyer
          ? { id: sale.buyer, label: sale.buyer_name, sub: sale.buyer_company || undefined }
          : null,
      );
    } else {
      setTradeType("sale");
      setSeller(null);
      setBuyer(fixedCustomer ? { id: fixedCustomer.id, label: fixedCustomer.name } : null);
    }

    setLoadingProducts(true);
    productsApi
      .active()
      .then((list) => {
        if (!alive) return;
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

  
  function changeMode(next: TradeType, role: Role = brokerRole) {
    setError("");
    setTradeType(next);

    const slot: Role | null = fixedOption
      ? next === "sale"
        ? "buyer"
        : next === "purchase"
          ? "seller"
          : role
      : null;

    let nextSeller = next === "sale" ? null : seller;
    let nextBuyer = next === "purchase" ? null : buyer;

    if (!editing && fixedOption && slot) {
      if (slot === "seller") {
        nextSeller = fixedOption;
        if (nextBuyer?.id === fixedOption.id) nextBuyer = null;
      } else {
        nextBuyer = fixedOption;
        if (nextSeller?.id === fixedOption.id) nextSeller = null;
      }
    }

    setSeller(nextSeller);
    setBuyer(nextBuyer);
  }

  const options = useMemo(
    () =>
      products.map((p) => ({
        id: p.id,
        label: p.name,
        sub: p.is_active ? undefined : "غیرفعال",
      })),
    [products],
  );

  const needSeller = tradeType !== "sale";
  const needBuyer = tradeType !== "purchase";
  const partiesOk =
    (!needSeller || seller != null) &&
    (!needBuyer || buyer != null) &&
    !(needSeller && needBuyer && seller != null && buyer != null && seller.id === buyer.id);

  const total = toNumber(cleanDecimal(quantity)) * toNumber(cleanDecimal(price));
  const valid =
    partiesOk &&
    productId != null &&
    isPositiveNumber(quantity) &&
    isPositiveNumber(price) &&
    !!saleDate;

  async function submit() {
    if (!valid || productId == null) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        seller: needSeller && seller ? seller.id : null,
        buyer: needBuyer && buyer ? buyer.id : null,
        product: productId,
        quantity_kg: cleanDecimal(quantity),
        unit_price: cleanDecimal(price),
        sale_date: saleDate,
        description: description.trim(),
      };
      const saved = sale
        ? await salesApi.update(sale.id, payload)
        : await salesApi.create(payload);
      if (!sale && pendingFiles.length > 0) {
        const failed: string[] = [];
        for (const file of pendingFiles) {
          try {
            await attachmentsApi.upload(saved.id, file);
          } catch {
            failed.push(file.name);
          }
        }
        if (failed.length > 0) {
          toast.error(`معامله ثبت شد، اما آپلود این فایل‌ها ناموفق بود: ${failed.join("، ")}`);
        }
      }
      onSaved(saved);
      onClose();
    } catch (e) {
      setError(apiMessage(e, "ذخیره‌ی معامله ناموفق بود"));
    } finally {
      setSaving(false);
    }
  }

  const picker = (
    role: Role,
    label: string,
    value: AsyncOption | null,
    set: (o: AsyncOption | null) => void,
  ) => (
    <AsyncSelect<Customer>
      label={label}
      placeholder="انتخاب از بین مشتری‌ها"
      emptyText="مشتری‌ای یافت نشد"
      value={value?.id ?? null}
      selected={value}
      disabled={lockedSlot === role}
      fetcher={(params, signal) => customersApi.page(params, signal)}
      toOption={(c) => ({ id: c.id, label: c.full_name, sub: c.company_name || undefined })}
      onChange={(option) => {
        set(option);
        setError("");
      }}
    />
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={saving}
      title={editing ? "ویرایش معامله" : "ثبت معامله جدید"}
      subtitle={fixedCustomer ? `مشتری: ${fixedCustomer.name}` : undefined}
      icon={<ShoppingBag size={18} />}
      footer={
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving} className="flex-1">
            انصراف
          </Button>
          <Button onClick={submit} disabled={!valid} loading={saving} className="flex-[2]">
            {editing
              ? "ذخیره تغییرات"
              : tradeType === "sale"
                ? "ثبت فروش"
                : tradeType === "purchase"
                  ? "ثبت خرید"
                  : "ثبت معامله"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 px-1 pb-1">
        <Segmented
          options={[
            { value: "sale", label: "فروش به مشتری" },
            { value: "purchase", label: "خرید از مشتری" },
            { value: "brokerage", label: "بین دو مشتری" },
          ]}
          value={tradeType}
          onChange={(v) => changeMode(v)}
        />

        {tradeType === "brokerage" && fixedCustomer && !editing && (
          <div>
            <div className="mb-1 text-[11px] font-bold text-gray-400">
              {fixedCustomer.name} در این معامله:
            </div>
            <Segmented
              size="sm"
              options={[
                { value: "buyer", label: "خریدار است" },
                { value: "seller", label: "فروشنده است" },
              ]}
              value={brokerRole}
              onChange={(r) => {
                setBrokerRole(r);
                changeMode("brokerage", r);
              }}
            />
          </div>
        )}

        {tradeType === "sale" ? (
          <CompanyBox label="فروشنده" />
        ) : (
          picker("seller", "فروشنده", seller, setSeller)
        )}

        {tradeType === "purchase" ? (
          <CompanyBox label="خریدار" />
        ) : (
          picker("buyer", "خریدار", buyer, setBuyer)
        )}

        {needSeller && needBuyer && seller != null && buyer != null && seller.id === buyer.id && (
          <p className="text-[11.5px] font-semibold text-red-500">
            فروشنده و خریدار نباید یکی باشند.
          </p>
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

        <JalaliDateField label="تاریخ معامله" value={saleDate} onChange={setSaleDate} />

        <FloatingTextarea
          id="sale_form_description"
          label="توضیحات (اختیاری)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {!editing && can("sales", "create") && (
          <div>
            <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-gray-200 px-3.5 py-3 text-[12.5px] font-bold text-gray-500 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/[0.03]">
              <Paperclip size={14} />
              افزودن فایل (فاکتور، بارنامه، قرارداد ...)
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt"
                className="hidden"
                onChange={(e) => {
                  const picked = Array.from(e.target.files ?? []);
                  setPendingFiles((prev) => [...prev, ...picked]);
                  e.target.value = "";
                }}
              />
            </label>
            {pendingFiles.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {pendingFiles.map((file, idx) => (
                  <li
                    key={`${file.name}-${idx}`}
                    className="flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600 dark:bg-white/10 dark:text-gray-300"
                  >
                    <span className="max-w-[160px] truncate">{file.name}</span>
                    <button
                      type="button"
                      aria-label="حذف فایل"
                      onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <X size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

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
