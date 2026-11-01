"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Skeleton, SkeletonAvatar, SkeletonBlock } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/store/authStore";

export function FullPageLoader() {
    return (
        <div aria-busy="true" className="animate-pulse motion-reduce:animate-none min-h-screen bg-gray-50 dark:bg-[#090d18]">
            <div className="flex h-16 items-center justify-between border-b border-gray-100 bg-white px-4 dark:border-white/[0.08] dark:bg-[#111827]">
                <Skeleton className="h-8 w-32" />
                <SkeletonAvatar size={36} />
            </div>
            <div className="flex">
                <aside className="hidden w-64 shrink-0 space-y-3 border-e border-gray-100 bg-white p-4 md:block dark:border-white/[0.08] dark:bg-[#111827]">
                    {Array.from({ length: 6 }, (_, i) => (
                        <Skeleton key={i} className="h-9 w-full rounded-xl" />
                    ))}
                </aside>
                <main className="min-w-0 flex-1 space-y-4 p-4">
                    <Skeleton className="h-8 w-48" />
                    <SkeletonBlock className="h-28" />
                    <SkeletonBlock className="h-40" />
                </main>
            </div>
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
