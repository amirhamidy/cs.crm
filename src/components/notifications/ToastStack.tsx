"use client";

import { useEffect, useState } from "react";
import {
    AnimatePresence,
    motion,
    useReducedMotion,
} from "framer-motion";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";
import type {
    Toast,
    ToastType,
} from "./types";

const TONES: Record<
    ToastType,
    {
        box: string;
        dot: string;
    }
> = {
    success: {
        box: "border-green-100 text-green-900 dark:border-green-500/20 dark:text-green-50",
        dot: "bg-green-500",
    },
    error: {
        box: "border-red-100 text-red-900 dark:border-red-500/20 dark:text-red-50",
        dot: "bg-red-500",
    },
    info: {
        box: "border-indigo-100 text-indigo-950 dark:border-indigo-400/20 dark:text-indigo-50",
        dot: "bg-indigo-500",
    },
};

function ToastItem({
    toast,
}: {
    toast: Toast;
}) {
    const router = useRouter();

    const reduceMotion =
        useReducedMotion();

    const dismiss =
        useNotificationStore(
            (state) =>
                state.dismissToast,
        );

    const [paused, setPaused] =
        useState(false);

    useEffect(() => {
        if (paused) return;

        const timer =
            window.setTimeout(
                () => dismiss(toast.id),
                toast.duration,
            );

        return () =>
            window.clearTimeout(timer);
    }, [
        paused,
        toast.id,
        toast.duration,
        dismiss,
    ]);

    const tone =
        TONES[toast.type];

    const open = () => {
        if (!toast.href) return;

        dismiss(toast.id);
        router.push(toast.href);
    };

    const content = (
        <>
            <span
                className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`}
            />

            <span className="min-w-0">
                <span className="block text-sm font-medium tracking-tight">
                    {toast.message}
                </span>

                {toast.description && (
                    <span className="mt-0.5 block line-clamp-2 text-xs opacity-70">
                        {toast.description}
                    </span>
                )}
            </span>
        </>
    );

    return (
        <motion.div
            layout
            initial={
                reduceMotion
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        scale: 0.9,
                        y: -20,
                    }
            }
            animate={{
                opacity: 1,
                scale: 1,
                y: 0,
            }}
            exit={
                reduceMotion
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        scale: 0.9,
                        y: -20,
                    }
            }
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
            }}
            onMouseEnter={() =>
                setPaused(true)
            }
            onMouseLeave={() =>
                setPaused(false)
            }
            role={
                toast.type === "error"
                    ? "alert"
                    : "status"
            }
            className={`pointer-events-auto flex w-fit max-w-[min(92vw,26rem)] items-center gap-3 rounded-2xl border bg-white/90 px-4 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl dark:bg-slate-900/90 dark:shadow-[0_8px_30px_rgb(0,0,0,0.45)] ${tone.box}`}
        >
            {toast.href ? (
                <button
                    type="button"
                    onClick={open}
                    className="flex min-w-0 items-center gap-3 text-start"
                >
                    {content}
                </button>
            ) : (
                <div className="flex min-w-0 items-center gap-3">
                    {content}
                </div>
            )}

            <button
                type="button"
                onClick={() =>
                    dismiss(toast.id)
                }
                aria-label="بستن"
                className="flex shrink-0 items-center justify-center rounded-full p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            >
                <X size={14} />
            </button>
        </motion.div>
    );
}

export function ToastStack() {
    const toasts =
        useNotificationStore(
            (state) => state.toasts,
        );

    return (
        <div
            dir="rtl"
            aria-live="polite"
            className="pointer-events-none fixed inset-x-0 top-6 z-[100000] flex flex-col items-center gap-2 px-4"
        >
            <AnimatePresence>
                {toasts.map((toast) => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}