"use client";

import SuspenseWrapper from "@/components/SuspenseWrapper";
import { TableSkeleton } from "@/components/ui/skeletons";
import WarehouseSelector from "@/components/admin/warehouse/WarehouseSelector";

export default function WarehousePage() {
  return (
    <SuspenseWrapper fallback={<TableSkeleton />}>
      <WarehouseSelector />
    </SuspenseWrapper>
  );
}
