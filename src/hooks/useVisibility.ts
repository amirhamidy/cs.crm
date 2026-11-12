"use client";

import { useEffect, useState } from "react";


export function useIsVisible(): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof document === "undefined") return;

    setVisible(!document.hidden);

    const handleVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  return visible;
}


export function useVisibleInterval(
  callback: () => void,
  delayMs: number,
  enabled = true,
): void {
  const visible = useIsVisible();

  useEffect(() => {
    if (!enabled || !visible) return;

    
    callback();

    const timer = window.setInterval(callback, delayMs);
    return () => window.clearInterval(timer);
  }, [callback, delayMs, enabled, visible]);
}
