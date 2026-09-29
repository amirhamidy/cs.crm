"use client";

import { useRef, type ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";
import type { SessionUser } from "@/lib/auth/getSession";

export default function AuthHydrator({
    user,
    children,
}: {
    user: SessionUser;
    children: ReactNode;
}) {
    const initialized = useRef(false);

    if (!initialized.current) {
        useAuthStore.getState().setAuth({
            username: user.username,
            userType: user.type,
            userId: user.id,
        });
        initialized.current = true;
    }

    return children;
}