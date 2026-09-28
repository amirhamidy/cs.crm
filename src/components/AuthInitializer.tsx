"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function AuthInitializer() {
    const initSession = useAuthStore((state) => state.initSession);

    useEffect(() => {
        initSession();
    }, [initSession]);

    return null;
}