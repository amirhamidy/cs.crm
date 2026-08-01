import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useAuthStore } from "@/store/authStore";

export function useLogout() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return () => {
    clearAuth();
    Cookies.remove("crm-token");
    Cookies.remove("crm-role");
    router.push("/login");
  };
}
