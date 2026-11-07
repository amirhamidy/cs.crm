import type { ReactNode } from "react";
import { RouteTabs, type RouteTabItem } from "./RouteTabs";

interface Props {
    icon?: ReactNode;
    title?: string;
    subtitle?: string;
    tabsLabel: string;
    tabs: RouteTabItem[];
    children: ReactNode;
}

/** قالب مشترک صفحه‌هایی که چند تبِ جدا (روت جدا) دارند؛ در layout نگه داشته می‌شود و با عوض شدن تب دوباره ساخته نمی‌شود. */
export function TabbedPageShell({ tabsLabel, tabs, children }: Props) {
    return (
        <div className="flex flex-col gap-5" dir="rtl">
            <RouteTabs items={tabs} label={tabsLabel} />
            {children}
        </div>
    );
}
