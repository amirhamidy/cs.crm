import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/Feedback";
import { RouteTabs, type RouteTabItem } from "./RouteTabs";

interface Props {
    icon: ReactNode;
    title: string;
    subtitle: string;
    tabsLabel: string;
    tabs: RouteTabItem[];
    children: ReactNode;
}

/** قالب مشترک صفحه‌هایی که چند تبِ جدا (روت جدا) دارند؛ در layout نگه داشته می‌شود و با عوض شدن تب دوباره ساخته نمی‌شود. */
export function TabbedPageShell({ icon, title, subtitle, tabsLabel, tabs, children }: Props) {
    return (
        <div className="flex flex-col gap-5" dir="rtl">
            <PageHeader icon={icon} title={title} subtitle={subtitle} />
            <RouteTabs items={tabs} label={tabsLabel} />
            {children}
        </div>
    );
}
