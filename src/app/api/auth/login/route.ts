import { NextResponse } from "next/server";

const API_URL = "https://api.radcosys.ir";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_URL}/accounts/api/v1/auth/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, {
        status: response.status,
      });
    }

    if (
      typeof data.access !== "string" ||
      typeof data.refresh !== "string" ||
      !data.user
    ) {
      return NextResponse.json(
        { detail: "پاسخ احراز هویت نامعتبر است" },
        { status: 500 },
      );
    }

    const nextResponse = NextResponse.json({
      user: data.user,
    });

    nextResponse.cookies.set({
      name: "crm-access",
      value: data.access,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15,
    });

    nextResponse.cookies.set({
      name: "crm-refresh",
      value: data.refresh,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return nextResponse;
  } catch {
    return NextResponse.json(
      { detail: "خطا در برقراری ارتباط با سرور" },
      { status: 500 },
    );
  }
}
