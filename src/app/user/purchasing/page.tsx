"use client";

import PurchasingAccessGate from "@/components/admin/purchasing/PurchasingAccessGate";
import PurchasingPage from "@/components/admin/purchasing/PurchasingPage";



export default function Page() {
  return (
    <PurchasingAccessGate>
      <PurchasingPage />
    </PurchasingAccessGate>
  );
}