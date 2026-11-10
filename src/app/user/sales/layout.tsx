import type { ReactNode } from "react";
import SalesShell from "@/components/crm/sales/SalesShell";

export default function SalesLayout({ children }: { children: ReactNode }) {
    return <SalesShell basePath="/user">{children}</SalesShell>;
}
