"use client";

import SuspenseWrapper from "@/components/SuspenseWrapper";
import { TableSkeleton } from "@/components/ui/skeletons";
import WarehouseTabPage from "@/components/admin/warehouse/WarehouseTabPage";

export default function WarehouseTabRoute() {
  return (
    <SuspenseWrapper fallback={<TableSkeleton />}>
      <WarehouseTabPage tab="orders" />
    </SuspenseWrapper>
  );
}
