"use client";

import { ThemeProvider } from "next-themes";
import { NotificationProvider } from "./notifications/NotificationProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </ThemeProvider>
  );
}