// hooks/use-app-theme.ts
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function useAppTheme() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = resolvedTheme || theme;
  const isDark = currentTheme === "dark";
  const isLight = currentTheme === "light";

  const toggleTheme = () => {
    if (!mounted) return;
    setTheme(isDark ? "light" : "dark");
  };

  const setLight = () => setTheme("light");
  const setDark = () => setTheme("dark");
  const setSystem = () => setTheme("system");

  return {
    theme,
    resolvedTheme,
    systemTheme,
    currentTheme,
    isDark,
    isLight,
    mounted,
    toggleTheme,
    setLight,
    setDark,
    setSystem,
  };
}
