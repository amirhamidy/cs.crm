import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import AppShell from "@/components/shell/AppShell";

export default async function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getSession();

    if (!user) redirect("/login");
    if (user.type !== 2) redirect("/admin/dashboard");

    return <AppShell>{children}</AppShell>;
}