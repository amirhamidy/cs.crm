"use client";

import SuspenseWrapper from "@/components/SuspenseWrapper";
import WarehouseSelectorSkeleton from "@/components/admin/warehouse/WarehouseSelectorSkeleton";
import WarehouseSelector from "@/components/admin/warehouse/WarehouseSelector";

export default function WarehousePage() {
  return (
    <SuspenseWrapper fallback={<div dir="rtl" className="p-4"><WarehouseSelectorSkeleton /></div>}>
      <WarehouseSelector />
    </SuspenseWrapper>
  );
}
