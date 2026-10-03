"use client";

import AuthGate from "@/components/AuthGate";
import AppShell from "@/components/shell/AppShell";

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGate role={2}>
            <AppShell>{children}</AppShell>
        </AuthGate>
    );
}
