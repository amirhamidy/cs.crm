"use client";

import { Suspense } from "react";

interface SuspenseWrapperProps {
  children: React.ReactNode;
}

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center gap-3 py-24">
    <div className="h-5 w-5 rounded-full border-2 border-indigo-500/15 border-t-indigo-500 animate-spin" />
  </div>
);

export default function SuspenseWrapper({ children }: SuspenseWrapperProps) {
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>;
}