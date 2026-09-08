"use client";

import { ReactNode, useState } from "react";
import { AlertCircle } from "lucide-react";

interface PermissionTooltipProps {
    allowed: boolean;
    message: string;
    children: ReactNode;
}

export default function PermissionTooltip({
    allowed,
    message,
    children,
}: PermissionTooltipProps) {
    const [open, setOpen] = useState(false);

    if (allowed) {
        return <>{children}</>;
    }

    return (
        <div
            className="relative inline-flex"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
        >
            {children}

            {open && (
                <div className="pointer-events-none absolute bottom-full right-0 z-50 mb-2 w-max max-w-[280px] rounded-xl border border-red-400/15 bg-slate-950 px-3 py-2 text-[10px] font-medium text-white shadow-xl">
                    <div className="flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                        <span>{message}</span>
                    </div>

                    <span className="absolute right-4 top-full h-0 w-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-950" />
                </div>
            )}
        </div>
    );
}
