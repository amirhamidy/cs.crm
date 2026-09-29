import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = "https://api.radcosys.ir";
const ACCESS_MAX_AGE = 60 * 15;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

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

function cleanHeaders(source: Headers) {
  const headers = new Headers(source);

  headers.delete("content-encoding");
  headers.delete("content-length");
  headers.delete("transfer-encoding");

  return headers;
}

function clearCookie(response: NextResponse, name: string) {
  response.cookies.set(name, "", cookieOptions(0));
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
      const response = await fetch(`${API_URL}/accounts/api/v1/auth/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh }),
        cache: "no-store",
      });

      if (!response.ok) return null;

      const data = await response.json();

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

async function proxyRequest(request: Request, path: string[]) {
  const cookieStore = await cookies();

  const access = cookieStore.get("crm-access")?.value;
  const refresh = cookieStore.get("crm-refresh")?.value;

  const requestUrl = new URL(request.url);
  const joinedPath = path.join("/");
  const url = `${API_URL}/${joinedPath}${joinedPath.endsWith("/") ? "" : "/"}${
    requestUrl.search
  }`;

  const headers = new Headers(request.headers);

  headers.delete("host");
  headers.delete("cookie");
  headers.delete("content-length");
  headers.delete("connection");
  headers.delete("origin");
  headers.delete("referer");

  if (access) {
    headers.set("Authorization", `Bearer ${access}`);
  }

  let body: ArrayBuffer | undefined;

  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.arrayBuffer();
  }

  try {
    let response = await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });

    if (response.status !== 401 || !refresh) {
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: cleanHeaders(response.headers),
      });
    }

    const refreshData = await refreshAccessToken(refresh);

    if (!refreshData) {
      const nextResponse = NextResponse.json(
        { detail: "جلسه شما منقضی شده است" },
        { status: 401 },
      );

      clearCookie(nextResponse, "crm-access");
      clearCookie(nextResponse, "crm-refresh");

      return nextResponse;
    }

    headers.set("Authorization", `Bearer ${refreshData.access}`);

    response = await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });

    const nextResponse = new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: cleanHeaders(response.headers),
    });

    nextResponse.cookies.set(
      "crm-access",
      refreshData.access,
      cookieOptions(ACCESS_MAX_AGE),
    );

    if (refreshData.refresh) {
      nextResponse.cookies.set(
        "crm-refresh",
        refreshData.refresh,
        cookieOptions(REFRESH_MAX_AGE),
      );
    }

    return nextResponse;
  } catch {
    return NextResponse.json(
      { detail: "خطا در برقراری ارتباط با سرور" },
      { status: 502 },
    );
  }
}

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function POST(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PUT(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function DELETE(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}
