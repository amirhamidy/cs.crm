import { redirect } from "next/navigation";

export default function MachineMonthlyRedirect() {
    redirect("/admin/production/machine-summary");
}
