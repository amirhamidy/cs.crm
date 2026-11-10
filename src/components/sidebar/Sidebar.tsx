"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { m, useReducedMotion } from "framer-motion";
import { LogOut } from "lucide-react";
import { Portal } from "@/components/ui/Portal";
import { cn, isRouteActive } from "@/lib/utils";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useLogout } from "@/hooks/useLogout";
import { EASE_OUT } from "@/lib/motion";
import MenuIcon from "./MenuIcon";

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useLogout();
  const menuItems = useMenuItems();
  const reduced = useReducedMotion() ?? false;

  const [tip, setTip] = useState<{
    label: string;
    top: number;
    right: number;
  } | null>(null);

  const showTip = useCallback((el: HTMLElement, label: string) => {
    const r = el.getBoundingClientRect();
    setTip({
      label,
      top: r.top + r.height / 2,
      right: window.innerWidth - r.left + 10,
    });
  }, []);

  const hideTip = useCallback(() => setTip(null), []);

  return (
    <>
      <aside
        dir="rtl"
        className={cn(
          "fixed right-0 top-16 z-40 flex h-[calc(100dvh-4rem)] w-16 flex-col overflow-hidden md:w-[76px]",
          "border-l border-white/10 text-white",
          "shadow-[0_0_60px_-15px_rgba(2,8,23,0.9)]",
        )}
        style={{
          background:
            "linear-gradient(180deg, #0A1020 0%, #0E1A31 42%, #0B1526 72%, #080E1B 100%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-1/2 h-64 w-64 translate-x-1/2 rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(56,132,255,0.35), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-0 h-56 w-56 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(255,170,60,0.22), transparent 70%)" }}
        />

        <nav
          onScroll={hideTip}
          className="relative flex-1 overflow-y-auto px-2 py-3 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]"
        >
          <ul className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const isActive = isRouteActive(pathname, item.href);

              return (
                <li key={item.href} className="group relative">
                  <Link
                    href={item.href}
                    onMouseEnter={(e) => showTip(e.currentTarget, item.label)}
                    onMouseLeave={hideTip}
                    onFocus={(e) => showTip(e.currentTarget, item.label)}
                    onBlur={hideTip}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={item.label}
                    className={cn(
                      "relative flex h-12 items-center justify-center rounded-2xl transition-colors duration-200",
                      isActive
                        ? "text-white"
                        : "text-white/65 hover:bg-white/[0.07] hover:text-white",
                    )}
                  >
                    {isActive && (
                      <m.span
                        layoutId={reduced ? undefined : "sidebar-active-pill"}
                        transition={{ duration: 0.25, ease: EASE_OUT }}
                        className="absolute inset-0 rounded-2xl border border-white/15 bg-white/[0.11] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                      />
                    )}

                    {isActive && (
                      <span className="absolute -right-2 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-sky-300 to-indigo-400 shadow-[0_0_10px_rgba(96,165,250,0.9)]" />
                    )}

                    <span
                      className={cn(
                        "relative z-10 flex flex-shrink-0 items-center justify-center transition-transform duration-200",
                        "group-hover:-translate-y-0.5 group-hover:scale-[1.08]",
                        isActive && "scale-[1.06]",
                      )}
                    >
                      <MenuIcon
                        image={item.image}
                        fallback={item.icon}
                        size={28}
                        alt={item.label}
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="relative flex flex-col gap-1.5 border-t border-white/10 p-2">
          <a
            href="https://radcosys.ir/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="توسعه داده شده توسط تیم فنی رادکو"
            onMouseEnter={(e) => showTip(e.currentTarget, "تیم فنی رادکو")}
            onMouseLeave={hideTip}
            onFocus={(e) => showTip(e.currentTarget, "تیم فنی رادکو")}
            onBlur={hideTip}
            className="relative flex h-10 items-center justify-center rounded-2xl text-[11px] font-bold text-white/45 transition-colors hover:bg-white/[0.07] hover:text-white"
          >
            R
          </a>

          <button
            type="button"
            onClick={logout}
            aria-label="خروج"
            onMouseEnter={(e) => showTip(e.currentTarget, "خروج از حساب")}
            onMouseLeave={hideTip}
            onFocus={(e) => showTip(e.currentTarget, "خروج از حساب")}
            onBlur={hideTip}
            className="relative flex h-11 items-center justify-center rounded-2xl text-rose-300/85 transition-colors hover:bg-rose-500/15 hover:text-rose-200 active:scale-[0.98]"
          >
            <LogOut size={18} strokeWidth={1.6} className="flex-shrink-0" />
          </button>
        </div>
      </aside>

      <Portal>
        <div
          role="tooltip"
          aria-hidden={!tip}
          style={{
            position: "fixed",
            top: tip?.top ?? 0,
            right: tip?.right ?? 0,
            transform: "translateY(-50%)",
            opacity: tip ? 1 : 0,
            transition: "opacity 150ms ease",
            pointerEvents: "none",
          }}
          className={cn(
            "z-[120] flex items-center whitespace-nowrap rounded-xl border border-white/10",
            "bg-[#0B1526]/95 px-3 py-2 shadow-[0_16px_40px_-12px_rgba(2,8,23,0.9)] backdrop-blur-md",
          )}
        >
          <span className="text-[12px] font-medium text-white">{tip?.label}</span>
          <span className="absolute -right-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-r border-t border-white/10 bg-[#0B1526]" />
        </div>
      </Portal>
    </>
  );
}
