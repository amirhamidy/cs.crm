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

/**
 * آیکون‌های سه‌بعدی منو در پوشه‌ی public قرار می‌گیرند.
 * برای عوض کردن هر آیکون کافی است فایل png/svg خودت را با همان نام
 * در `public/icons/menu/` جایگزین کنی — هیچ تغییری در کد لازم نیست.
 *
 * نمونه: public/icons/menu/dashboard.png
 */
export const MENU_ICON_BASE = "/icons/menu";

/** آدرس کامل آیکون یک منو بر اساس slug آن */
export function menuIconSrc(slug: string) {
  return `${MENU_ICON_BASE}/${slug}.png`;
}

export interface MenuItem {
  /** آیکون خطی (فقط برای fallback و حالت‌های بدون تصویر) */
  icon: LucideIcon;
  /** نام فایل آیکون سه‌بعدی داخل public/icons/menu (بدون پسوند) */
  iconSlug: string;
  label: string;
  /** توضیح کوتاه — در مودال بزرگ زیر نام نمایش داده می‌شود */
  description: string;
  /** گروه‌بندی در مودال بزرگ */
  group: string;
  href: string;
  permission?: { section: string; action: PermissionAction };
}

export const adminMenuItems: MenuItem[] = [
  {
    icon: Home,
    iconSlug: "dashboard",
    label: "داشبورد",
    description: "نمای کلی عملکرد، امتیازها و رویدادهای امروز",
    group: "عمومی",
    href: "/admin/dashboard",
  },
  {
    icon: FolderKanban,
    iconSlug: "cases",
    label: "پرونده‌ها",
    description: "مدیریت پرونده‌های فروش و پیگیری مراحل",
    group: "فروش",
    href: "/admin/cases",
  },
  {
    icon: ListTodo,
    iconSlug: "tasks",
    label: "وظایف",
    description: "همه‌ی وظایف تیم در یک نگاه",
    group: "کار",
    href: "/admin/tasks",
  },
  {
    icon: Archive,
    iconSlug: "archive",
    label: "بایگانی وظایف",
    description: "وظایف بسته‌شده و آرشیو شده",
    group: "کار",
    href: "/admin/archive",
  },
  {
    icon: ClipboardList,
    iconSlug: "taskroutine",
    label: "وظایف تکرارشونده",
    description: "کارهای دوره‌ای و زمان‌بندی‌شده",
    group: "کار",
    href: "/admin/taskroutine",
  },
  {
    icon: MessageSquareText,
    iconSlug: "staffconversation",
    label: "تیکت به کاربران",
    description: "گفتگو و تیکت داخلی با کارکنان",
    group: "ارتباطات",
    href: "/admin/staffConversation",
  },
  {
    icon: Archive,
    iconSlug: "ticketarchive",
    label: "بایگانی تیکت‌ها",
    description: "تیکت‌های بسته‌شده",
    group: "ارتباطات",
    href: "/admin/Ticketarchive",
  },
  {
    icon: UserRound,
    iconSlug: "customer",
    label: "مشتری",
    description: "بانک اطلاعاتی مشتریان و سرنخ‌ها",
    group: "فروش",
    href: "/admin/customer",
  },
  {
    icon: Trophy,
    iconSlug: "customer-ranking",
    label: "رتبه‌بندی مشتریان",
    description: "دسته‌بندی و اولویت‌بندی مشتریان",
    group: "فروش",
    href: "/admin/customer-ranking",
  },
  {
    icon: ShoppingBag,
    iconSlug: "sales",
    label: "فروش",
    description: "گزارش فروش، محصولات و بهترین‌ها",
    group: "فروش",
    href: "/admin/sales",
  },
  {
    icon: Sprout,
    iconSlug: "seasonal",
    label: "مشتریان فصلی",
    description: "پیگیری مشتریان در فصل‌های مختلف",
    group: "فروش",
    href: "/admin/seasonal",
  },
  {
    icon: Users,
    iconSlug: "human-resources",
    label: "منابع انسانی",
    description: "پرونده پرسنلی و مسیر رشد کارکنان",
    group: "سازمان",
    href: "/admin/human-resources",
  },
  {
    icon: Users,
    iconSlug: "minutes",
    label: "صورت جلسه",
    description: "ثبت جلسات، مصوبات و امضای صورت‌جلسه",
    group: "ارتباطات",
    href: "/admin/minutes/",
  },
  {
    icon: Building2,
    iconSlug: "departments",
    label: "دپارتمان‌ها",
    description: "ساختار سازمانی، مراحل و کارکنان",
    group: "سازمان",
    href: "/admin/departments",
  },
  {
    icon: Users,
    iconSlug: "users",
    label: "کاربران",
    description: "مدیریت کاربران، نقش‌ها و دسترسی‌ها",
    group: "سازمان",
    href: "/admin/users",
  },
  {
    icon: BarChart3,
    iconSlug: "performance",
    label: "آمار و عملکرد",
    description: "تحلیل عملکرد تیم و دپارتمان‌ها",
    group: "تحلیل",
    href: "/admin/performance",
  },
  {
    icon: CalendarCheck2,
    iconSlug: "calendar",
    label: "تقویم",
    description: "رویدادها، ددلاین‌ها و جلسات",
    group: "عمومی",
    href: "/admin/calendar",
  },
];

