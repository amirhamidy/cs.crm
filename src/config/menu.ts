import {
  Home,
  Users,
  ClipboardList,
  Building2,
  FolderKanban,
  ChartColumn,
  CalendarCheck2,
  Ticket,
  Archive,
  MessageSquareText,
  UserRound,
  ListTodo,
  BriefcaseBusiness,
  BarChart3,
} from "lucide-react";

import { LucideIcon } from "lucide-react";

export interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

export const adminMenuItems: MenuItem[] = [
  {
    icon: Home,
    label: "داشبورد",
    href: "/admin/dashboard",
  },
  {
    icon: Users,
    label: "کاربران",
    href: "/admin/users",
  },
  {
    icon: Building2,
    label: "دپارتمان‌ها",
    href: "/admin/departments",
  },
  {
    icon: FolderKanban,
    label: "پرونده‌ها",
    href: "/admin/cases",
  },
  {
    icon: ListTodo,
    label: "وظایف",
    href: "/admin/tasks",
  },
  {
    icon: Archive,
    label: "بایگانی وظایف",
    href: "/admin/archive",
  },
  {
    icon: MessageSquareText,
    label: "گفتگو کاربران",
    href: "/admin/staffConversation",
  },
  {
    icon: UserRound,
    label: "مشتری",
    href: "/admin/customer",
  },
  {
    icon: BarChart3,
    label: "آمار و عملکرد",
    href: "/admin/performance",
  },
  {
    icon: CalendarCheck2,
    label: "تقویم",
    href: "/admin/calendar",
  },
];

export const userMenuItems: MenuItem[] = [
  {
    icon: Home,
    label: "داشبورد",
    href: "/user/dashboard",
  },
  {
    icon: ListTodo,
    label: "وظایف",
    href: "/user/processes",
  },
  {
    icon: Archive,
    label: "بایگانی وظایف",
    href: "/user/archive",
  },
  {
    icon: UserRound,
    label: "مشتری",
    href: "/user/customer",
  },
  {
    icon: FolderKanban,
    label: "پرونده‌ها",
    href: "/user/cases",
  },
  {
    icon: ClipboardList,
    label: "ایجاد وظایف",
    href: "/user/tasks",
  },
  {
    icon: Ticket,
    label: "تیکت به همکار",
    href: "/user/Ticketreceipt",
  },
  {
    icon: CalendarCheck2,
    label: "تقویم",
    href: "/user/calendar",
  },
];
