"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fade } from "@/lib/motion";
import { getOverlayCount } from "./Portal";

/** Shared modal backdrop. Fades opacity only; blur is static (see .modal-backdrop). */
export function Backdrop({ onClick }: { onClick?: () => void }) {
    // Depth is fixed at mount so only the first layer gets blur.
    const [depth] = useState(() => getOverlayCount() + 1);
    useEffect(() => {
        if (process.env.NODE_ENV !== "production" && depth > 1) {
            console.warn("[Modal] Nested modal detected. Use useModalFlow + ModalViews instead.");
        }
    }, [depth]);
    return (
        <motion.div
            {...fade}
            aria-hidden="true"
            data-depth={depth}
            onClick={onClick}
            className="modal-backdrop absolute inset-0"
        />
    );
}
