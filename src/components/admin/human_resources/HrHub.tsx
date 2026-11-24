"use client";

import { CalendarOff, Trash2, UserCog, Users, Wallet } from "lucide-react";
import PillTabs from "@/components/ui/PillTabs";

const BASE = "/admin/human-resources";
const TABS = [
    { href: BASE, label: "منابع", icon: <Users size={14} /> },
    { href: `${BASE}/info`, label: "اطلاعات", icon: <UserCog size={14} /> },
    { href: `${BASE}/salaries`, label: "پایه حقوق", icon: <Wallet size={14} /> },
    { href: `${BASE}/leaves`, label: "مرخصی", icon: <CalendarOff size={14} /> },
    { href: `${BASE}/waste`, label: "کسر ضایعات", icon: <Trash2 size={14} /> },
];

export default function HrTabs() {
    return <PillTabs tabs={TABS} exact />;
}
