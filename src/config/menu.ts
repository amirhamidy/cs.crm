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
  Boxes,
  ShoppingCart,
  ShieldCheck,
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
    icon: Boxes,
    label: "انبار",
    href: "/admin/warehouse",
  },
  {
    icon: ShoppingCart,
    label: "فرآیند خرید",
    href: "/admin/purchasing",
  },
  {
    icon: ShieldCheck,
    label: "کنترل کیفی",
    href: "/admin/qualityControl",
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
    icon: Boxes,
    label: "انبارداری",
    href: "/user/warehouse",
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
    icon: ShoppingCart,
    label: "فرآیند خرید",
    href: "/user/purchasing",
  },
  {
    icon: ShieldCheck,
    label: "کنترل کیفی",
    href: "/user/qualityControl",
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
    label: "تیکت ارسال شده",
    href: "/user/Ticketsent",
  },
  {
    icon: Ticket,
    label: "تیکت دریافت شده",
    href: "/user/Ticketreceipt",
  },
  {
    icon: CalendarCheck2,
    label: "تقویم",
    href: "/user/calendar",
  },
];
