"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { normalizePath } from "@/lib/utils";
import { TAB_LIST_CLASS, tabClass } from "./ui";

export interface RouteTabItem {
    href: string;
    label: string;
    icon?: ReactNode;
}

/**
 * تب‌هایی که هرکدام یک روت جدا در app هستند.
 * با کلیک فقط همان روت (کد و درخواست‌های خودش) لود می‌شود و بقیه‌ی تب‌ها اصلاً اجرا نمی‌شوند.
 */
export function RouteTabs({ items, label }: { items: RouteTabItem[]; label: string }) {
    const pathname = normalizePath(usePathname());

    return (
        <nav aria-label={label} className={TAB_LIST_CLASS}>
            {items.map((item) => {
                const active = pathname === normalizePath(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        scroll={false}
                        aria-current={active ? "page" : undefined}
                        className={tabClass(active)}
                    >
                        {item.icon}
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
