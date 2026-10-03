"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FullPageLoader } from "@/components/AuthGate";
import { useAuthStore } from "@/store/authStore";
import LoginClient from "./LoginClient";

export default function LoginPage() {
    const router = useRouter();
    const hasHydrated = useAuthStore((s) => s.hasHydrated);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const userType = useAuthStore((s) => s.userType);

    useEffect(() => {
        if (!hasHydrated || !isAuthenticated) return;

        router.replace(
            userType === 1 ? "/admin/dashboard/" : "/user/dashboard/",
        );
    }, [hasHydrated, isAuthenticated, userType, router]);

    if (!hasHydrated || isAuthenticated) return <FullPageLoader />;

    return <LoginClient />;
}
