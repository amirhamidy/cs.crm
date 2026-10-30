"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ShoppingBag, ShoppingCart, ClipboardList } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePortalAuthStore } from "@/store/portalAuthStore";
import { usePortalCartStore } from "@/store/portalCartStore";
import { usePortalLogout } from "@/hooks/usePortalLogout";

export default function PortalShell({ children }: { children: React.ReactNode }) {
  const account = usePortalAuthStore((s) => s.account);
  const count = usePortalCartStore((s) => s.items.length);
  const logout = usePortalLogout();
  const pathname = usePathname();
  const links = [{ href: "/portal/products/", label: "کالاها", icon: ShoppingBag }, { href: "/portal/cart/", label: "سبد خرید", icon: ShoppingCart }, { href: "/portal/orders/", label: "سفارش‌های من", icon: ClipboardList }];
  return <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-800 dark:bg-[#090d18] dark:text-slate-100">
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3"><img src="/radco.png" alt="رادکو" className="h-9 w-9 rounded-xl object-contain"/><div><p className="text-sm font-black">پرتال مشتریان رادکو</p><p className="text-[11px] text-slate-500">{account?.company_name || account?.full_name}</p></div></div>
        <div className="flex items-center gap-2"><ThemeToggle/><button onClick={logout} className="flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 dark:bg-rose-500/10"><LogOut size={15}/> خروج</button></div>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3">{links.map(({href,label,icon:Icon}) => <Link key={href} href={href} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold ${pathname.startsWith(href.replace(/\/$/, "")) ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300"}`}><Icon size={15}/>{label}{href.includes("/cart") && count > 0 ? ` (${count})` : ""}</Link>)}</nav>
    </header>
    <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">{children}</main>
  </div>;
}
