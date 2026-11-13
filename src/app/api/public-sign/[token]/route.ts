import { NextRequest, NextResponse } from "next/server";
import { getApiUrl } from "@/lib/config";

export const dynamic = "force-dynamic";

const HEADERS = {
  "Cache-Control": "no-store, private",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "no-referrer",
};

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "";
}

async function forward(req: NextRequest, token: string, sign: boolean) {
  const url = `${getApiUrl()}/minutes/api/v1/signer/public/${encodeURIComponent(token)}/${sign ? "sign/" : ""}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const ip = clientIp(req);
  if (ip) headers["X-Forwarded-For"] = ip;
  try {
    const res = await fetch(url, {
      method: sign ? "POST" : "GET",
      headers,
      body: sign ? await req.text() : undefined,
      cache: "no-store",
    });
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: { ...HEADERS, "Content-Type": res.headers.get("content-type") || "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "ارتباط با سرور برقرار نشد" }, { status: 502, headers: HEADERS });
  }
}

type Ctx = { params: Promise<{ token: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).token, false);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).token, true);
}
