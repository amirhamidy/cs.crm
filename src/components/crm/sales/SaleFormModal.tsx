"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Building2, Paperclip, ShoppingBag, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FloatingInput, FloatingTextarea } from "@/components/ui/FloatingField";
import { NiceSelect } from "@/components/ui/NiceSelect";
import AsyncSelect, { type AsyncOption } from "@/components/ui/AsyncSelect";
import {
    attachmentsApi,
    casesApi,
    customersApi,
    productsApi,
    salesApi,
    tradeOptionsApi,
    tradersApi,
} from "@/lib/api";
import { toast } from "@/components/notifications/toast";
import { apiMessage } from "@/lib/apiMessage";
import {
    cleanDecimal,
    formatMoney,
    formatTon,
    hasAtMostDecimals,
    isPositiveNumber,
    kgToTon,
    nowTime,
    toNumber,
    todayIso,
    tonToKg,
} from "@/lib/crm/format";
import type { Customer } from "@/types/customer";
import type { CaseItem } from "@/types/case";
import type {
    FeedProduct,
    FreightStatus,
    Sale,
    SalePayload,
    Trader,
    TradeOption,
    TradeType,
} from "@/types/crm";
import JalaliDateField from "../shared/JalaliDateField";
import { Segmented } from "../shared/Segmented";

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
        <div className="flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
            <Building2 size={16} className="shrink-0 text-gray-400" />
            <div className="min-w-0">
                <div className="text-[10.5px] font-bold text-gray-400">{label}</div>
                <div className="text-[13px] font-extrabold text-gray-800 dark:text-gray-100">
                    شرکت ما
                </div>
            </div>
        </div>
    );
}

const faDigits = (n: number) => String(n).padStart(2, "0").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({ id: i, label: faDigits(i) }));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => ({ id: i, label: faDigits(i) }));

