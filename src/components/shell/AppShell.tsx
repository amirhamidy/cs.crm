"use client";

import Sidebar from "@/components/sidebar/Sidebar";
import Topbar from "@/components/topbar/Topbar";
import { useSidebarIsOpen } from "@/store/mobileSidebarStore";
import { cn } from "@/lib/utils";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const isOpen = useSidebarIsOpen();

    return (
        <div className="min-h-screen bg-gray-50/30 transition-colors duration-300 dark:bg-black">
            <Topbar />
            <Sidebar />

            <main
                className={cn(
                    "min-h-screen pt-16 transition-[margin] duration-300 ease-out",
                    isOpen ? "md:mr-64" : "md:mr-0",
                )}
            >
                <div className="mx-auto max-w-[1600px] p-6">{children}</div>
            </main>
        </div>
    );
}