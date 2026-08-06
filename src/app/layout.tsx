import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { AuthInitializer } from "@/components/AuthInitializer";


const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

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
  title: "ویز  - پنل مدیریت",
  description: "پنل مدیریت حرفه‌ای crm ",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={`${vazir.variable} font-vazir antialiased`}>
        <Providers>
          <AuthInitializer />
          {children}
        </Providers>
      </body>
    </html>
  );
}