export const userMenuItems: MenuItem[] = [
  {
    icon: Home,
    iconSlug: "dashboard",
    label: "داشبورد",
    description: "امتیاز، عملکرد و رویدادهای امروز شما",
    group: "عمومی",
    href: "/user/dashboard",
  },
  {
    icon: FolderKanban,
    iconSlug: "cases",
    label: "پرونده‌ها",
    description: "پرونده‌های در دسترس شما",
    group: "فروش",
    href: "/user/cases",
    permission: { section: "cases", action: "view" },
  },
  {
    icon: ListTodo,
    iconSlug: "processes",
    label: "وظایف",
    description: "وظایف جاری و در جریان",
    group: "کار",
    href: "/user/processes",
    permission: { section: "tasks", action: "view" },
  },
  {
    icon: Archive,
    iconSlug: "archive",
    label: "بایگانی وظایف",
    description: "وظایف تمام‌شده",
    group: "کار",
    href: "/user/archive",
    permission: { section: "tasks", action: "view" },
  },
  {
    icon: ClipboardList,
    iconSlug: "tasks",
    label: "ایجاد وظایف",
    description: "ثبت وظیفه جدید برای خود یا همکاران",
    group: "کار",
    href: "/user/tasks",
    permission: { section: "tasks", action: "create" },
  },
  {
    icon: ClipboardList,
    iconSlug: "taskroutine",
    label: "وظایف تکرارشونده",
    description: "کارهای دوره‌ای شما",
    group: "کار",
    href: "/user/taskroutine",
    permission: { section: "task_routines", action: "view" },
  },
  {
    icon: Ticket,
    iconSlug: "ticketsent",
    label: "تیکت ارسال شده",
    description: "تیکت‌هایی که فرستاده‌اید",
    group: "ارتباطات",
    href: "/user/Ticketsent",
    permission: { section: "internal_tasks", action: "view" },
  },
  {
    icon: Ticket,
    iconSlug: "ticketreceipt",
    label: "تیکت دریافت شده",
    description: "تیکت‌های دریافتی شما",
    group: "ارتباطات",
    href: "/user/Ticketreceipt",
    permission: { section: "internal_tasks", action: "view" },
  },
  {
    icon: Archive,
    iconSlug: "minutes",
    label: "صورت جلسه",
    description: "جلسات و امضاهای شما",
    group: "ارتباطات",
    href: "/user/minutes/",
    permission: { section: "minutes", action: "view" },
  },
  {
    icon: UserRound,
    iconSlug: "customer",
    label: "مشتری",
    description: "مشتریان و سرنخ‌های شما",
    group: "فروش",
    href: "/user/customer",
    permission: { section: "customers", action: "view" },
  },
  {
    icon: Trophy,
    iconSlug: "customer-ranking",
    label: "رتبه‌بندی مشتریان",
    description: "اولویت‌بندی مشتریان",
    group: "فروش",
    href: "/user/customer-ranking",
    permission: { section: "customer_ranking", action: "view" },
  },
  {
    icon: ShoppingBag,
    iconSlug: "sales",
    label: "فروش",
    description: "عملکرد فروش شما",
    group: "فروش",
    href: "/user/sales",
    permission: { section: "sales", action: "view" },
  },
  {
    icon: Sprout,
    iconSlug: "seasonal",
    label: "مشتریان فصلی",
    description: "پیگیری فصلی مشتریان",
    group: "فروش",
    href: "/user/seasonal",
    permission: { section: "seasonal", action: "view" },
  },
  {
    icon: CalendarCheck2,
    iconSlug: "calendar",
    label: "تقویم",
    description: "رویدادها و ددلاین‌های شما",
    group: "عمومی",
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
