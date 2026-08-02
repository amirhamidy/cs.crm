export type Period = "weekly" | "monthly" | "yearly";

export type ChartDataPoint = {
  name: string;
  actual: number;
  target: number;
};

export const salesTargetData: Record<Period, ChartDataPoint[]> = {
  weekly: [
    { name: "شن", actual: 42, target: 50 },
    { name: "یک", actual: 58, target: 50 },
    { name: "دو", actual: 45, target: 55 },
    { name: "سه", actual: 70, target: 60 },
    { name: "چه", actual: 55, target: 65 },
    { name: "پن", actual: 80, target: 70 },
    { name: "جم", actual: 68, target: 75 },
  ],
  monthly: [
    { name: "فرو", actual: 320, target: 350 },
    { name: "ارد", actual: 410, target: 380 },
    { name: "خرد", actual: 380, target: 400 },
    { name: "تیر", actual: 520, target: 450 },
    { name: "مرد", actual: 490, target: 500 },
    { name: "شهر", actual: 610, target: 550 },
    { name: "مهر", actual: 570, target: 600 },
    { name: "آبا", actual: 680, target: 620 },
    { name: "آذر", actual: 720, target: 700 },
    { name: "دی", actual: 650, target: 750 },
    { name: "بهم", actual: 800, target: 780 },
    { name: "اسف", actual: 760, target: 820 },
  ],
  yearly: [
    { name: "۱۴۰۱", actual: 3200, target: 3500 },
    { name: "۱۴۰۲", actual: 4100, target: 4000 },
    { name: "۱۴۰۳", actual: 5200, target: 4800 },
    { name: "۱۴۰۴", actual: 6100, target: 6500 },
    { name: "۱۴۰۵", actual: 4800, target: 7000 },
  ],
};

export const periodLabels: Record<Period, string> = {
  weekly: "هفتگی",
  monthly: "ماهانه",
  yearly: "سالانه",
};
