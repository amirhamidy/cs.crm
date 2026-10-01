import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";

export default async function Home() {
  const user = await getSession();

  if (!user) redirect("/login");

  redirect(user.type === 1 ? "/admin/dashboard" : "/user/dashboard");
}