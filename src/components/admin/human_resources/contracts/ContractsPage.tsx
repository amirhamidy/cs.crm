"use client";

import ContractsPanel from "./ContractsPanel";

export default function ContractsPage({ canManage = false }: { canManage?: boolean }) {
  return <ContractsPanel canManage={canManage} />;
}
