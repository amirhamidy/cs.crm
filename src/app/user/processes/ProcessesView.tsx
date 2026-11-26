"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import UserTasksKanban from "@/components/user/tasks/UserTasksKanban";

export default function ProcessesView({ id }: { id?: string }) {
  const router = useRouter();
  const n = id ? Number(id) : null;
  const onSelect = useCallback(
    (d: number) => router.replace(`/user/processes/${d}`, { scroll: false }),
    [router],
  );
  return (
    <div className="p-6">
      <UserTasksKanban deptId={n && !isNaN(n) ? n : null} onSelectDept={onSelect} />
    </div>
  );
}
