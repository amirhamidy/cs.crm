"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function userPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/user/dashboard");
    }, []);

    return null;
}
