"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { BarChart3 } from "lucide-react";
import { HumanResourceCardSkeleton } from "@/components/ui/skeletons";
import { formatMoney, formatNumber, formatWeight, toNumber } from "@/lib/crm/format";
import { FilterToggle, GRID, PageToolbar, StateCard, Stagger } from "../shared/kit";
import { useAllProducts } from "../shared/useAllProducts";
import { usePermissions } from "@/hooks/usePermissions";
import { TopCustomerRowItem } from "./TopCustomerRow";
import { TopCustomersFilterBar } from "./TopCustomersFilterBar";
import { useTopCustomers, type TopCustomersQuery } from "./useTopCustomers";

const CustomerProfileModal = dynamic(() => import("../profile/CustomerProfileModal"), {
    ssr: false,
});

const DEFAULT_QUERY: TopCustomersQuery = {
    by: "amount",
    limit: 10,
    product: undefined,
    dateFrom: "",
    dateTo: "",
};

export default function TopCustomersTab() {
    const { can } = usePermissions();
    const canViewProducts = can("products", "view");
    const products = useAllProducts(canViewProducts);
    const [query, setQuery] = useState(DEFAULT_QUERY);
    const [panelOpen, setPanelOpen] = useState(false);
    const [customerId, setCustomerId] = useState<number | null>(null);
    const { rows, loading, error, retry } = useTopCustomers(query);

    const updateQuery = useCallback(
        (patch: Partial<TopCustomersQuery>) => setQuery((prev) => ({ ...prev, ...patch })),
        [],
    );

    const { by } = query;
    const stats = useMemo(() => {
        const valueOf = (r: (typeof rows)[number]) =>
            toNumber(by === "amount" ? r.total_amount : r.total_quantity_kg);
        return {
            maxValue: Math.max(1, ...rows.map(valueOf)),
            totalAmount: rows.reduce((sum, r) => sum + toNumber(r.total_amount), 0),
            totalKg: rows.reduce((sum, r) => sum + toNumber(r.total_quantity_kg), 0),
            valueOf,
        };
    }, [rows, by]);

    const activeFilters =
        (query.product ? 1 : 0) +
        (query.dateFrom ? 1 : 0) +
        (query.dateTo ? 1 : 0) +
        (query.limit !== DEFAULT_QUERY.limit ? 1 : 0);

    return (
        <>
            <PageToolbar
                icon={<BarChart3 size={18} />}
                title="مشتریان برتر"
                subtitle="رتبه‌بندی مشتریان بر اساس مبلغ یا مقدار خرید"
                count={loading ? undefined : rows.length}
                actions={<FilterToggle open={panelOpen} onToggle={() => setPanelOpen((v) => !v)} activeCount={activeFilters} />}
                stats={[
                    { label: "مشتریان فهرست", value: loading ? "…" : formatNumber(rows.length) },
                    { label: "مجموع فروش", value: loading ? "…" : formatMoney(stats.totalAmount), tone: "emerald" },
                    { label: "مجموع مقدار", value: loading ? "…" : formatWeight(stats.totalKg), tone: "indigo" },
                    { label: "مشتری برتر", value: loading || !rows[0] ? "—" : rows[0].full_name, tone: "amber" },
                ]}
                footer={
                    <TopCustomersFilterBar
                        open={panelOpen}
                        query={query}
                        products={products}
                        onChange={updateQuery}
                    />
                }
            />

            {loading ? (
                <HumanResourceCardSkeleton count={8} className={GRID} />
            ) : error ? (
                <StateCard kind="error" title={error} description="ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید." onRetry={retry} />
            ) : rows.length === 0 ? (
                <StateCard
                    icon={<BarChart3 size={19} />}
                    title="در این بازه فروشی ثبت نشده است"
                    description="بازه‌ی زمانی یا کالا را تغییر دهید."
                />
            ) : (
                <div className={GRID}>
                    {rows.map((row, i) => (
                        <Stagger key={row.customer_id} index={i}>
                            <TopCustomerRowItem
                                row={row}
                                by={by}
                                percent={Math.max(3, Math.round((stats.valueOf(row) / stats.maxValue) * 100))}
                                onOpen={setCustomerId}
                            />
                        </Stagger>
                    ))}
                </div>
            )}

            {customerId !== null && (
                <CustomerProfileModal
                    key={customerId}
                    customerId={customerId}
                    onClose={() => setCustomerId(null)}
                />
            )}
        </>
    );
}
