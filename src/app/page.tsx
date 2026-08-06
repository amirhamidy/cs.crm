import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("crm-access")?.value;
  const userType = cookieStore.get("crm-type")?.value;

  if (accessToken && userType) {
    redirect(userType === "admin" ? "/admin" : "/user");
  }

  redirect("/login");
}
