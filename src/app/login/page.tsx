import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import LoginClient from "./LoginClient";

export default async function LoginPage() {
    const user = await getSession();

    if (user) {
        redirect(
            user.type === 1
                ? "/admin/dashboard"
                : "/user/dashboard",
        );
    }

    return <LoginClient />;
}