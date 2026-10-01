"use client";

import { useState, type ReactNode } from "react";
import { AuthStoreContext, createAuthStore } from "@/store/authStore";
import type { SessionUser } from "@/lib/auth/getSession";

export default function AuthHydrator({
    user,
    children,
}: {
    user: SessionUser | null;
    children: ReactNode;
}) {
    const [store] = useState(() =>
        createAuthStore(
            user
                ? { username: user.username, userType: user.type, userId: user.id }
                : null,
        ),
    );

    return (
        <AuthStoreContext.Provider value={store}>
            {children}
        </AuthStoreContext.Provider>
    );
}