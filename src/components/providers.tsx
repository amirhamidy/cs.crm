"use client";

import { LazyMotion } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { NotificationProvider } from "./notifications/NotificationProvider";





const loadMotionFeatures = () =>
  import("@/lib/motionFeatures").then((mod) => mod.default);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <LazyMotion features={loadMotionFeatures} strict={false}>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </LazyMotion>
    </ThemeProvider>
  );
}
