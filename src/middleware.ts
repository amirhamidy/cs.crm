import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_ROLES = ["admin"];
const USER_ROLES = ["employer", "employee"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("crm-auth")?.value;
  const role = request.cookies.get("crm-role")?.value;

  const isAuthenticated = !!token && !!role;

  if (pathname === "/login") {
    if (!isAuthenticated) return NextResponse.next();
    return NextResponse.redirect(new URL(getDashboard(role!), request.url));
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin") && !ADMIN_ROLES.includes(role!)) {
    return NextResponse.redirect(new URL("/user/dashboard", request.url));
  }

  if (pathname.startsWith("/user") && !USER_ROLES.includes(role!)) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

function getDashboard(role: string): string {
  if (role === "admin") return "/admin/dashboard";
  return "/user/dashboard";
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/user/:path*", "/dashboard/:path*"],
};
