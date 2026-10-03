"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";
import {
    notificationsStorageKey,
    useNotificationStore,
} from "@/store/notificationStore";
import { ToastStack } from "./ToastStack";
import axiosInstance from "@/lib/axiosInstance";
import { installSelfChangeTracker } from "./sync/selfchanges";
import { createSyncEngine } from "./sync/Engine";

export function NotificationProvider({
    children,
}: {
    children: ReactNode;
}) {
    const userId = useAuthStore((state) => state.userId);
    const username = useAuthStore((state) => state.username);
    const isAuthenticated = useAuthStore(
        (state) => state.isAuthenticated,
    );
    const hasHydrated = useAuthStore(
        (state) => state.hasHydrated,
    );

    const bind = useNotificationStore(
        (state) => state.bind,
    );

    const reload = useNotificationStore(
        (state) => state.reload,
    );

    const activeUserId =
        hasHydrated &&
            isAuthenticated &&
            userId != null
            ? userId
            : null;

    useEffect(() => {
        bind(activeUserId);
    }, [activeUserId, bind]);

    useEffect(() => {
        if (activeUserId == null) {
            return;
        }

        const removeSelfChangeTracker =
            installSelfChangeTracker(
                axiosInstance,
                activeUserId,
            );

        const engine = createSyncEngine({
            userId: activeUserId,
            username,
        });

        engine.start();

        return () => {
            engine.stop();
            removeSelfChangeTracker();
        };
    }, [activeUserId, username]);

    useEffect(() => {
        if (activeUserId == null) {
            return;
        }

        const key =
            notificationsStorageKey(activeUserId);

        const onStorage = (
            event: StorageEvent,
        ) => {
            if (event.key === key) {
                reload();
            }
        };

        window.addEventListener(
            "storage",
            onStorage,
        );

        return () => {
            window.removeEventListener(
                "storage",
                onStorage,
            );
        };
    }, [activeUserId, reload]);

    return (
        <>
            {children}
            <ToastStack />
        </>
    );
}