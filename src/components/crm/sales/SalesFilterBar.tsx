"use client";

import { memo, useEffect, useMemo, useState } from "react";
import AsyncSelect, { type AsyncOption } from "@/components/ui/AsyncSelect";
import { casesApi, customersApi, tradeOptionsApi, tradersApi } from "@/lib/api";
import { usePermissions } from "@/hooks/usePermissions";
import type { CaseItem } from "@/types/case";
import type { Customer } from "@/types/customer";
import type { FeedProduct, TradeOption, Trader } from "@/types/crm";
import { DateRangeField } from "./DateRangeField";
import { SalesSelect } from "../shared/SalesSelect";
import { FilterChips, FilterPanel } from "../shared/kit";
import { TRADE_FILTERS, tradeFilterId, tradeFilterPatch, type SaleFilters } from "./saleFilters";

interface Props {
    open: boolean;
    filters: SaleFilters;
    products: FeedProduct[];
    onFilters: (patch: Partial<SaleFilters>) => void;
}

function SalesFilterBarBase({ open, filters, products, onFilters }: Props) {
    const { isManager, can } = usePermissions();
    const canViewProducts = can("products", "view");
    const canViewCustomers = can("customers", "view");
    const canViewCases = can("cases", "view");
    const [dealTypes, setDealTypes] = useState<TradeOption[]>([]);
    const [loadTypes, setLoadTypes] = useState<TradeOption[]>([]);
    const [traders, setTraders] = useState<Trader[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<AsyncOption | null>(null);
    const [selectedSeller, setSelectedSeller] = useState<AsyncOption | null>(null);
    const [selectedBuyer, setSelectedBuyer] = useState<AsyncOption | null>(null);
    const [selectedCase, setSelectedCase] = useState<AsyncOption | null>(null);

    useEffect(() => {
        if (canViewProducts) {
            tradeOptionsApi.list("deal_type", { all: true }).then(setDealTypes).catch(() => setDealTypes([]));
            tradeOptionsApi.list("load_type", { all: true }).then(setLoadTypes).catch(() => setLoadTypes([]));
        } else {
            setDealTypes([]);
            setLoadTypes([]);
        }
        if (isManager) tradersApi.list().then(setTraders).catch(() => setTraders([]));
        else setTraders([]);
    }, [isManager, canViewProducts]);

    useEffect(() => {
        if (!filters.customer) setSelectedCustomer(null);
        if (!filters.seller) setSelectedSeller(null);
        if (!filters.buyer) setSelectedBuyer(null);
        if (!filters.case) setSelectedCase(null);
    }, [filters.customer, filters.seller, filters.buyer, filters.case]);

    const productOptions = useMemo(
        () => [{ id: 0, label: "همه کالاها" }, ...products.map((product) => ({ id: product.id, label: product.name }))],
        [products],
    );

    const customerFetcher = (params: { page: number; page_size: number; search?: string }, signal: AbortSignal) =>
        customersApi.page(params, signal);
    const caseFetcher = (params: { page: number; page_size: number; search?: string }, signal: AbortSignal) =>
        casesApi.page(params, signal);

    return (
        <>
            <FilterChips
                label="نوع معامله"
                items={TRADE_FILTERS.map((filter) => ({ value: filter.id, label: filter.label }))}
                value={tradeFilterId(filters)}
                onChange={(id) => onFilters(tradeFilterPatch(id))}
            />
            <FilterChips
                label="وضعیت"
                items={[
                    { value: "", label: "همه" },
                    { value: "registered", label: "ثبت‌شده" },
                    { value: "returned", label: "برگشتی" },
                ]}
                value={filters.status ?? ""}
                onChange={(value) => onFilters({ status: (value || undefined) as SaleFilters["status"] })}
            />
            <FilterPanel open={open} className="lg:grid-cols-2">
                {canViewProducts && (
                    <SalesSelect
                        dense
                        avatar={false}
                        label="نوع معامله"
                        options={[{ id: 0, label: "همه" }, ...dealTypes.map((item) => ({ id: item.id, label: item.name }))]}
                        value={filters.deal_type ?? 0}
                        onChange={(id) => onFilters({ deal_type: id || undefined })}
                    />
                )}
                {canViewProducts && (
                    <SalesSelect
                        dense
                        avatar={false}
                        label="نوع بار"
                        options={[{ id: 0, label: "همه" }, ...loadTypes.map((item) => ({ id: item.id, label: item.name }))]}
                        value={filters.load_type ?? 0}
                        onChange={(id) => onFilters({ load_type: id || undefined })}
                    />
                )}
                {isManager && traders.length > 0 && (
                    <SalesSelect
                        dense
                        avatar={false}
                        label="معامله‌گر"
                        options={[
                            { id: 0, label: "همه" },
                            ...traders.map((trader) => ({ id: trader.id, label: trader.full_name || trader.name || trader.username || `کاربر ${trader.id}` })),
                        ]}
                        value={filters.trader ?? 0}
                        onChange={(id) => onFilters({ trader: id || undefined })}
                    />
                )}
                {canViewProducts && (
                    <SalesSelect
                        dense
                        avatar={false}
                        label="کالا"
                        options={productOptions}
                        value={filters.product ?? 0}
                        onChange={(id) => onFilters({ product: id || undefined })}
                    />
                )}
                {canViewCustomers && (
                    <div className="flex min-w-0 items-end gap-1.5">
                        <div className="min-w-0 flex-1">
                            <AsyncSelect<Customer>
                                label="مشتری (هر دو سمت معامله)"
                                placeholder="همه مشتری‌ها"
                                emptyText="مشتری‌ای یافت نشد"
                                value={filters.customer ?? null}
                                selected={selectedCustomer}
                                fetcher={customerFetcher}
                                toOption={(customer) => ({ id: customer.id, label: customer.full_name, sub: customer.company_name || undefined })}
                                onChange={(option) => { setSelectedCustomer(option); onFilters({ customer: option.id }); }}
                            />
                        </div>
                        {filters.customer != null && <button type="button" onClick={() => { setSelectedCustomer(null); onFilters({ customer: undefined }); }} className="mb-0.5 h-9 shrink-0 rounded-lg px-2 text-[10px] font-bold text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]">پاک کردن</button>}
                    </div>
                )}
                {canViewCustomers && (
                    <div className="flex min-w-0 items-end gap-1.5">
                        <div className="min-w-0 flex-1">
                            <AsyncSelect<Customer>
                                label="فروشنده"
                                placeholder="همه فروشنده‌ها"
                                emptyText="مشتری‌ای یافت نشد"
                                value={filters.seller ?? null}
                                selected={selectedSeller}
                                fetcher={customerFetcher}
                                toOption={(customer) => ({ id: customer.id, label: customer.full_name, sub: customer.company_name || undefined })}
                                onChange={(option) => { setSelectedSeller(option); onFilters({ seller: option.id }); }}
                            />
                        </div>
                        {filters.seller != null && <button type="button" onClick={() => { setSelectedSeller(null); onFilters({ seller: undefined }); }} className="mb-0.5 h-9 shrink-0 rounded-lg px-2 text-[10px] font-bold text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]">پاک کردن</button>}
                    </div>
                )}
                {canViewCustomers && (
                    <div className="flex min-w-0 items-end gap-1.5">
                        <div className="min-w-0 flex-1">
                            <AsyncSelect<Customer>
                                label="خریدار"
                                placeholder="همه خریدارها"
                                emptyText="مشتری‌ای یافت نشد"
                                value={filters.buyer ?? null}
                                selected={selectedBuyer}
                                fetcher={customerFetcher}
                                toOption={(customer) => ({ id: customer.id, label: customer.full_name, sub: customer.company_name || undefined })}
                                onChange={(option) => { setSelectedBuyer(option); onFilters({ buyer: option.id }); }}
                            />
                        </div>
                        {filters.buyer != null && <button type="button" onClick={() => { setSelectedBuyer(null); onFilters({ buyer: undefined }); }} className="mb-0.5 h-9 shrink-0 rounded-lg px-2 text-[10px] font-bold text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]">پاک کردن</button>}
                    </div>
                )}
                {canViewCases && (
                    <div className="flex min-w-0 items-end gap-1.5">
                        <div className="min-w-0 flex-1">
                            <AsyncSelect<CaseItem>
                                label="پرونده"
                                placeholder="همه پرونده‌ها"
                                emptyText="پرونده‌ای یافت نشد"
                                value={filters.case ?? null}
                                selected={selectedCase}
                                fetcher={caseFetcher}
                                toOption={(item) => ({ id: item.id, label: item.title })}
                                onChange={(option) => { setSelectedCase(option); onFilters({ case: option.id }); }}
                            />
                        </div>
                        {filters.case != null && <button type="button" onClick={() => { setSelectedCase(null); onFilters({ case: undefined }); }} className="mb-0.5 h-9 shrink-0 rounded-lg px-2 text-[10px] font-bold text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]">پاک کردن</button>}
                    </div>
                )}
                <DateRangeField
                    from={filters.date_from}
                    to={filters.date_to}
                    onChange={(date_from, date_to) => onFilters({ date_from, date_to })}
                />
            </FilterPanel>
        </>
    );
}

export const SalesFilterBar = memo(SalesFilterBarBase);
