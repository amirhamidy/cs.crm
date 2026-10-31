"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

export { useIsMobile } from "@/hooks/useIsMobile";

const noopSub = () => () => {};

/** Renders children into document.body (client only). */
export function Portal({ children }: { children: ReactNode }) {
    const mounted = useSyncExternalStore(noopSub, () => true, () => false);
    if (!mounted) return null;
    return createPortal(children, document.body);
}

// ── global overlay stack (Esc handling) + ref-counted scroll lock ──
let idCounter = 0;
const stack: number[] = [];
let lockCount = 0;
let prevOverflow = "";

function lockScroll() {
    if (lockCount++ === 0) {
        prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
    }
}
function unlockScroll() {
    if (lockCount > 0 && --lockCount === 0) {
        document.body.style.overflow = prevOverflow;
    }
}

const FOCUSABLE =
    'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function getFocusables(root: HTMLElement) {
    return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0,
    );
}

interface ModalBehaviorOptions {
    open: boolean;
    onClose: () => void;
    containerRef: RefObject<HTMLElement | null>;
    /** Block Esc while a request is running */
    busy?: boolean;
    lockScroll?: boolean;
    trapFocus?: boolean;
}

/**
 * Esc (topmost overlay only), ref-counted body scroll lock,
 * lightweight focus trap, and focus restore on close.
 */
export function useModalBehavior({
    open,
    onClose,
    containerRef,
    busy = false,
    lockScroll: lock = true,
    trapFocus = true,
}: ModalBehaviorOptions) {
    const onCloseRef = useRef(onClose);
    const busyRef = useRef(busy);
    useEffect(() => {
        onCloseRef.current = onClose;
        busyRef.current = busy;
    });

    useEffect(() => {
        if (!open) return;
        const id = ++idCounter;
        stack.push(id);
        const previous = document.activeElement as HTMLElement | null;
        if (lock) lockScroll();

        const raf = trapFocus
            ? requestAnimationFrame(() => {
                  const c = containerRef.current;
                  if (!c || c.contains(document.activeElement)) return;
                  const auto = c.querySelector<HTMLElement>("[data-autofocus]");
                  (auto ?? c).focus({ preventScroll: true });
              })
            : 0;

        const onKey = (e: KeyboardEvent) => {
            if (stack[stack.length - 1] !== id) return;
            if (e.key === "Escape") {
                if (busyRef.current) return;
                e.preventDefault();
                onCloseRef.current();
                return;
            }
            if (e.key !== "Tab" || !trapFocus) return;
            const c = containerRef.current;
            if (!c) return;
            const items = getFocusables(c);
            if (items.length === 0) {
                e.preventDefault();
                c.focus();
                return;
            }
            const first = items[0];
            const last = items[items.length - 1];
            const active = document.activeElement as HTMLElement | null;
            if (!active || !c.contains(active) || active === c) {
                e.preventDefault();
                (e.shiftKey ? last : first).focus();
            } else if (e.shiftKey && active === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener("keydown", onKey);

        return () => {
            document.removeEventListener("keydown", onKey);
            if (raf) cancelAnimationFrame(raf);
            const i = stack.indexOf(id);
            if (i >= 0) stack.splice(i, 1);
            if (lock) unlockScroll();
            if (trapFocus && previous && document.contains(previous)) {
                previous.focus({ preventScroll: true });
            }
        };
    }, [open, lock, trapFocus, containerRef]);
}
