"use client";

import SuspenseWrapper from "@/components/SuspenseWrapper";
import WarehouseTabSkeleton from "@/components/admin/warehouse/WarehouseTabSkeleton";
import WarehouseTabPage from "@/components/admin/warehouse/WarehouseTabPage";

export default function WarehouseTabRoute() {
  return (
    <SuspenseWrapper fallback={<div dir="rtl" className="p-4"><WarehouseTabSkeleton tab="orders" count={8} /></div>}>
      <WarehouseTabPage tab="orders" />
    </SuspenseWrapper>
  );
}
