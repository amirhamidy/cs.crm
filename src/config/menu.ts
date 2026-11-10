import {
  Home,
  Users,
  ClipboardList,
  Building2,
  FolderKanban,
  CalendarCheck2,
  Ticket,
  Archive,
  MessageSquareText,
  UserRound,
  ListTodo,
  BarChart3,
  Trophy,
  ShoppingBag,
  Sprout,
  type LucideIcon,
} from "lucide-react";
import type { PermissionAction } from "@/types/access";

export const MENU_IMAGE_BASE = "/img";

export function menuImageSrc(index: number) {
  return `${MENU_IMAGE_BASE}/${index}.png`;
}

export interface MenuItem {
  icon: LucideIcon;
  image: number;
  label: string;
  description: string;
  href: string;
  permission?: { section: string; action: PermissionAction };
}

export const adminMenuItems: MenuItem[] = [
  {
    icon: Home,
    image: 1,
    label: "داشبورد",
    description: "نمای کلی عملکرد، امتیازها و رویدادهای امروز",
    href: "/admin/dashboard",
  },
  {
    icon: FolderKanban,
    image: 2,
    label: "پرونده‌ها",
    description: "مدیریت پرونده‌های فروش و پیگیری مراحل",
    href: "/admin/cases",
  },
  {
    icon: ListTodo,
    image: 3,
    label: "وظایف",
    description: "همه‌ی وظایف تیم در یک نگاه",
    href: "/admin/tasks",
  },
  {
    icon: Archive,
    image: 4,
    label: "بایگانی وظایف",
    description: "وظایف بسته‌شده و آرشیو شده",
    href: "/admin/archive",
  },
  {
    icon: ClipboardList,
    image: 5,
    label: "وظایف تکرارشونده",
    description: "کارهای دوره‌ای و زمان‌بندی‌شده",
    href: "/admin/taskroutine",
  },
  {
    icon: MessageSquareText,
    image: 6,
    label: "تیکت به کاربران",
    description: "گفتگو و تیکت داخلی با کارکنان",
    href: "/admin/staffConversation",
  },
  {
    icon: Archive,
    image: 7,
    label: "بایگانی تیکت‌ها",
    description: "تیکت‌های بسته‌شده",
    href: "/admin/Ticketarchive",
  },
  {
    icon: UserRound,
    image: 8,
    label: "مشتری",
    description: "بانک اطلاعاتی مشتریان و سرنخ‌ها",
    href: "/admin/customer",
  },
  {
    icon: Trophy,
    image: 9,
    label: "رتبه‌بندی مشتریان",
    description: "دسته‌بندی و اولویت‌بندی مشتریان",
    href: "/admin/customer-ranking",
  },
  {
    icon: ShoppingBag,
    image: 10,
    label: "فروش",
    description: "گزارش فروش، محصولات و بهترین‌ها",
    href: "/admin/sales",
  },
  {
    icon: Sprout,
    image: 11,
    label: "مشتریان فصلی",
    description: "پیگیری مشتریان در فصل‌های مختلف",
    href: "/admin/seasonal",
  },
  {
    icon: Users,
    image: 12,
    label: "منابع انسانی",
    description: "پرونده پرسنلی و مسیر رشد کارکنان",
    href: "/admin/human-resources",
  },
  {
    icon: Users,
    image: 13,
    label: "صورت جلسه",
    description: "ثبت جلسات، مصوبات و امضای صورت‌جلسه",
    href: "/admin/minutes/",
  },
  {
    icon: Building2,
    image: 14,
    label: "دپارتمان‌ها",
    description: "ساختار سازمانی، مراحل و کارکنان",
    href: "/admin/departments",
  },
  {
    icon: Users,
    image: 15,
    label: "کاربران",
    description: "مدیریت کاربران، نقش‌ها و دسترسی‌ها",
    href: "/admin/users",
  },
  {
    icon: BarChart3,
    image: 16,
    label: "آمار و عملکرد",
    description: "تحلیل عملکرد تیم و دپارتمان‌ها",
    href: "/admin/performance",
  },
  {
    icon: CalendarCheck2,
    image: 17,
    label: "تقویم",
    description: "رویدادها، ددلاین‌ها و جلسات",
    href: "/admin/calendar",
  },
];

export const userMenuItems: MenuItem[] = [
  {
    icon: Home,
    image: 1,
    label: "داشبورد",
    description: "امتیاز، عملکرد و رویدادهای امروز شما",
    href: "/user/dashboard",
  },
  {
    icon: FolderKanban,
    image: 2,
    label: "پرونده‌ها",
    description: "پرونده‌های در دسترس شما",
    href: "/user/cases",
    permission: { section: "cases", action: "view" },
  },
  {
    icon: ListTodo,
    image: 3,
    label: "وظایف",
    description: "وظایف جاری و در جریان",
    href: "/user/processes",
    permission: { section: "tasks", action: "view" },
  },
  {
    icon: Archive,
    image: 4,
    label: "بایگانی وظایف",
    description: "وظایف تمام‌شده",
    href: "/user/archive",
    permission: { section: "tasks", action: "view" },
  },
  {
    icon: ClipboardList,
    image: 3,
    label: "ایجاد وظایف",
    description: "ثبت وظیفه جدید برای خود یا همکاران",
    href: "/user/tasks",
    permission: { section: "tasks", action: "create" },
  },
  {
    icon: ClipboardList,
    image: 5,
    label: "وظایف تکرارشونده",
    description: "کارهای دوره‌ای شما",
    href: "/user/taskroutine",
    permission: { section: "task_routines", action: "view" },
  },
  {
    icon: Ticket,
    image: 6,
    label: "تیکت ارسال شده",
    description: "تیکت‌هایی که فرستاده‌اید",
    href: "/user/Ticketsent",
    permission: { section: "internal_tasks", action: "view" },
  },
  {
    icon: Ticket,
    image: 7,
    label: "تیکت دریافت شده",
    description: "تیکت‌های دریافتی شما",
    href: "/user/Ticketreceipt",
    permission: { section: "internal_tasks", action: "view" },
  },
  {
    icon: Archive,
    image: 13,
    label: "صورت جلسه",
    description: "جلسات و امضاهای شما",
    href: "/user/minutes/",
    permission: { section: "minutes", action: "view" },
  },
  {
    icon: UserRound,
    image: 8,
    label: "مشتری",
    description: "مشتریان و سرنخ‌های شما",
    href: "/user/customer",
    permission: { section: "customers", action: "view" },
  },
  {
    icon: Trophy,
    image: 9,
    label: "رتبه‌بندی مشتریان",
    description: "اولویت‌بندی مشتریان",
    href: "/user/customer-ranking",
    permission: { section: "customer_ranking", action: "view" },
  },
  {
    icon: ShoppingBag,
    image: 10,
    label: "فروش",
    description: "عملکرد فروش شما",
    href: "/user/sales",
    permission: { section: "sales", action: "view" },
  },
  {
    icon: Sprout,
    image: 11,
    label: "مشتریان فصلی",
    description: "پیگیری فصلی مشتریان",
    href: "/user/seasonal",
    permission: { section: "seasonal", action: "view" },
  },
  {
    icon: CalendarCheck2,
    image: 17,
    label: "تقویم",
    description: "رویدادها و ددلاین‌های شما",
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
