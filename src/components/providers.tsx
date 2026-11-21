"use client";

import { useState } from "react";
import { LazyMotion } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationProvider } from "./notifications/NotificationProvider";

const loadMotionFeatures = () =>
  import("@/lib/motionFeatures").then((mod) => mod.default);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <LazyMotion features={loadMotionFeatures} strict={false}>
          <NotificationProvider>{children}</NotificationProvider>
        </LazyMotion>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
