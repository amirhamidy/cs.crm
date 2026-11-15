"use client";

import SuspenseWrapper from "@/components/SuspenseWrapper";
import WarehouseSelector from "@/components/admin/warehouse/WarehouseSelector";
import WarehouseSelectorSkeleton from "@/components/admin/warehouse/WarehouseSelectorSkeleton";

export default function WarehousePage() {
  return (
    <SuspenseWrapper fallback={<div dir="rtl" className="p-4"><WarehouseSelectorSkeleton /></div>}>
      <WarehouseSelector />
    </SuspenseWrapper>
  );
}
