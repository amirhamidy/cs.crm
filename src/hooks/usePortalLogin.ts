"use client";
import { useState } from "react";
import { portalApi } from "@/lib/portal/portalApi";
import { usePortalAuthStore } from "@/store/portalAuthStore";
import { apiMessage } from "@/lib/apiMessage";

export function usePortalLogin() {
  const [loading, setLoading] = useState(false);
  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const result = await portalApi.login({ username, password });
      usePortalAuthStore.getState().setSession(result.access, result.account, result.expires_in);
      return { ok: true as const };
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      const message = status === 429 ? "تعداد تلاش زیاد است، کمی بعد دوباره امتحان کنید" : status === 401 ? "نام کاربری یا رمز عبور اشتباه است." : apiMessage(error, "ارتباط با سرور برقرار نشد");
      return { ok: false as const, message };
    } finally { setLoading(false); }
  };
  return { login, loading };
}
