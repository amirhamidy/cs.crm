import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { cn } from "@/lib/utils";
import AuthHydrator from "@/components/AuthHydrator";
import { getSession } from "@/lib/auth/getSession";

const vazir = localFont({
  src: [
    {
      path: "../../public/fonts/Vazir-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/Vazir-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-vazir",
  display: "swap",
});

export const metadata: Metadata = {
  title: "radco crm",
  description: "radco crm",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSession();

  return (
    <html
      lang="fa"
      dir="rtl"
      suppressHydrationWarning
      className={cn("font-sans", GeistSans.variable, GeistMono.variable)}
    >
      <body className={`${vazir.variable} font-vazir antialiased`}>
        <AuthHydrator user={user}>
          <Providers>{children}</Providers>
        </AuthHydrator>
      </body>
    </html>
  );
}