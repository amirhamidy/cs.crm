import type { Metadata } from "next";
import PortalLoginClient from "@/components/portal/PortalLoginClient";
export const metadata: Metadata = { robots: { index: false, follow: false }, title: "ورود مشتریان | رادکو" };
export default function PortalLoginPage() { return <PortalLoginClient />; }
