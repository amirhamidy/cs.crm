"use client";

import { useState } from "react";
import { CalendarRange, ListChecks, Sprout } from "lucide-react";
import { HumanResourceCardSkeleton } from "@/components/ui/skeletons";
import { formatNumber } from "@/lib/crm/format";
import { FilterChips, GRID, PageToolbar, SectionHead, StateCard } from "../shared/kit";
import type { BasePath } from "../shared/types";
import { MONTH_OPTIONS } from "./months";
import { SuggestionGroupList } from "./SuggestionGroupList";
import { useSeasonalSuggestions } from "./useSeasonalSuggestions";

const MONTH_ITEMS = MONTH_OPTIONS.map((o) => ({ value: o.id, label: o.label }));

export default function SuggestionsTab({ basePath }: { basePath: BasePath }) {
    const [month, setMonth] = useState<number | undefined>();
    const { data, loading, error, retry } = useSeasonalSuggestions(month);

    const shownMonth = month ?? data?.month ?? 1;
    const isEmpty =
        data && !data.current.length && !data.upcoming.length && !data.from_history.length;

    const countCustomers = (groups: { customers: unknown[] }[] | undefined) =>
        (groups ?? []).reduce((n, g) => n + g.customers.length, 0);

    const productCount =
        (data?.current.length ?? 0) + (data?.upcoming.length ?? 0) + (data?.from_history.length ?? 0);

    return (
        <>
            <PageToolbar
                icon={<Sprout size={18} />}
                title="پیشنهاد ماه"
                subtitle="کدام کالا را از کدام مشتری بخریم"
                count={productCount}
                stats={[
                    { label: "پیشنهاد این ماه", value: formatNumber(countCustomers(data?.current)), tone: "emerald" },
                    { label: "ماه بعد", value: formatNumber(countCustomers(data?.upcoming)), tone: "indigo" },
                    { label: "از سابقه", value: formatNumber(countCustomers(data?.from_history)), tone: "amber" },
                    { label: "کالاهای پیشنهادی", value: formatNumber(productCount) },
                ]}
                footer={
                    <FilterChips label="ماه" items={MONTH_ITEMS} value={shownMonth} onChange={setMonth} />
                }
            />

            {loading && !data ? (
                <HumanResourceCardSkeleton count={4} className={GRID} />
            ) : error ? (
                <StateCard kind="error" title={error} description="ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید." onRetry={retry} />
            ) : !data || isEmpty ? (
                <StateCard
                    icon={<Sprout size={19} />}
                    title="پیشنهادی برای این ماه نیست"
                    description="از تب «فهرست فصلی» مشخص کنید هر مشتری چه کالایی را در چه ماه‌هایی دارد."
                />
            ) : (
                <>
                    {data.current.length > 0 && (
                        <section className="space-y-3">
                            <SectionHead
                                icon={<Sprout size={16} />}
                                title={data.month_name}
                                subtitle="این کالاها را از این مشتری‌ها بخرید"
                                count={data.current.length}
                            />
                            <SuggestionGroupList groups={data.current} basePath={basePath} />
                        </section>
                    )}
                    {data.upcoming.length > 0 && (
                        <section className="space-y-3">
                            <SectionHead
                                icon={<CalendarRange size={16} />}
                                title={`شروع از ${data.next_month_name}`}
                                subtitle="آماده‌ی هماهنگی"
                                count={data.upcoming.length}
                            />
                            <SuggestionGroupList groups={data.upcoming} basePath={basePath} />
                        </section>
                    )}
                    {data.from_history.length > 0 && (
                        <section className="space-y-3">
                            <SectionHead
                                icon={<ListChecks size={16} />}
                                title="از روی سابقه"
                                subtitle={`در ${data.month_name}‌های قبل از این مشتری‌ها خرید کرده‌اید`}
                                count={data.from_history.length}
                            />
                            <SuggestionGroupList groups={data.from_history} basePath={basePath} history />
                        </section>
                    )}
                </>
            )}
        </>
    );
}
