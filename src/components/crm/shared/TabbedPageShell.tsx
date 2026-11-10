"use client";

import type { ReactNode } from "react";
import { RouteTabs, type RouteTabItem } from "./RouteTabs";
import { PAGE_WRAP } from "./kit";

interface Props {
    icon?: ReactNode;
    title?: string;
    subtitle?: string;
    tabsLabel: string;
    tabs: RouteTabItem[];
    children: ReactNode;
}

export function TabbedPageShell({ tabsLabel, tabs, children }: Props) {
    return (
        <div className={PAGE_WRAP} dir="rtl">
            <RouteTabs items={tabs} label={tabsLabel} />
            {children}
        </div>
    );
}
