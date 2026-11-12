"use client";

import SuspenseWrapper from "@/components/SuspenseWrapper";
import WarehouseSelector from "@/components/admin/warehouse/WarehouseSelector";

export default function WarehousePage() {
  return (
    <SuspenseWrapper>
      <WarehouseSelector />
    </SuspenseWrapper>
  );
}
