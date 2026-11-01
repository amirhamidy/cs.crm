"use client";

import type { ReactNode } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";

/** Cross-fades between flow views; render only the active one as child. */
export function ModalViews({ view, children }: { view: string; children: ReactNode }) {
    const reduced = !!useReducedMotion();
    return (
        <AnimatePresence mode="wait" initial={false}>
            <m.div
                key={view}
                initial={{ opacity: 0, x: reduced ? 0 : 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: reduced ? 0 : -12 }}
                transition={{ duration: 0.15 }}
            >
                {children}
            </m.div>
        </AnimatePresence>
    );
}
