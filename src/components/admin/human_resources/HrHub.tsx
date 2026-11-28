"use client";

import { BarChart3, CalendarOff, FileText, UserCog, Wallet } from "lucide-react";
import PillTabs from "@/components/ui/PillTabs";

const BASE = "/admin/human-resources";

// Single, flat navigation for HR. Every section is one top-level tab (no nested sub-tabs).
const TABS = [
    { href: BASE, label: "منابع انسانی", icon: <FileText size={14} /> },
    { href: `${BASE}/info`, label: "اطلاعات", icon: <UserCog size={14} /> },
    { href: `${BASE}/salaries`, label: "پایه حقوق", icon: <Wallet size={14} /> },
    { href: `${BASE}/leaves`, label: "مرخصی", icon: <CalendarOff size={14} /> },
    { href: `${BASE}/performance`, label: "کارکرد کارمند", icon: <BarChart3 size={14} /> },
];

export default function HrTabs() {
    return <PillTabs tabs={TABS} exact />;
}
