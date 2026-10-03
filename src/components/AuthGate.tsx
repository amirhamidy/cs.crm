"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function FullPageLoader() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500/20 border-t-indigo-500" />
        </div>
    );
}

export default function AuthGate({
    role,
    children,
}: {
    role: 1 | 2;
    children: ReactNode;
}) {
    const router = useRouter();
    const hasHydrated = useAuthStore((s) => s.hasHydrated);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const userType = useAuthStore((s) => s.userType);

    useEffect(() => {
        if (!hasHydrated) return;

        if (!isAuthenticated) {
            router.replace("/login/");
            return;
        }

        if (userType !== role) {
            router.replace(userType === 1 ? "/admin/dashboard/" : "/user/dashboard/");
        }
    }, [hasHydrated, isAuthenticated, userType, role, router]);

    if (!hasHydrated || !isAuthenticated || userType !== role) {
        return <FullPageLoader />;
    }

    return <>{children}</>;
}
