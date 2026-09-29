"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";

export const useLogin = () => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await authService.login({
        username,
        password,
      });

      setAuth({
        username: data.user.username,
        userType: data.user.type,
        userId: data.user.id,
      });

      router.replace(
        data.user.type === 1 ? "/admin/dashboard" : "/user/dashboard",
      );
    } catch {
      setError("نام کاربری یا رمز عبور اشتباه است");
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    loading,
    error,
  };
};
