"use client";

import AuthGate from "@/components/AuthGate";
import AppShell from "@/components/shell/AppShell";
import PermissionGuard from "@/components/PermissionGuard";

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGate role={2}>
            <AppShell><PermissionGuard>{children}</PermissionGuard></AppShell>
        </AuthGate>
    );
}
