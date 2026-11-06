import { Home, Users, ClipboardList, Building2, FolderKanban, CalendarCheck2, Ticket, Archive, MessageSquareText, UserRound, ListTodo, BarChart3, Trophy, ShoppingBag, Sprout } from "lucide-react";

import { LucideIcon } from "lucide-react";
import type { PermissionAction } from "@/types/access";

export interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
  permission?: { section: string; action: PermissionAction };
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
    permission: { section: "cases", action: "view" },
  },
  {
    icon: ListTodo,
    label: "وظایف",
    href: "/user/processes",
    permission: { section: "tasks", action: "view" },
  },
  {
    icon: Archive,
    label: "بایگانی وظایف",
    href: "/user/archive",
    permission: { section: "tasks", action: "view" },
  },
  {
    icon: ClipboardList,
    label: "ایجاد وظایف",
    href: "/user/tasks",
    permission: { section: "tasks", action: "create" },
  },
  {
    icon: ClipboardList,
    label: "وظایف تکرارشونده",
    href: "/user/taskroutine",
    permission: { section: "task_routines", action: "view" },
  },
  {
    icon: Ticket,
    label: "تیکت ارسال شده",
    href: "/user/Ticketsent",
    permission: { section: "internal_tasks", action: "view" },
  },
  {
    icon: Ticket,
    label: "تیکت دریافت شده",
    href: "/user/Ticketreceipt",
    permission: { section: "internal_tasks", action: "view" },
  },
  {
    icon: Archive,
    label: "صورت جلسه",
    href: "/user/minutes/",
    permission: { section: "minutes", action: "view" },
  },
  {
    icon: UserRound,
    label: "مشتری",
    href: "/user/customer",
    permission: { section: "customers", action: "view" },
  },
  {
    icon: Trophy,
    label: "رتبه‌بندی مشتریان",
    href: "/user/customer-ranking",
    permission: { section: "customer_ranking", action: "view" },
  },
  {
    icon: ShoppingBag,
    label: "فروش",
    href: "/user/sales",
    permission: { section: "sales", action: "view" },
  },
  { icon: Sprout, label: "مشتریان فصلی", href: "/user/seasonal", permission: { section: "seasonal", action: "view" } },
  {
    icon: CalendarCheck2,
    label: "تقویم",
    href: "/user/calendar",
  },
];

const EXTRA_ROUTES: { href: string; permission?: MenuItem["permission"] }[] = [
  { href: "/user/minutes/my-signatures" },
  { href: "/user/Ticketarchive", permission: { section: "internal_tasks", action: "view" } },
];

const trimSlash = (path: string) => path.replace(/\/+$/, "");

export function routePermission(pathname: string): MenuItem["permission"] | undefined {
  const path = trimSlash(pathname);
  const candidates = [...EXTRA_ROUTES, ...userMenuItems]
    .map((item) => ({ href: trimSlash(item.href), permission: item.permission }))
    .filter((item) => path === item.href || path.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length);
  return candidates[0]?.permission;
}
