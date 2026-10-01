import { NextResponse, type NextRequest } from "next/server";

const API_URL = "https://api.radcosys.ir";
const ACCESS_MAX_AGE = 60 * 15;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;
const EXPIRY_THRESHOLD_SECONDS = 30;

type RefreshResult = {
  access: string;
  refresh: string | null;
};

const refreshPromises = new Map<string, Promise<RefreshResult | null>>();

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function isExpiring(token: string) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );

    if (typeof decoded.exp !== "number") return false;

    return decoded.exp - Date.now() / 1000 < EXPIRY_THRESHOLD_SECONDS;
  } catch {
    return true;
  }
}

function redirectToLogin(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));

  response.cookies.set("crm-access", "", cookieOptions(0));
  response.cookies.set("crm-refresh", "", cookieOptions(0));

  return response;
}

async function refreshAccessToken(
  refresh: string,
): Promise<RefreshResult | null> {
  const existingPromise = refreshPromises.get(refresh);

  if (existingPromise) {
    return existingPromise;
  }

  const promise = (async () => {
    try {
      const refreshResponse = await fetch(
        `${API_URL}/accounts/api/v1/auth/refresh/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh }),
          cache: "no-store",
        },
      );

      if (!refreshResponse.ok) {
        return null;
      }

      const data = await refreshResponse.json();

      if (typeof data.access !== "string" || !data.access) {
        return null;
      }

      return {
        access: data.access,
        refresh:
          typeof data.refresh === "string" && data.refresh
            ? data.refresh
            : null,
      };
    } catch {
      return null;
    } finally {
      refreshPromises.delete(refresh);
    }
  })();

  refreshPromises.set(refresh, promise);

  return promise;
}

export async function proxy(request: NextRequest) {
  const access = request.cookies.get("crm-access")?.value;
  const refresh = request.cookies.get("crm-refresh")?.value;

  if (access && !isExpiring(access)) {
    return NextResponse.next();
  }

  if (!refresh) {
    return redirectToLogin(request);
  }

  const refreshData = await refreshAccessToken(refresh);

  if (!refreshData) {
    return redirectToLogin(request);
  }

  request.cookies.set("crm-access", refreshData.access);

  if (refreshData.refresh) {
    request.cookies.set("crm-refresh", refreshData.refresh);
  }

  const response = NextResponse.next({ request });

  response.cookies.set(
    "crm-access",
    refreshData.access,
    cookieOptions(ACCESS_MAX_AGE),
  );

  if (refreshData.refresh) {
    response.cookies.set(
      "crm-refresh",
      refreshData.refresh,
      cookieOptions(REFRESH_MAX_AGE),
    );
  }

  return response;
}

export const config = {
  matcher: ["/", "/admin/:path*", "/user/:path*"],
};
