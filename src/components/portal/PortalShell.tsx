"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, ShoppingCart, ClipboardList } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import PortalProfileMenu from "@/components/portal/PortalProfileMenu";
import { usePortalCartStore } from "@/store/portalCartStore";

const LINKS = [
    { href: "/portal/products/", label: "کالاها", icon: ShoppingBag },
    { href: "/portal/cart/", label: "سبد خرید", icon: ShoppingCart },
    { href: "/portal/orders/", label: "سفارش‌های من", icon: ClipboardList },
];

export default function PortalShell({ children }: { children: React.ReactNode }) {
    const count = usePortalCartStore((s) => s.items.length);
    const pathname = usePathname();
    const isActive = (href: string) => pathname.startsWith(href.replace(/\/$/, ""));

    return (
        <div
            dir="rtl"
            className="min-h-screen bg-gray-50 text-gray-800 dark:bg-[#090d18] dark:text-gray-100"
        >
            <header className="sticky top-0 z-40 border-b border-gray-100 bg-white dark:border-white/[0.08] dark:bg-[#111827]">
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 md:h-16">
                    <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/radco.png" alt="رادکو" className="h-9 w-9 rounded-xl object-contain" />
                        <p className="text-[14px] font-bold text-gray-900 dark:text-white">
                            پرتال مشتریان رادکو
                        </p>
                    </div>

                    <nav className="hidden items-center gap-2 md:flex">
                        {LINKS.map(({ href, label, icon: Icon }) => {
                            const active = isActive(href);
                            const isCart = href.includes("/cart");
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`flex h-9 items-center gap-2 rounded-xl px-3.5 text-[11.5px] font-bold transition-colors ${
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

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <PortalProfileMenu />
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:py-8 md:pb-8">{children}</main>

            <nav
                aria-label="ناوبری پرتال"
                className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white pb-[env(safe-area-inset-bottom)] md:hidden dark:border-white/[0.08] dark:bg-[#111827]"
            >
                <div className="grid grid-cols-3 gap-1 p-1.5">
                    {LINKS.map(({ href, label, icon: Icon }) => {
                        const active = isActive(href);
                        const isCart = href.includes("/cart");
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`relative flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10.5px] font-bold transition-colors ${
                                    active
                                        ? "bg-indigo-600 text-white"
                                        : "text-gray-500 dark:text-gray-400"
                                }`}
                            >
                                <Icon size={18} />
                                {label}
                                {isCart && count > 0 && (
                                    <span className="absolute end-[calc(50%-24px)] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                                        {count.toLocaleString("fa-IR")}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
