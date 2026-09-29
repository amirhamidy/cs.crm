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
    const response = await fetch(`${API_URL}/accounts/api/v1/auth/me/`, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const user = await response.json();

    if (
      typeof user?.id !== "number" ||
      typeof user?.username !== "string" ||
      (user?.type !== 1 && user?.type !== 2)
    ) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      type: user.type,
    };
  } catch {
    return null;
  }
});
