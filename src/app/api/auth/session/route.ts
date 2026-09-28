import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = "https://api.radcosys.ir";

export async function GET() {
  const cookieStore = await cookies();
  const access = cookieStore.get("crm-access")?.value;
  const refresh = cookieStore.get("crm-refresh")?.value;

  if (!access && !refresh) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  if (access) {
    const response = await fetch(`${API_URL}/accounts/api/v1/auth/me/`, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
      cache: "no-store",
    });

    if (response.ok) {
      const user = await response.json();

      return NextResponse.json({
        authenticated: true,
        user,
      });
    }
  }

  if (!refresh) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
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
    const response = NextResponse.json(
      { authenticated: false },
      { status: 401 },
    );

    response.cookies.set("crm-access", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    response.cookies.set("crm-refresh", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  }

  const refreshData = await refreshResponse.json();

  const meResponse = await fetch(`${API_URL}/accounts/api/v1/auth/me/`, {
    headers: {
      Authorization: `Bearer ${refreshData.access}`,
    },
    cache: "no-store",
  });

  if (!meResponse.ok) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const user = await meResponse.json();

  const response = NextResponse.json({
    authenticated: true,
    user,
  });

  response.cookies.set("crm-access", refreshData.access, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15,
  });

  return response;
}