export default function SaleFormModal({ open, onClose, sale, fixedCustomer, onSaved }: Props) {
    const editing = !!sale;
    const { isManager, can } = usePermissions();
    const canViewCustomers = can("customers", "view");
    const canViewCases = can("cases", "view");
    const canViewProducts = can("products", "view");
    const isReturned = sale?.status === "returned";

    const [tradeType, setTradeType] = useState<TradeType>("sale");
    const [brokerRole, setBrokerRole] = useState<Role>("buyer");
    const [seller, setSeller] = useState<AsyncOption | null>(null);
    const [buyer, setBuyer] = useState<AsyncOption | null>(null);
    const [caseOption, setCaseOption] = useState<AsyncOption | null>(null);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

    const [products, setProducts] = useState<FeedProduct[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [productId, setProductId] = useState<number | null>(null);

    const [quantityTon, setQuantityTon] = useState("");
    const [billedTon, setBilledTon] = useState("");
    const [buyPrice, setBuyPrice] = useState("");
    const [sellPrice, setSellPrice] = useState("");

    const [dealTypes, setDealTypes] = useState<TradeOption[]>([]);
    const [loadTypes, setLoadTypes] = useState<TradeOption[]>([]);
    const [dealTypeId, setDealTypeId] = useState<number | null>(null);
    const [loadTypeId, setLoadTypeId] = useState<number | null>(null);
    const [freightStatus, setFreightStatus] = useState<FreightStatus>("");

    const [loadingCost, setLoadingCost] = useState("");
    const [weighbridgeCost, setWeighbridgeCost] = useState("");
    const [freightCost, setFreightCost] = useState("");

    const [traders, setTraders] = useState<Trader[]>([]);
    const [traderId, setTraderId] = useState<number | null>(null);

    const [saleDate, setSaleDate] = useState(todayIso());
    const [saleTime, setSaleTime] = useState(nowTime());
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

    const selectedLoadType = useMemo(
        () => loadTypes.find((lt) => lt.id === loadTypeId),
        [loadTypes, loadTypeId],
    );
    const needsBilledQty =
        selectedLoadType?.uses_declared_weight ?? Boolean(sale?.load_type_uses_declared_weight);

    useEffect(() => {
        if (!open) return;
        let alive = true;

        setError("");
        setSaving(false);
        setPendingFiles([]);
        setProductId(sale?.product ?? null);

        setQuantityTon(sale ? String(kgToTon(sale.quantity_kg)) : "");
        setBilledTon(sale?.billed_quantity_kg ? String(kgToTon(sale.billed_quantity_kg)) : "");
        setBuyPrice(sale?.buy_price ? String(toNumber(sale.buy_price)) : "");
        setSellPrice(sale?.sell_price ? String(toNumber(sale.sell_price)) : "");

        setDealTypeId(sale?.deal_type ?? null);
        setLoadTypeId(sale?.load_type ?? null);
        setFreightStatus(sale?.freight_status ?? "");

        setLoadingCost(sale?.loading_cost ? String(toNumber(sale.loading_cost)) : "");
        setWeighbridgeCost(sale?.weighbridge_cost ? String(toNumber(sale.weighbridge_cost)) : "");
        setFreightCost(sale?.freight_cost ? String(toNumber(sale.freight_cost)) : "");

        setTraderId(sale?.trader ?? null);
        setSaleDate(sale?.sale_date ?? todayIso());
        setSaleTime(sale?.sale_time?.slice(0, 5) ?? nowTime());
        setDescription(sale?.description ?? "");
        setBrokerRole("buyer");
        setCaseOption(sale?.case ? { id: sale.case, label: sale.case_title || `پرونده ${sale.case}` } : null);

        if (sale) {
            setTradeType(sale.trade_type);
            setSeller(
                sale.seller
                    ? {
                          id: sale.seller,
                          label: sale.seller_name,
                          sub: sale.seller_company || undefined,
                      }
                    : null,
            );
            setBuyer(
                sale.buyer
                    ? {
                          id: sale.buyer,
                          label: sale.buyer_name,
                          sub: sale.buyer_company || undefined,
                      }
                    : null,
            );
        } else {
            setTradeType("sale");
            setSeller(null);
            setBuyer(fixedCustomer ? { id: fixedCustomer.id, label: fixedCustomer.name } : null);
        }

        if (canViewProducts) {
            setLoadingProducts(true);
            productsApi
                .active()
                .then((list) => {
                    if (!alive) return;
                    if (sale && !list.some((product) => product.id === sale.product)) {
                        list = [...list, { id: sale.product, name: sale.product_name, is_active: false, created_at: "" }];
                    }
                    setProducts(list);
                })
                .catch((e) => alive && setError(apiMessage(e, "دریافت لیست کالاها ناموفق بود")))
                .finally(() => alive && setLoadingProducts(false));

            Promise.all([
                tradeOptionsApi.list("deal_type", { all: Boolean(sale) }).catch(() => []),
                tradeOptionsApi.list("load_type", { all: Boolean(sale) }).catch(() => []),
            ]).then(([deals, loads]) => {
                if (!alive) return;
                setDealTypes(deals);
                setLoadTypes(loads);
            });
        } else {
            setLoadingProducts(false);
            setProducts(sale ? [{ id: sale.product, name: sale.product_name, is_active: false, created_at: "" }] : []);
            setDealTypes(sale?.deal_type ? [{ id: sale.deal_type, kind: "deal_type", name: sale.deal_type_name || "نوع معامله فعلی", is_active: false, order: 0, uses_declared_weight: false, created_at: "" }] : []);
            setLoadTypes(sale?.load_type ? [{ id: sale.load_type, kind: "load_type", name: sale.load_type_name || "نوع بار فعلی", is_active: false, order: 0, uses_declared_weight: Boolean(sale.load_type_uses_declared_weight), created_at: "" }] : []);
        }

        if (isManager) tradersApi.list().then((list) => alive && setTraders(list)).catch(() => alive && setTraders([]));
        else setTraders([]);

        return () => {
            alive = false;
        };
    }, [open, sale, fixedCustomer, isManager, canViewProducts]);

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

        if (nextSeller?.id !== seller?.id || nextBuyer?.id !== buyer?.id) setCaseOption(null);
        setSeller(nextSeller);
        setBuyer(nextBuyer);
    }

    const productOptions = useMemo(
        () =>
            products.map((p) => ({
                id: p.id,
                label: p.name,
                sub: p.is_active ? undefined : "غیرفعال",
            })),
        [products],
    );

    const dealOptions = useMemo(
        () =>
            dealTypes.map((d) => ({
                id: d.id,
                label: d.name,
                sub: d.is_active ? undefined : "غیرفعال",
            })),
        [dealTypes],
    );

    const loadOptions = useMemo(
        () =>
            loadTypes.map((lt) => ({
                id: lt.id,
                label: lt.name,
                sub: lt.is_active ? undefined : "غیرفعال",
            })),
        [loadTypes],
    );

    const traderOptions = useMemo(
        () =>
            traders.map((t) => ({
                id: t.id,
                label: t.full_name || t.name || t.username || `کاربر ${t.id}`,
            })),
        [traders],
    );

    const needSeller = tradeType !== "sale";
    const needBuyer = tradeType !== "purchase";
    const partiesOk =
        (!needSeller || seller != null) &&
        (!needBuyer || buyer != null) &&
        !(needSeller && needBuyer && seller != null && buyer != null && seller.id === buyer.id);

    const needBuyPrice = tradeType === "purchase" || tradeType === "brokerage";
    const needSellPrice = tradeType === "sale" || tradeType === "brokerage";

    const qtyKg = tonToKg(quantityTon);
    const billedKg = needsBilledQty ? tonToKg(billedTon) : "";

    const qtyValid =
        isPositiveNumber(quantityTon) &&
        hasAtMostDecimals(cleanDecimal(quantityTon), 6) &&
        qtyKg !== "" &&
        hasAtMostDecimals(qtyKg, 3);

    const billedValid =
        !needsBilledQty ||
        (isPositiveNumber(billedTon) &&
            billedKg !== "" &&
            hasAtMostDecimals(cleanDecimal(billedTon), 6) &&
            hasAtMostDecimals(billedKg, 3));

    const pricesOk =
        (!needBuyPrice || isPositiveNumber(buyPrice)) &&
        (!needSellPrice || isPositiveNumber(sellPrice));

    const valid =
        partiesOk &&
        productId != null &&
        qtyValid &&
        billedValid &&
        pricesOk &&
        !!saleDate &&
        !!saleTime;

    async function submit() {
        if (!valid || productId == null) return;
        setSaving(true);
        setError("");
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(saleTime)) {
            setSaving(false);
            setError("ساعت معامله باید به فرمت HH:mm باشد");
            return;
        }
        try {
            const payload: SalePayload = {
                seller: needSeller && seller ? seller.id : null,
                buyer: needBuyer && buyer ? buyer.id : null,
                product: productId,
                quantity_kg: qtyKg,
                sale_date: saleDate,
                sale_time: saleTime,
                ...(caseOption ? { case: caseOption.id } : {}),
                description: description.trim(),
                ...(needsBilledQty && billedKg ? { billed_quantity_kg: billedKg } : {}),
                ...(needBuyPrice && buyPrice ? { buy_price: cleanDecimal(buyPrice) } : {}),
                ...(needSellPrice && sellPrice ? { sell_price: cleanDecimal(sellPrice) } : {}),
                ...(dealTypeId != null ? { deal_type: dealTypeId } : {}),
                ...(loadTypeId != null ? { load_type: loadTypeId } : {}),
                ...(freightStatus ? { freight_status: freightStatus } : {}),
                ...(loadingCost ? { loading_cost: cleanDecimal(loadingCost) } : {}),
                ...(weighbridgeCost ? { weighbridge_cost: cleanDecimal(weighbridgeCost) } : {}),
                ...(freightCost ? { freight_cost: cleanDecimal(freightCost) } : {}),
                ...(isManager && traderId != null ? { trader: traderId } : {}),
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
                    toast.error(
                        `معامله ثبت شد، اما آپلود این فایل‌ها ناموفق بود: ${failed.join("، ")}`,
                    );
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
            disabled={lockedSlot === role || isReturned || !canViewCustomers}
            fetcher={(params, signal) => customersApi.page(params, signal)}
            toOption={(c) => ({ id: c.id, label: c.full_name, sub: c.company_name || undefined })}
            onChange={(option) => {
                set(option);
                setCaseOption(null);
                setError("");
            }}
        />
    );

    const caseFetcher = async (params: { page: number; page_size: number; search?: string }, signal: AbortSignal) => {
        if (!canViewCases) return { count: 0, next: null, previous: null, results: [] as CaseItem[] };
        const customerIds = [...new Set([seller?.id, buyer?.id].filter((id): id is number => typeof id === "number"))];
        if (customerIds.length === 0) return casesApi.page(params, signal);
        const pages = await Promise.all(customerIds.map((customer) => casesApi.page({ ...params, customer }, signal)));
        const unique = new Map<number, CaseItem>();
        pages.forEach((result) => result.results.forEach((item) => unique.set(item.id, item)));
        return {
            count: pages.reduce((total, result) => total + result.count, 0),
            next: pages.some((result) => Boolean(result.next)) ? "more" : null,
            previous: null,
            results: [...unique.values()],
        };
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            busy={saving}
            title={editing ? "ویرایش معامله" : "ثبت معامله جدید"}
            subtitle={
                isReturned
                    ? "⚠️ این معامله برگشت خورده؛ امکان ویرایش وجود ندارد"
                    : fixedCustomer
                      ? `مشتری: ${fixedCustomer.name}`
                      : undefined
            }
            icon={<ShoppingBag size={18} />}
            footer={
                !isReturned && (
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
                            disabled={!valid}
                            loading={saving}
                            className="flex-[2]"
                        >
                            {editing
                                ? "ذخیره تغییرات"
                                : tradeType === "sale"
                                  ? "ثبت فروش"
                                  : tradeType === "purchase"
                                    ? "ثبت خرید"
                                    : "ثبت معامله"}
                        </Button>
                    </div>
                )
            }
        >
            <div className="flex flex-col gap-4 px-1 pb-1">
                {!isReturned && (
                    <Segmented
                        options={[
                            { value: "sale", label: "فروش به مشتری" },
                            { value: "purchase", label: "خرید از مشتری" },
                            { value: "brokerage", label: "بین دو مشتری" },
                        ]}
                        value={tradeType}
                        onChange={(v) => changeMode(v)}
                    />
                )}

                {tradeType === "brokerage" && fixedCustomer && !editing && !isReturned && (
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

                {canViewCases && <div className="flex min-w-0 items-end gap-1.5">
                    <div className="min-w-0 flex-1">
                        <AsyncSelect<CaseItem>
                            label="پرونده مرتبط (اختیاری)"
                            placeholder="انتخاب پرونده مرتبط با یکی از طرفین"
                            emptyText="پرونده‌ای برای این مشتری پیدا نشد"
                            value={caseOption?.id ?? null}
                            selected={caseOption}
                            disabled={isReturned || (!seller && !buyer)}
                            depsKey={`${seller?.id ?? ""}-${buyer?.id ?? ""}`}
                            fetcher={caseFetcher}
                            toOption={(item) => ({ id: item.id, label: item.title })}
                            onChange={setCaseOption}
                        />
                    </div>
                    {caseOption && <button type="button" onClick={() => setCaseOption(null)} className="mb-0.5 h-9 shrink-0 rounded-lg px-2 text-[10px] font-bold text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]">حذف اتصال</button>}
                </div>}

                {needSeller &&
                    needBuyer &&
                    seller != null &&
                    buyer != null &&
                    seller.id === buyer.id && (
                        <p className="text-[11.5px] font-semibold text-red-500">
                            فروشنده و خریدار نباید یکی باشند.
                        </p>
                    )}

                <NiceSelect
                    label="کالا"
                    placeholder={loadingProducts ? "در حال دریافت..." : "انتخاب کالا"}
                    emptyText="کالای فعالی تعریف نشده است"
                    options={productOptions}
                    value={productId}
                    disabled={loadingProducts || isReturned || !canViewProducts}
                    onChange={(id) => {
                        setProductId(id);
                        setError("");
                    }}
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <FloatingInput
                            id="sale_form_quantity"
                            label="مقدار (تن)"
                            inputMode="decimal"
                            value={quantityTon}
                            disabled={isReturned}
                            onChange={(e) => setQuantityTon(e.target.value)}
                        />
                        {qtyKg && (
                            <div className="mt-1 text-[10.5px] font-semibold text-gray-500">
                                {formatTon(qtyKg)}
                            </div>
                        )}
                        {quantityTon &&
                            (!qtyValid || (qtyKg && !hasAtMostDecimals(qtyKg, 3))) && (
                                <div className="mt-1 text-[10.5px] font-semibold text-red-500">
                                    حداکثر ۳ رقم اعشار مجاز است
                                </div>
                            )}
                    </div>

                    {needsBilledQty && (
                        <div>
                            <FloatingInput
                                id="sale_form_billed"
                                label="وزن اعلامی (تن) — الزامی"
                                inputMode="decimal"
                                value={billedTon}
                                disabled={isReturned}
                                onChange={(e) => setBilledTon(e.target.value)}
                            />
                            {billedKg && (
                                <div className="mt-1 text-[10.5px] font-semibold text-gray-500">
                                    {formatTon(billedKg)}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {needBuyPrice && (
                        <FloatingInput
                            id="sale_form_buy_price"
                            label="فی خرید (تومان/کیلو)"
                            inputMode="decimal"
                            value={buyPrice}
                            disabled={isReturned}
                            onChange={(e) => setBuyPrice(e.target.value)}
                        />
                    )}
                    {needSellPrice && (
                        <FloatingInput
                            id="sale_form_sell_price"
                            label="فی فروش (تومان/کیلو)"
                            inputMode="decimal"
                            value={sellPrice}
                            disabled={isReturned}
                            onChange={(e) => setSellPrice(e.target.value)}
                        />
                    )}
                </div>

                {needBuyPrice && buyPrice && toNumber(cleanDecimal(buyPrice)) > 0 && (
                    <div className="flex items-center justify-between rounded-2xl bg-blue-50 px-4 py-2.5 dark:bg-blue-500/10">
                        <span className="text-[11.5px] font-bold text-blue-600 dark:text-blue-400">
                            مبلغ خرید
                        </span>
                        <span className="text-[12.5px] font-black text-blue-700 dark:text-blue-300">
                            {formatMoney(
                                toNumber(cleanDecimal(buyPrice)) *
                                    toNumber(needsBilledQty && billedKg ? billedKg : qtyKg),
                            )}
                        </span>
                    </div>
                )}

                {needSellPrice && sellPrice && toNumber(cleanDecimal(sellPrice)) > 0 && (
                    <div className="flex items-center justify-between rounded-2xl bg-green-50 px-4 py-2.5 dark:bg-green-500/10">
                        <span className="text-[11.5px] font-bold text-green-600 dark:text-green-400">
                            مبلغ فروش
                        </span>
                        <span className="text-[12.5px] font-black text-green-700 dark:text-green-300">
                            {formatMoney(
                                toNumber(cleanDecimal(sellPrice)) *
                                    toNumber(needsBilledQty && billedKg ? billedKg : qtyKg),
                            )}
                        </span>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <NiceSelect
                        label="نوع معامله"
                        placeholder="انتخاب نوع معامله"
                        emptyText="موردی تعریف نشده"
                        options={dealOptions}
                        value={dealTypeId}
                        disabled={isReturned || !canViewProducts}
                        onChange={setDealTypeId}
                    />
                    <NiceSelect
                        label="نوع بار"
                        placeholder="انتخاب نوع بار"
                        emptyText="موردی تعریف نشده"
                        options={loadOptions}
                        value={loadTypeId}
                        disabled={isReturned || !canViewProducts}
                        onChange={setLoadTypeId}
                    />
                </div>

                <div>
                    <div className="mb-1 text-[11px] font-bold text-gray-400">وضعیت کرایه</div>
                    <Segmented
                        size="sm"
                        options={[
                            { value: "", label: "نامشخص" },
                            { value: "extra_freight", label: "مشمول اضافه کرایه" },
                            { value: "no_freight", label: "فاقد کرایه" },
                        ]}
                        value={freightStatus}
                        onChange={(v) => setFreightStatus(v as FreightStatus)}
                    />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <FloatingInput
                        id="sale_form_loading_cost"
                        label="هزینه بارگیری"
                        inputMode="decimal"
                        value={loadingCost}
                        disabled={isReturned}
                        onChange={(e) => setLoadingCost(e.target.value)}
                    />
                    <FloatingInput
                        id="sale_form_weighbridge_cost"
                        label="هزینه باسکول"
                        inputMode="decimal"
                        value={weighbridgeCost}
                        disabled={isReturned}
                        onChange={(e) => setWeighbridgeCost(e.target.value)}
                    />
                    <FloatingInput
                        id="sale_form_freight_cost"
                        label="هزینه حمل"
                        inputMode="decimal"
                        value={freightCost}
                        disabled={isReturned}
                        onChange={(e) => setFreightCost(e.target.value)}
                    />
                </div>

                {isManager && traders.length > 0 && (
                    <NiceSelect
                        label="معامله‌گر (مدیر)"
                        placeholder="انتخاب معامله‌گر"
                        emptyText="کاربری یافت نشد"
                        options={traderOptions}
                        value={traderId}
                        disabled={isReturned}
                        onChange={setTraderId}
                    />
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <JalaliDateField
                        label="تاریخ معامله"
                        value={saleDate}
                        disabled={isReturned}
                        onChange={setSaleDate}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <NiceSelect
                            label="ساعت"
                            options={HOUR_OPTIONS}
                            value={Number(saleTime.slice(0, 2)) || 0}
                            disabled={isReturned}
                            onChange={(h) => setSaleTime(`${String(h).padStart(2, "0")}:${saleTime.slice(3, 5) || "00"}`)}
                        />
                        <NiceSelect
                            label="دقیقه"
                            options={MINUTE_OPTIONS}
                            value={Number(saleTime.slice(3, 5)) || 0}
                            disabled={isReturned}
                            onChange={(m) => setSaleTime(`${saleTime.slice(0, 2) || "00"}:${String(m).padStart(2, "0")}`)}
                        />
                    </div>
                </div>

                <FloatingTextarea
                    id="sale_form_description"
                    label="توضیحات (اختیاری)"
                    value={description}
                    disabled={isReturned}
                    onChange={(e) => setDescription(e.target.value)}
                />

                {!editing && !isReturned && can("sales", "create") && (
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
                                        <span className="max-w-[160px] truncate sm:max-w-[240px]">
                                            {file.name}
                                        </span>
                                        <button
                                            type="button"
                                            aria-label="حذف فایل"
                                            onClick={() =>
                                                setPendingFiles((prev) =>
                                                    prev.filter((_, i) => i !== idx),
                                                )
                                            }
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
