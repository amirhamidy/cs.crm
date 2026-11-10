"use client";

import type { ReactNode } from "react";
import { useIsPresent } from "framer-motion";
import { cn } from "@/lib/utils";

export function ModalLayer({
    className,
    children,
    dir,
}: {
    className: string;
    children: ReactNode;
    dir?: "rtl" | "ltr";
}) {
    const present = useIsPresent();
    return (
        <div dir={dir} className={cn(className, !present && "pointer-events-none")}>
            {children}
        </div>
    );
}
