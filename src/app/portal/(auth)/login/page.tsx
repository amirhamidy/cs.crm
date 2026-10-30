import type { Metadata } from "next";
import LoginClient from "@/components/login/LoginClient";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
    title: "ورود | رادکو",
};

export default function PortalLoginPage() {
    return <LoginClient initialMode="customer" />;
}
