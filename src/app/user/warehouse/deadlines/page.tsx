"use client";

import SuspenseWrapper from "@/components/SuspenseWrapper";
import WarehouseTabPage from "@/components/admin/warehouse/WarehouseTabPage";

export default function WarehouseTabRoute() {
  return (
    <SuspenseWrapper>
      <WarehouseTabPage tab="deadlines" />
    </SuspenseWrapper>
  );
}
