"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ShoppingBag, ShoppingCart, ClipboardList } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePortalAuthStore } from "@/store/portalAuthStore";
import { usePortalCartStore } from "@/store/portalCartStore";
import { usePortalLogout } from "@/hooks/usePortalLogout";

const LINKS = [
    { href: "/portal/products/", label: "کالاها", icon: ShoppingBag },
    { href: "/portal/cart/", label: "سبد خرید", icon: ShoppingCart },
    { href: "/portal/orders/", label: "سفارش‌های من", icon: ClipboardList },
];

export default function PortalShell({ children }: { children: React.ReactNode }) {
    const account = usePortalAuthStore((s) => s.account);
    const count = usePortalCartStore((s) => s.items.length);
    const logout = usePortalLogout();
    const pathname = usePathname();

    return (
        <div
            dir="rtl"
            className="min-h-screen bg-gray-50 text-gray-800 dark:bg-[#090d18] dark:text-gray-100"
        >
            <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/85 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#111827]/85">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/radco.png"
                            alt="رادکو"
                            className="h-10 w-10 rounded-2xl object-contain"
                        />
                        <div>
                            <p className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                                پرتال مشتریان رادکو
                            </p>
                            <p className="text-[11px] text-gray-500">
                                {account?.company_name || account?.full_name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <button
                            type="button"
                            onClick={logout}
                            className="flex h-10 items-center gap-1.5 rounded-2xl bg-red-50 px-4 text-[12.5px] font-bold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                        >
                            <LogOut size={15} />
                            خروج
                        </button>
                    </div>
                </div>

                <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3">
                    {LINKS.map(({ href, label, icon: Icon }) => {
                        const active = pathname.startsWith(href.replace(/\/$/, ""));
                        const isCart = href.includes("/cart");
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex h-9 shrink-0 items-center gap-2 rounded-xl px-3.5 text-[11.5px] font-bold transition-colors ${
                                    active
                                        ? "bg-indigo-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/10"
                                }`}
                            >
                                <Icon size={15} />
                                {label}
                                {isCart && count > 0 && (
                                    <span
                                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                            active
                                                ? "bg-white/20 text-white"
                                                : "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                                        }`}
                                    >
                                        {count.toLocaleString("fa-IR")}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </header>
            <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">{children}</main>
        </div>
    );
}
