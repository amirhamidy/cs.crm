"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { fade } from "@/lib/motion";
import { getOverlayCount } from "./Portal";

/** Shared modal backdrop. Fades opacity only; blur is static (see .modal-backdrop). */
export function Backdrop({ onClick }: { onClick?: () => void }) {
    // Depth is fixed at mount so only the first layer gets blur.
    const [depth] = useState(() => getOverlayCount() + 1);
    return (
        <m.div
            {...fade}
            aria-hidden="true"
            data-depth={depth}
            onClick={onClick}
            className="modal-backdrop absolute inset-0"
        />
    );
}
