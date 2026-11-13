"use client";

import { useEffect, useRef, useState } from "react";


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
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!enabled || !visible) return;

    const run = () => cbRef.current();
    run();

    const timer = window.setInterval(run, delayMs);
    return () => window.clearInterval(timer);
  }, [delayMs, enabled, visible]);
}
