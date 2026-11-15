"use client";

import { Suspense, type ReactNode } from "react";
import { ListSkeleton } from "@/components/ui/skeletons";

interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function SuspenseWrapper({ children, fallback }: SuspenseWrapperProps) {
  return <Suspense fallback={fallback ?? <ListSkeleton />}>{children}</Suspense>;
}
