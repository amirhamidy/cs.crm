"use client";

import { useSyncExternalStore } from "react";

// Matches Tailwind's `md` breakpoint (768px).
const QUERY = "(max-width: 767px)";

function subscribe(cb: () => void) {
    const mq = window.matchMedia(QUERY);
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;
// Only used if rendered on the server; the app is client-only.
const getServerSnapshot = () => false;

/** Real viewport value from the very first client render (no flash). */
export function useIsMobile(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
