"use client";

import Sidebar from "@/components/sidebar/Sidebar";
import MenuLauncher from "@/components/sidebar/MenuLauncher";
import Topbar from "@/components/topbar/Topbar";
import { useSidebarExpanded } from "@/store/mobileSidebarStore";
import { cn } from "@/lib/utils";

export default function AppShell({
    children,
}: {
    children: React.ReactNode;
}) {
    // در دسکتاپ سایدبار همیشه به شکل ریل باریک (۷۶px) یا باز (۲۵۶px) دیده می‌شود
    const expanded = useSidebarExpanded();

    return (
        <div className="min-h-screen bg-white transition-colors duration-300 dark:bg-black">
            <Topbar />
            <Sidebar />
            <MenuLauncher />

            <main
                className={cn(
                    "min-h-screen pt-16 transition-[margin] duration-300 ease-out",
                    expanded ? "md:mr-64" : "md:mr-[76px]",
                )}
            >
                <div className="mx-auto max-w-[1600px] p-6">{children}</div>
            </main>
        </div>
    );
}
