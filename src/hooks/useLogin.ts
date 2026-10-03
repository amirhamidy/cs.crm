"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
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

      if (
        typeof data?.access !== "string" ||
        typeof data?.refresh !== "string" ||
        !data?.user
      ) {
        throw new Error("invalid-login-response");
      }

      setAuth({
        access: data.access,
        refresh: data.refresh,
        username: data.user.username,
        userType: data.user.type,
        userId: data.user.id,
      });

      router.replace(
        data.user.type === 1 ? "/admin/dashboard/" : "/user/dashboard/",
      );
    } catch (err) {
      const noResponse = axios.isAxiosError(err) && !err.response;

      setError(
        noResponse
          ? "خطا در برقراری ارتباط با سرور"
          : "نام کاربری یا رمز عبور اشتباه است",
      );
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
