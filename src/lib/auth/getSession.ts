// lib/auth/getSession.ts
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";

const API_URL = "https://api.radcosys.ir";

export type SessionUser = {
  id: number;
  username: string;
  type: 1 | 2;
};

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const access = cookieStore.get("crm-access")?.value;

  if (!access) return null;

  try {
    const res = await fetch(`${API_URL}/accounts/api/v1/auth/me/`, {
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    });

    if (!res.ok) return null;

    return (await res.json()) as SessionUser;
  } catch {
    return null;
  }
});
