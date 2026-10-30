import type { Metadata } from "next";
import PortalAuthGate from "@/components/portal/PortalAuthGate";
import PortalShell from "@/components/portal/PortalShell";
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default function PortalAppLayout({ children }: { children: React.ReactNode }) {
  return <PortalAuthGate><PortalShell>{children}</PortalShell></PortalAuthGate>;
}
