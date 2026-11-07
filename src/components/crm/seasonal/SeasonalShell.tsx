import { ListChecks, Sprout } from "lucide-react";
import type { ReactNode } from "react";
import { TabbedPageShell } from "../shared/TabbedPageShell";
import type { BasePath } from "../shared/types";

/** هدر و تب‌های «مشتریان فصلی»؛ هر تب یک روت جدا در app/<role>/seasonal است. */
export default function SeasonalShell({
    basePath,
    children,
}: {
    basePath: BasePath;
    children: ReactNode;
}) {
    return (
        <TabbedPageShell
            tabsLabel="بخش‌های مشتریان فصلی"
            tabs={[
                { href: `${basePath}/seasonal`, label: "پیشنهاد ماه", icon: <Sprout size={14} /> },
                {
                    href: `${basePath}/seasonal/list`,
                    label: "فهرست فصلی",
                    icon: <ListChecks size={14} />,
                },
            ]}
        >
            {children}
        </TabbedPageShell>
    );
}
