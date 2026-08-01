import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError("");
    try {
      const { user, token } = await loginService({ username, password });
      setAuth(user, token);
      const destination =
        user.role === "admin" ? "/admin/dashboard" : "/user/dashboard";
      router.push(destination);
    } catch {
      setError("نام کاربری یا رمز عبور اشتباه است");
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}
