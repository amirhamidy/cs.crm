"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/useSidebar";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useLogout } from "@/hooks/useLogout";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 16, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function MobileSidebar() {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebar();
  const {logout} = useLogout();
  const menuItems = useMenuItems();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden dark:bg-black/40"
            onClick={toggle}
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-[280px] bg-white/95 backdrop-blur-xl z-50 shadow-xl md:hidden dark:bg-slate-950/95 dark:border-l dark:border-white/10 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200/60 dark:border-white/10">
              <h2 className="text-[14px] font-medium text-gray-900 dark:text-white">
                منوی اصلی
              </h2>
              <motion.button
                onClick={toggle}
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="p-1.5 rounded-lg hover:bg-gray-100/80 transition-colors dark:hover:bg-white/10"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" strokeWidth={1.5} />
              </motion.button>
            </div>

            <motion.nav
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-0.5 p-3 flex-1 overflow-y-auto"
            >
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <motion.div key={item.href} variants={itemVariants}>
                    <Link
                      href={item.href}
                      onClick={toggle}
                      className={cn(
                        "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-normal transition-all duration-200 group",
                        isActive
                          ? "text-blue-600 bg-blue-50/80 dark:bg-blue-500/10 dark:text-blue-400"
                          : "text-gray-700 hover:bg-gray-100/60 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
                      )}
                    >
                      {isActive && (
                        <>
                          <motion.div
                            layoutId="mobile-sidebar-indicator"
                            className="absolute right-0 top-0 bottom-0 w-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"
                            transition={{ type: "spring", damping: 25, stiffness: 400 }}
                          />
                          <motion.div
                            layoutId="mobile-sidebar-bg-glow"
                            className="absolute inset-0 rounded-lg"
                            style={{
                              background:
                                "radial-gradient(ellipse at right center, rgba(37,99,235,0.08) 0%, transparent 70%)",
                            }}
                            transition={{ type: "spring", damping: 25, stiffness: 400 }}
                          />
                        </>
                      )}

                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        className="relative z-10"
                      >
                        <Icon
                          className={cn(
                            "w-[18px] h-[18px] flex-shrink-0 transition-colors",
                            isActive
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200"
                          )}
                          strokeWidth={isActive ? 2 : 1.5}
                        />
                      </motion.div>

                      <span className="font-medium text-[13px] relative z-10">
                        {item.label}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.nav>

            <div className="p-3 border-t border-gray-200/60 dark:border-white/10">
              <motion.button
                onClick={logout}
                whileHover={{ scale: 1.01, x: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-[13px] text-red-400 hover:bg-red-500/10 rounded-lg transition-colors group"
              >
                <motion.div
                  whileHover={{ rotate: -15 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <LogOut size={18} />
                </motion.div>
                <span>خروج</span>
              </motion.button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
