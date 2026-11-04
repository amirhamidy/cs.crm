"use client";

import { useEffect } from "react";

/**
 * Workaround: after the modal has been open and then closes (or unmounts),
 * reload the page to avoid the UI freeze.
 */
export function useReloadOnClose(open: boolean, enabled: boolean = true) {
    useEffect(() => {
        if (!open || !enabled) return;
        return () => {
            if (typeof window === "undefined") return;
            window.setTimeout(() => window.location.reload(), 150);
        };
    }, [open, enabled]);
}
