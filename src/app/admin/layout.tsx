"use client";

import AuthGate from "@/components/AuthGate";
import AppShell from "@/components/shell/AppShell";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGate role={1}>
            <AppShell>{children}</AppShell>
        </AuthGate>
    );
}
