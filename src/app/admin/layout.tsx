"use client";

import Sidebar from "@/components/sidebar/Sidebar";
import MobileSidebar from "@/components/sidebar/MobileSidebar";
import Topbar from "@/components/topbar/Topbar";
import { useSidebar } from "@/hooks/useSidebar";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { motion } from "framer-motion";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useAuthGuard(1);
    const { isOpen } = useSidebar();

    return (
        <div className="min-h-screen bg-gray-50/30 dark:bg-black transition-colors duration-300">
            <Topbar />
            <MobileSidebar />
            <Sidebar />

            <motion.main
                animate={{
                    marginRight: isOpen ? 256 : 0,
                }}
                transition={{
                    type: "spring",
                    damping: 30,
                    stiffness: 300,
                }}
                className="pt-16 min-h-screen"
            >
                <div className="p-6 max-w-[1600px] mx-auto">{children}</div>
            </motion.main>
        </div>
    );
}
