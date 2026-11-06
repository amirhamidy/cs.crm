import { Home, Users, ClipboardList, Building2, FolderKanban, CalendarCheck2, Ticket, Archive, MessageSquareText, UserRound, ListTodo, BarChart3, Trophy, ShoppingBag, Sprout } from "lucide-react";

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
    icon: ClipboardList,
    label: "وظایف تکرارشونده",
    href: "/admin/taskroutine",
  },
  {
    icon: MessageSquareText,
    label: "تیکت به کاربران",
    href: "/admin/staffConversation",
  },
  {
    icon: Archive,
    label: "بایگانی تیکت‌ها",
    href: "/admin/Ticketarchive",
  },
  {
    icon: UserRound,
    label: "مشتری",
    href: "/admin/customer",
  },
  {
    icon: Trophy,
    label: "رتبه‌بندی مشتریان",
    href: "/admin/customer-ranking",
  },
  {
    icon: ShoppingBag,
    label: "فروش",
    href: "/admin/sales",
  },
  { icon: Sprout, label: "مشتریان فصلی", href: "/admin/seasonal" },
  {
    icon: Users,
    label: "منابع انسانی",
    href: "/admin/human-resources",
  },
  {
    icon: Users,
    label: "صورت جلسه",
    href: "/admin/minutes/",
  },
  {
    icon: Building2,
    label: "دپارتمان‌ها",
    href: "/admin/departments",
  },
  {
    icon: Users,
    label: "کاربران",
    href: "/admin/users",
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
    icon: FolderKanban,
    label: "پرونده‌ها",
    href: "/user/cases",
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
    icon: ClipboardList,
    label: "ایجاد وظایف",
    href: "/user/tasks",
  },
  {
    icon: ClipboardList,
    label: "وظایف تکرارشونده",
    href: "/user/taskroutine",
  },
  {
    icon: Ticket,
    label: "تیکت ارسال شده",
    href: "/user/Ticketsent",
  },
  {
    icon: Ticket,
    label: "تیکت دریافت شده",
    href: "/user/Ticketreceipt",
  },
  {
    icon: Archive,
    label: "صورت جلسه",
    href: "/user/minutes/",
  },
  {
    icon: UserRound,
    label: "مشتری",
    href: "/user/customer",
  },
  {
    icon: Trophy,
    label: "رتبه‌بندی مشتریان",
    href: "/user/customer-ranking",
  },
  {
    icon: ShoppingBag,
    label: "فروش",
    href: "/user/sales",
  },
  { icon: Sprout, label: "مشتریان فصلی", href: "/user/seasonal" },
  {
    icon: CalendarCheck2,
    label: "تقویم",
    href: "/user/calendar",
  },
];
