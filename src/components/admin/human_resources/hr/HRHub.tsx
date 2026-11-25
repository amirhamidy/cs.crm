"use client";

import HumanResourcesPage from "../HumanResourcesPage";

// Navigation lives in the HR layout tab bar (HrHub). This component only renders page content.
export default function HRHub({ canManage = false }: { canManage?: boolean }) {
  return <HumanResourcesPage canManage={canManage} />;
}
