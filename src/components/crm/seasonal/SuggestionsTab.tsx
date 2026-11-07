"use client";

import { useState } from "react";
import { CalendarRange, ListChecks, Sprout, Users } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/ui/Feedback";
import { ListSkeleton } from "@/components/ui/skeletons";
import { SalesSelect } from "../shared/SalesSelect";
import type { BasePath } from "../shared/types";
import { Card, SectionTitle } from "../shared/ui";
import { ColorStatsPanel } from "../shared/ColorStats";
import { formatNumber } from "@/lib/crm/format";
import { MONTH_OPTIONS } from "./months";
import { SuggestionGroupList } from "./SuggestionGroupList";
import { useSeasonalSuggestions } from "./useSeasonalSuggestions";

/** تب «پیشنهاد ماه»: کدام کالا را از کدام مشتری بخریم. */
export default function SuggestionsTab({ basePath }: { basePath: BasePath }) {
    const [month, setMonth] = useState<number | undefined>();
    const { data, loading, error, retry } = useSeasonalSuggestions(month);

    const shownMonth = month ?? data?.month ?? 1;
    const isEmpty =
        data && !data.current.length && !data.upcoming.length && !data.from_history.length;

    const countCustomers = (groups: { customers: unknown[] }[] | undefined) =>
        (groups ?? []).reduce((n, g) => n + g.customers.length, 0);

    return (
        <div className="flex flex-col gap-4">
            <ColorStatsPanel
                stats={[
                    { label: "پیشنهاد این ماه", value: formatNumber(countCustomers(data?.current)), icon: Sprout },
                    { label: "ماه بعد", value: formatNumber(countCustomers(data?.upcoming)), icon: CalendarRange },
                    { label: "از سابقه", value: formatNumber(countCustomers(data?.from_history)), icon: ListChecks },
                    { label: "کالاهای پیشنهادی", value: formatNumber((data?.current.length ?? 0) + (data?.upcoming.length ?? 0) + (data?.from_history.length ?? 0)), icon: Users },
                ]}
            >
                <SalesSelect
                    label="ماه"
                    avatar={false}
                    searchable={false}
                    options={MONTH_OPTIONS}
                    value={shownMonth}
                    onChange={setMonth}
                />
            </ColorStatsPanel>

            {loading && !data ? (
                <ListSkeleton rows={3} />
            ) : error ? (
                <ErrorState message={error} onRetry={retry} />
            ) : !data || isEmpty ? (
                <EmptyState
                    title="پیشنهادی برای این ماه نیست"
                    description="از تب «فهرست فصلی» مشخص کنید هر مشتری چه کالایی را در چه ماه‌هایی دارد."
                    icon={<Sprout size={26} />}
                />
            ) : (
                <>
                    {data.current.length > 0 && (
                        <Card>
                            <SectionTitle
                                icon={<Sprout size={16} />}
                                title={`${data.month_name}: این کالاها را از این مشتری‌ها بخرید`}
                            />
                            <SuggestionGroupList groups={data.current} basePath={basePath} />
                        </Card>
                    )}
                    {data.upcoming.length > 0 && (
                        <Card>
                            <SectionTitle
                                icon={<CalendarRange size={16} />}
                                title={`از ${data.next_month_name} شروع می‌شود (آماده‌ی هماهنگی)`}
                            />
                            <SuggestionGroupList groups={data.upcoming} basePath={basePath} />
                        </Card>
                    )}
                    {data.from_history.length > 0 && (
                        <Card>
                            <SectionTitle
                                icon={<ListChecks size={16} />}
                                title={`در ${data.month_name}‌های قبل از اینها خرید کرده‌اید`}
                            />
                            <SuggestionGroupList
                                groups={data.from_history}
                                basePath={basePath}
                                history
                            />
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
