"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { Portal } from "@/components/ui/Portal";
import { cn, isRouteActive } from "@/lib/utils";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useLogout } from "@/hooks/useLogout";
import { EASE_OUT } from "@/lib/motion";

type Tip = { label: string; top: number; right: number };

const THEME = {
  dark: {
    aside:
      "border-white/10 text-white",
    asideBg:
      "linear-gradient(180deg, #0A1020 0%, #0E1A31 42%, #0B1526 72%, #080E1B 100%)",
    link: "text-white/65 hover:bg-white/[0.07] hover:text-white",
    linkActive: "text-white",
    pill: "border border-white/15 bg-white/[0.11] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
    bar: "shadow-[0_0_10px_rgba(96,165,250,0.9)]",
    footer: "border-white/10",
    r: "text-white/45 hover:bg-white/[0.07] hover:text-white",
    logout: "text-rose-300/85 hover:bg-rose-500/15 hover:text-rose-200",
    scroll: "[scrollbar-color:rgba(255,255,255,0.15)_transparent]",
    tip: "border-white/10 bg-[#0B1526]/95 text-white shadow-[0_16px_40px_-12px_rgba(2,8,23,0.9)]",
    tipArrow: "border-white/10 bg-[#0B1526]",
  },
  light: {
    aside: "border-slate-200 text-slate-700",
    asideBg:
      "linear-gradient(180deg, #FFFFFF 0%, #F5F7FB 50%, #EEF2F8 100%)",
    link: "text-slate-500 hover:bg-slate-900/[0.05] hover:text-slate-900",
    linkActive: "text-slate-900",
    pill: "border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]",
    bar: "shadow-[0_0_8px_rgba(59,130,246,0.5)]",
    footer: "border-slate-200",
    r: "text-slate-400 hover:bg-slate-900/[0.05] hover:text-slate-800",
    logout: "text-rose-500 hover:bg-rose-500/10 hover:text-rose-600",
    scroll: "[scrollbar-color:rgba(15,23,42,0.18)_transparent]",
    tip: "border-slate-200 bg-white/95 text-slate-800 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.25)]",
    tipArrow: "border-slate-200 bg-white",
  },
} as const;

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useLogout();
  const menuItems = useMenuItems();
  const reduced = useReducedMotion() ?? false;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const t = isDark ? THEME.dark : THEME.light;

  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    if (!tip) return;
    const hide = () => setTip(null);
    window.addEventListener("resize", hide);
    return () => window.removeEventListener("resize", hide);
  }, [tip]);

  const showTip = useCallback((el: HTMLElement, label: string) => {
    const r = el.getBoundingClientRect();
    setTip({
      label,
      top: r.top + r.height / 2,
      right: window.innerWidth - r.left + 10,
    });
  }, []);

  const hideTip = useCallback(() => setTip(null), []);

  const tipMotion = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.9, x: 6, y: "-50%" },
        animate: { opacity: 1, scale: 1, x: 0, y: "-50%" },
        exit: { opacity: 0, scale: 0.92, x: 4, y: "-50%" },
      };

  return (
    <>
      <aside
        dir="rtl"
        className={cn(
          "fixed right-0 top-16 z-40 hidden md:flex h-[calc(100dvh-4rem)] w-16 flex-col overflow-hidden md:w-[76px]",
          "border-l transition-colors duration-300",
          t.aside,
        )}
        style={{ background: t.asideBg }}
      >
        {isDark && (
          <>
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
          </>
        )}

        <nav
          onScroll={hideTip}
          className={cn(
            "relative flex-1 overflow-y-auto px-2 py-3 [scrollbar-width:thin]",
            t.scroll,
          )}
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
                      "relative flex h-10 items-center justify-center rounded-xl transition-colors duration-200",
                      isActive ? t.linkActive : t.link,
                    )}
                  >
                    {isActive && (
                      <m.span
                        layoutId={reduced ? undefined : "sidebar-active-pill"}
                        transition={{ duration: 0.25, ease: EASE_OUT }}
                        className={cn("absolute inset-0 rounded-xl", t.pill)}
                      />
                    )}

                    {isActive && (
                      <span
                        className={cn(
                          "absolute -right-2 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-sky-300 to-indigo-400",
                          t.bar,
                        )}
                      />
                    )}

                    <span
                      className={cn(
                        "relative z-10 flex flex-shrink-0 items-center justify-center transition-transform duration-200",
                        "group-hover:-translate-y-0.5 group-hover:scale-[1.06]",
                        isActive && "scale-[1.04]",
                      )}
                    >
                      <item.icon size={18} strokeWidth={1.6} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={cn("relative flex flex-col gap-1.5 border-t p-2", t.footer)}>
          <a
            href="https://radcosys.ir/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="توسعه داده شده توسط تیم فنی رادکو"
            onMouseEnter={(e) => showTip(e.currentTarget, "تیم فنی رادکو")}
            onMouseLeave={hideTip}
            onFocus={(e) => showTip(e.currentTarget, "تیم فنی رادکو")}
            onBlur={hideTip}
            className={cn(
              "relative flex h-9 items-center justify-center rounded-xl text-[11px] font-bold transition-colors",
              t.r,
            )}
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
            className={cn(
              "relative flex h-9 items-center justify-center rounded-xl transition-colors active:scale-[0.98]",
              t.logout,
            )}
          >
            <LogOut size={16} strokeWidth={1.6} className="flex-shrink-0" />
          </button>
        </div>
      </aside>

      <Portal>
        <AnimatePresence>
          {tip && (
            <m.div
              key="sidebar-tooltip"
              role="tooltip"
              {...tipMotion}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              style={{
                position: "fixed",
                top: tip.top,
                right: tip.right,
                transformOrigin: "right center",
                pointerEvents: "none",
              }}
              className={cn(
                "z-[120] flex items-center whitespace-nowrap rounded-xl border px-3 py-2 backdrop-blur-md",
                t.tip,
              )}
            >
              <span className="text-[12px] font-medium">{tip.label}</span>
              <span
                className={cn(
                  "absolute -right-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-r border-t",
                  t.tipArrow,
                )}
              />
            </m.div>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}
