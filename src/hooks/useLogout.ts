import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export const useLogout = () => {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const silentLogout = () => {
    clearAuth();
  };

  const logout = () => {
    silentLogout();
    router.replace("/login");
  };

  return { logout, silentLogout };
};
