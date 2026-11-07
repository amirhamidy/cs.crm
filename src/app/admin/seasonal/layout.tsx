import type { ReactNode } from "react";
import SeasonalShell from "@/components/crm/seasonal/SeasonalShell";

export default function SeasonalLayout({ children }: { children: ReactNode }) {
    return <SeasonalShell basePath="/admin">{children}</SeasonalShell>;
}
