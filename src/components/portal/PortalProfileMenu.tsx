"use client";

import { useCallback, useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import Popover from "@/components/ui/Popover";
import { usePortalAuthStore } from "@/store/portalAuthStore";
import { usePortalLogout } from "@/hooks/usePortalLogout";

export default function PortalProfileMenu() {
    const account = usePortalAuthStore((s) => s.account);
    const logout = usePortalLogout();
    const [open, setOpen] = useState(false);
    const close = useCallback(() => setOpen(false), []);
    const name = account?.company_name || account?.full_name || "حساب کاربری";

    return (
        <Popover
            open={open}
            onClose={close}
            label="پروفایل"
            panelClassName="absolute end-0 top-full mt-2 w-64 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl dark:border-white/[0.08] dark:bg-[#111827]"
            trigger={
                <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    onClick={() => setOpen((v) => !v)}
                    className="flex h-9 items-center gap-2 rounded-xl px-2 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
                >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white">
                        <UserRound size={15} />
                    </span>
                    <span className="hidden max-w-[140px] truncate text-[11.5px] font-bold md:block">{name}</span>
                    <ChevronDown size={14} />
                </button>
            }
        >
            <div className="mb-3 flex items-center gap-2 px-1 text-[11.5px] text-gray-500">
                <UserRound size={15} />
                <span className="truncate">{name}</span>
            </div>
            <button
                type="button"
                onClick={logout}
                className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-red-50 text-[12.5px] font-bold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
            >
                <LogOut size={15} />
                خروج
            </button>
        </Popover>
    );
}
