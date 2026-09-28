import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = "https://api.radcosys.ir";

function cleanHeaders(source: Headers) {
  const h = new Headers(source);

  h.delete("content-encoding");
  h.delete("content-length");
  h.delete("transfer-encoding");

  return h;
}

function clearCookie(response: NextResponse, name: string) {
  response.cookies.set(name, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

async function proxyRequest(request: Request, path: string[]) {
  const cookieStore = await cookies();

  const access = cookieStore.get("crm-access")?.value;
  const refresh = cookieStore.get("crm-refresh")?.value;

  const search = new URL(request.url).search;
  const joinedPath = path.join("/");
  const url = `${API_URL}/${joinedPath}${
    joinedPath.endsWith("/") ? "" : "/"
  }${search}`;

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
      const nextResponse = NextResponse.json(
        { detail: "جلسه شما منقضی شده است" },
        { status: 401 },
      );

      clearCookie(nextResponse, "crm-access");
      clearCookie(nextResponse, "crm-refresh");

      return nextResponse;
    }

    const refreshData = await refreshResponse.json();

    if (typeof refreshData.access !== "string" || !refreshData.access) {
      const nextResponse = NextResponse.json(
        { detail: "توکن جدید دریافت نشد" },
        { status: 401 },
      );

      clearCookie(nextResponse, "crm-access");

      return nextResponse;
    }

    const newAccess: string = refreshData.access;

    headers.set("Authorization", `Bearer ${newAccess}`);

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

    nextResponse.cookies.set("crm-access", newAccess, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15,
    });

    return nextResponse;
  } catch {
    return NextResponse.json(
      { detail: "خطا در برقراری ارتباط با سرور" },
      { status: 502 },
    );
  }
}

type RouteContext = { params: Promise<{ path: string[] }> };

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
