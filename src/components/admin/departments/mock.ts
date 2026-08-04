import { Department } from "./types";

export const mockDepartments: Department[] = [
  {
    id: "1",
    name: "تیم امداد میدانی",
    description: "عملیات امداد و نجات در مناطق آسیب‌دیده",
    accent: "#3b82f6",
    stages: [
      { id: "s1", name: "ارزیابی اولیه", color: "#3b82f6", order: 1 },
      { id: "s2", name: "اعزام تیم", color: "#8b5cf6", order: 2 },
      { id: "s3", name: "عملیات", color: "#10b981", order: 3 },
    ],
    employees: [
      { id: "e1", name: "علی رضایی", role: "سرپرست تیم" },
      { id: "e2", name: "مریم احمدی", role: "کارشناس میدانی" },
    ],
    createdAt: "۱۴۰۵/۰۱/۱۵",
  },
  {
    id: "2",
    name: "تیم پشتیبانی لجستیک",
    description: "مدیریت تامین و توزیع منابع و تجهیزات",
    accent: "#8b5cf6",
    stages: [
      { id: "s4", name: "درخواست منابع", color: "#f59e0b", order: 1 },
      { id: "s5", name: "تامین", color: "#8b5cf6", order: 2 },
    ],
    employees: [{ id: "e3", name: "حسین کریمی", role: "مسئول لجستیک" }],
    createdAt: "۱۴۰۵/۰۲/۰۳",
  },
  {
    id: "3",
    name: "تیم ارتباطات",
    description: "هماهنگی و مدیریت اطلاعات بین تیم‌ها",
    accent: "#10b981",
    stages: [{ id: "s6", name: "دریافت گزارش", color: "#10b981", order: 1 }],
    employees: [
      { id: "e4", name: "زهرا موسوی", role: "اپراتور ارتباطات" },
      { id: "e5", name: "رضا نوری", role: "تحلیلگر داده" },
    ],
    createdAt: "۱۴۰۵/۰۲/۲۰",
  },
];
