"use client";

import { useMemo, type ReactNode } from "react";
import { BarChart3, Package, Repeat, ShoppingBag, TriangleAlert } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import type { RouteTabItem } from "../shared/RouteTabs";
import { TabbedPageShell } from "../shared/TabbedPageShell";
import type { BasePath } from "../shared/types";

/** هدر و تب‌های «خرید و فروش»؛ هر تب یک روت جدا در app/<role>/sales است. */
export default function SalesShell({
    basePath,
    children,
}: {
    basePath: BasePath;
    children: ReactNode;
}) {
    const { can } = usePermissions();
    const canViewSales = can("sales", "view");
    const canViewProducts = can("products", "view");

    const tabs = useMemo<RouteTabItem[]>(
        () => [
            ...(canViewSales
                ? [
                      { href: `${basePath}/sales`, label: "خرید و فروش", icon: <ShoppingBag size={14} /> },
                      { href: `${basePath}/sales/top`, label: "مشتریان برتر", icon: <BarChart3 size={14} /> },
                      {
                          href: `${basePath}/sales/issues`,
                          label: "پیگیری بار",
                          icon: <TriangleAlert size={14} />,
                      },
                  ]
                : []),
            ...(canViewProducts
                ? [
                      {
                          href: `${basePath}/sales/products`,
                          label: "کالاها",
                          icon: <Package size={14} />,
                      },
                      {
                          href: `${basePath}/sales/trade-options`,
                          label: "انواع معامله و بار",
                          icon: <Repeat size={14} />,
                      },
                  ]
                : []),
        ],
        [basePath, canViewSales, canViewProducts],
    );

    return (
        <TabbedPageShell
            tabsLabel="بخش‌های فروش"
            tabs={tabs}
        >
            {children}
        </TabbedPageShell>
    );
}
