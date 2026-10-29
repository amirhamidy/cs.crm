import type { Metadata } from "next";
import Script from "next/script";
import { preload } from "react-dom";
import "./globals.css";
import { Providers } from "@/components/providers";
import AuthInitializer from "@/components/AuthInitializer";

export const metadata: Metadata = {
  title: "radco crm",
  description: "radco crm",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  
  preload("/fonts/Vazir-Medium.woff2", {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });

  return (
    <html
      lang="fa"
      dir="rtl"
      suppressHydrationWarning
      className="font-sans"
    >
      <body className="antialiased">
        <Script src="/config.js" strategy="beforeInteractive" />
        <Providers>
          <AuthInitializer />
          {children}
        </Providers>
      </body>
    </html>
  );
}