"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FullPageLoader } from "@/components/AuthGate";
import { useAuthStore } from "@/store/authStore";
import LoginClient from "../../components/login/LoginClient";

export default function LoginPage() {
    const router = useRouter();
    const hasHydrated = useAuthStore((s) => s.hasHydrated);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    useEffect(() => {
        if (!hasHydrated || !isAuthenticated) return;

        router.replace("/hub/");
    }, [hasHydrated, isAuthenticated, router]);

    if (!hasHydrated || isAuthenticated) return <FullPageLoader />;

    return <LoginClient />;
}
