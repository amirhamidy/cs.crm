import { NextResponse, type NextRequest } from "next/server";

const API_URL = "https://api.radcosys.ir";
const ACCESS_MAX_AGE = 60 * 15;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;
const EXPIRY_THRESHOLD_SECONDS = 30;

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

export async function proxy(request: NextRequest) {
  const access = request.cookies.get("crm-access")?.value;
  const refresh = request.cookies.get("crm-refresh")?.value;

  if (access && !isExpiring(access)) {
    return NextResponse.next();
  }

  if (!refresh) {
    return redirectToLogin(request);
  }

  let refreshData: { access?: unknown; refresh?: unknown };

  try {
    const refreshResponse = await fetch(
      `${API_URL}/accounts/api/v1/auth/refresh/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
        cache: "no-store",
      },
    );

    if (!refreshResponse.ok) {
      if ([400, 401, 403].includes(refreshResponse.status)) {
        return redirectToLogin(request);
      }

      return NextResponse.next();
    }

    refreshData = await refreshResponse.json();
  } catch {
    return NextResponse.next();
  }

  if (typeof refreshData.access !== "string" || !refreshData.access) {
    return redirectToLogin(request);
  }

  const newAccess = refreshData.access;
  const newRefresh =
    typeof refreshData.refresh === "string" && refreshData.refresh
      ? refreshData.refresh
      : null;

  request.cookies.set("crm-access", newAccess);

  if (newRefresh) {
    request.cookies.set("crm-refresh", newRefresh);
  }

  const response = NextResponse.next({ request });

  response.cookies.set("crm-access", newAccess, cookieOptions(ACCESS_MAX_AGE));

  if (newRefresh) {
    response.cookies.set(
      "crm-refresh",
      newRefresh,
      cookieOptions(REFRESH_MAX_AGE),
    );
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/user/:path*"],
};
