import { headers } from "next/headers";
import type { Metadata } from "next";
import PublicSignPage from "@/components/minutes/PublicSignPage";
import { getApiUrl } from "@/lib/config";
import type { PublicSigner } from "@/types/minutes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};

type Props = { params: Promise<{ token: string }> };

async function load(token: string): Promise<{ data: PublicSigner | null; status: number }> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "";
  try {
    const res = await fetch(
      `${getApiUrl()}/minutes/api/v1/signer/public/${encodeURIComponent(token)}/`,
      { cache: "no-store", headers: ip ? { "X-Forwarded-For": ip } : {} }
    );
    if (!res.ok) return { data: null, status: res.status };
    return { data: (await res.json()) as PublicSigner, status: 200 };
  } catch {
    return { data: null, status: 502 };
  }
}

export default async function Page({ params }: Props) {
  const { token } = await params;
  const { data, status } = await load(token);
  return <PublicSignPage token={token} initialData={data} initialStatus={status} />;
}
