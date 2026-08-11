import {
  Home,
  Users,
  BarChart3,
  ClipboardList,
  FileText,
  Building2,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

export const adminMenuItems: MenuItem[] = [
  { icon: Home, label: "داشبورد", href: "/admin/dashboard" },
  { icon: Users, label: "کاربران", href: "/admin/users" },
  { icon: Building2, label: "دپارتمان‌ها", href: "/admin/departments" },
  { icon: ClipboardList, label: "وظایف", href: "/admin/tasks" },
  { icon: Users, label: "مشتری", href: "/admin/customer" },
];

export const userMenuItems: MenuItem[] = [
  { icon: Home, label: "داشبورد", href: "/user/dashboard" },
  { icon: ClipboardList, label: "وظایف", href: "/user/processes" },
  { icon: FileText, label: "مشتری", href: "/user/customer" },
];
