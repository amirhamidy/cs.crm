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
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || !visible) return;

    callbackRef.current();

    const timer = window.setInterval(() => {
      callbackRef.current();
    }, delayMs);

    return () => window.clearInterval(timer);
  }, [delayMs, enabled, visible]);
}
