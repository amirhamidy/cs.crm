"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Sprout } from "lucide-react";
import AsyncSelect, { type AsyncOption } from "@/components/ui/AsyncSelect";
import { Button } from "@/components/ui/Button";
import { FloatingInput, FloatingTextarea } from "@/components/ui/FloatingField";
import { Modal } from "@/components/ui/Modal";
import { NiceSelect } from "@/components/ui/NiceSelect";
import { customersApi, productsApi, seasonalApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import { cleanDecimal, isPositiveNumber } from "@/lib/crm/format";
import type { Customer } from "@/types/customer";
import type { FeedProduct, SeasonalSupply } from "@/types/crm";
import { MONTH_OPTIONS, monthName } from "./months";

interface Props {
    open: boolean;
    /** null یعنی ساخت مورد جدید */
    entry: SeasonalSupply | null;
    onClose: () => void;
    onSaved: () => void;
}

/** اگر کالای مورد ویرایش غیرفعال شده باشد، باز هم باید در فهرست دیده شود. */
function withEntryProduct(list: FeedProduct[], entry: SeasonalSupply | null): FeedProduct[] {
    if (!entry || list.some((p) => p.id === entry.product)) return list;
    return [
        ...list,
        { id: entry.product, name: entry.product_name, is_active: false, created_at: "" },
    ];
}

export default function SupplyFormModal({ open, entry, onClose, onSaved }: Props) {
    const [products, setProducts] = useState<FeedProduct[]>([]);
    const [customer, setCustomer] = useState<AsyncOption | null>(null);
    const [productId, setProductId] = useState<number | null>(null);
    const [from, setFrom] = useState<number | null>(null);
    const [to, setTo] = useState<number | null>(null);
    const [qty, setQty] = useState("");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // هر بار که مودال باز می‌شود فرم را از روی مورد انتخاب‌شده دوباره پر کن
    useEffect(() => {
        if (!open) return;

        setError("");
        setSaving(false);
        setCustomer(
            entry
                ? { id: entry.customer, label: entry.customer_name, sub: entry.company_name }
                : null,
        );
        setProductId(entry?.product ?? null);
        setFrom(entry?.start_month ?? null);
        setTo(entry?.end_month ?? null);
        setQty(entry?.expected_quantity_kg ? String(Number(entry.expected_quantity_kg)) : "");
        setNotes(entry?.notes ?? "");

        let alive = true;
        productsApi
            .active()
            .then((list) => alive && setProducts(withEntryProduct(list, entry)))
            .catch(() => undefined);
        return () => {
            alive = false;
        };
    }, [open, entry]);

    const hasQtyError = qty !== "" && !isPositiveNumber(qty);
    const canSubmit =
        customer != null && productId != null && from != null && to != null && !hasQtyError;

    async function submit() {
        if (!canSubmit) return;

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
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1"
                    >
                        انصراف
                    </Button>
                    <Button
                        onClick={submit}
                        disabled={!canSubmit}
                        loading={saving}
                        className="flex-[2]"
                    >
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
                    toOption={(c) => ({
                        id: c.id,
                        label: c.full_name,
                        sub: c.company_name || undefined,
                    })}
                    onChange={setCustomer}
                />
                <NiceSelect
                    label="کالا"
                    placeholder="انتخاب کالا"
                    options={products.map((p) => ({
                        id: p.id,
                        label: p.name,
                        sub: p.is_active ? undefined : "غیرفعال",
                    }))}
                    value={productId}
                    onChange={setProductId}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <NiceSelect
                        label="از ماه"
                        options={MONTH_OPTIONS}
                        value={from}
                        onChange={setFrom}
                    />
                    <NiceSelect
                        label="تا ماه"
                        options={MONTH_OPTIONS}
                        value={to}
                        onChange={setTo}
                    />
                </div>
                {from != null && to != null && from > to && (
                    <p className="text-[11.5px] text-gray-400">
                        بازه از آخر سال به اول سال بعد می‌رود ({monthName(from)} تا {monthName(to)}
                        ).
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
