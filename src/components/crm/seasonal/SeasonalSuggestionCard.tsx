"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, Sprout } from "lucide-react";
import { seasonalApi } from "@/lib/api";
import type { SeasonalSuggestions } from "@/types/crm";
import { Card, SectionTitle } from "../shared/ui";

export default function SeasonalSuggestionCard({ basePath }: { basePath: "/admin" | "/user" }) {
    const { can } = usePermissions();
    const allowed = can("seasonal", "view");
    const [data, setData] = useState<SeasonalSuggestions | null>(null);

    useEffect(() => {
        if (!allowed) return;
        const controller = new AbortController();
        seasonalApi
            .suggestions(undefined, controller.signal)
            .then(setData)
            .catch(() => undefined);
        return () => controller.abort();
    }, [allowed]);

    if (!allowed || !data) return null;

    const groups = data.current.length > 0 ? data.current : data.from_history;
    if (groups.length === 0) return null;

    return (
        <Card>
            <SectionTitle
                icon={<Sprout size={16} />}
                title={`پیشنهاد خرید ${data.month_name}`}
                actions={
                    <Link
                        href={`${basePath}/seasonal/`}
                        className="text-[11.5px] font-bold text-brand hover:underline"
                    >
                        همه
                    </Link>
                }
            />
            <ul className="flex flex-col gap-3">
                {groups.slice(0, 3).map((g) => (
                    <li key={g.product.id}>
                        <div className="mb-1 text-[12.5px] font-extrabold text-gray-800 dark:text-gray-100">
                            {g.product.name}
                        </div>
                        <ul className="flex flex-col gap-1">
                            {g.customers.slice(0, 3).map((c) => (
                                <li
                                    key={c.id}
                                    className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2 text-[12px] dark:bg-white/[0.04]"
                                >
                                    <Link
                                        href={`${basePath}/customer/${c.id}/`}
                                        className="min-w-0 truncate font-bold text-gray-700 hover:text-brand dark:text-gray-200"
                                    >
                                        {c.full_name}
                                    </Link>
                                    {c.phone_number && (
                                        <a
                                            href={`tel:${c.phone_number}`}
                                            dir="ltr"
                                            className="flex shrink-0 items-center gap-1 text-gray-400 hover:text-brand"
                                        >
                                            <Phone size={11} /> {c.phone_number}
                                        </a>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </Card>
    );
}
