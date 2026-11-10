"use client";

import Sidebar from "@/components/sidebar/Sidebar";
import MenuLauncher from "@/components/sidebar/MenuLauncher";
import Topbar from "@/components/topbar/Topbar";

export default function AppShell({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white transition-colors duration-300 dark:bg-black">
            <Topbar />
            <Sidebar />
            <MenuLauncher />

            <main className="min-h-screen pt-16 mr-16 md:mr-[76px]">
                <div className="mx-auto max-w-[1600px] p-6">{children}</div>
            </main>
        </div>
    );
}
