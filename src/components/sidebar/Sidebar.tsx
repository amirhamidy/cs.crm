"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/useSidebar";
import { useMenuItems } from "@/hooks/useMenuItems";
import { LogOut } from "lucide-react";
import { useLogout } from "@/hooks/useLogout";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 12, filter: "blur(4px)" },
  visible: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen } = useSidebar();
  const logout = useLogout();
  const menuItems = useMenuItems();

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.aside
          initial={{ x: 280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 280, opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed top-16 right-0 h-[calc(100vh-4rem)] w-64 border-l border-gray-200/60 bg-white/80 backdrop-blur-xl z-40 hidden md:flex flex-col dark:border-white/10 dark:bg-slate-950/80"
        >
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
                          layoutId="sidebar-indicator"
                          className="absolute right-0 top-0 bottom-0 w-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"
                          transition={{ type: "spring", damping: 25, stiffness: 400 }}
                        />
                        <motion.div
                          layoutId="sidebar-bg-glow"
                          className="absolute inset-0 rounded-lg"
                          style={{
                            background: "radial-gradient(ellipse at right center, rgba(37,99,235,0.08) 0%, transparent 70%)",
                          }}
                          transition={{ type: "spring", damping: 25, stiffness: 400 }}
                        />
                      </>
                    )}

                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
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

                    <span className="font-medium text-[13px] relative z-10">{item.label}</span>
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
      )}
    </AnimatePresence>
  );
}
