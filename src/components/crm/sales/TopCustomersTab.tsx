"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { BarChart3 } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/ui/Feedback";
import { ListSkeleton } from "@/components/ui/skeletons";
import { formatMoney, formatWeight, toNumber } from "@/lib/crm/format";
import { useActiveProducts } from "../shared/useActiveProducts";
import { Card, SectionTitle, StatTile } from "../shared/ui";
import { TopCustomerRowItem } from "./TopCustomerRow";
import { TopCustomersFilterBar } from "./TopCustomersFilterBar";
import { useTopCustomers, type TopCustomersQuery } from "./useTopCustomers";

// فقط وقتی کاربر روی یک مشتری کلیک کند دانلود می‌شود
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

/** تب «مشتریان برتر»: رتبه‌بندی مشتریان بر اساس مبلغ یا مقدار خرید. */
export default function TopCustomersTab() {
    const products = useActiveProducts();
    const [query, setQuery] = useState(DEFAULT_QUERY);
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

    return (
        <div className="flex flex-col gap-4">
            <TopCustomersFilterBar query={query} products={products} onChange={updateQuery} />

            {loading ? (
                <ListSkeleton rows={6} />
            ) : error ? (
                <ErrorState message={error} onRetry={retry} />
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
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <StatTile
                            label="مجموع فروش این فهرست"
                            value={formatMoney(stats.totalAmount)}
                            tone="good"
                        />
                        <StatTile label="مجموع مقدار" value={formatWeight(stats.totalKg)} />
                        <StatTile
                            label="مشتری برتر"
                            value={rows[0].full_name}
                            hint={
                                by === "amount"
                                    ? formatMoney(rows[0].total_amount)
                                    : formatWeight(rows[0].total_quantity_kg)
                            }
                            tone="warn"
                        />
                    </div>

                    <Card>
                        <SectionTitle
                            icon={<BarChart3 size={16} />}
                            title="بیشترین فروش ما به مشتریان"
                        />
                        <ol className="flex flex-col gap-3.5">
                            {rows.map((row) => (
                                <TopCustomerRowItem
                                    key={row.customer_id}
                                    row={row}
                                    by={by}
                                    percent={Math.max(
                                        3,
                                        Math.round((stats.valueOf(row) / stats.maxValue) * 100),
                                    )}
                                    onOpen={setCustomerId}
                                />
                            ))}
                        </ol>
                    </Card>
                </>
            )}

            {customerId !== null && (
                <CustomerProfileModal
                    key={customerId}
                    customerId={customerId}
                    onClose={() => setCustomerId(null)}
                />
            )}
        </div>
    );
}
