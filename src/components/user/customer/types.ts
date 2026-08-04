export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  phone: string;
  company: string;
  address: string;
  source: CustomerSource;
  description?: string;
  avatarInitials?: string;
}

export interface CustomerSource {
  id: string;
  label: string;
  color: string;
}

export const MOCK_SOURCES: CustomerSource[] = [
  { id: "1", label: "معرفی", color: "#6366f1" },
  { id: "2", label: "شبکه اجتماعی", color: "#ec4899" },
  { id: "3", label: "تماس مستقیم", color: "#f59e0b" },
  { id: "4", label: "نمایشگاه", color: "#10b981" },
  { id: "5", label: "وبسایت", color: "#3b82f6" },
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "1",
    firstName: "علی",
    lastName: "محمدی",
    jobTitle: "مدیرعامل",
    phone: "09121234567",
    company: "شرکت آلفا",
    address: "تهران، ولیعصر",
    source: MOCK_SOURCES[0],
    description: "مشتری وفادار از سال ۱۴۰۱",
  },
  {
    id: "2",
    firstName: "سارا",
    lastName: "رضایی",
    jobTitle: "مدیر بازاریابی",
    phone: "09359876543",
    company: "گروه بتا",
    address: "مشهد، احمدآباد",
    source: MOCK_SOURCES[1],
    description: "آشنا از طریق اینستاگرام",
  },
  {
    id: "3",
    firstName: "رضا",
    lastName: "کریمی",
    jobTitle: "توسعه‌دهنده ارشد",
    phone: "09101112233",
    company: "استارتاپ گاما",
    address: "اصفهان، چهارباغ",
    source: MOCK_SOURCES[2],
  },
  {
    id: "4",
    firstName: "مریم",
    lastName: "حسینی",
    jobTitle: "طراح UI/UX",
    phone: "09214445566",
    company: "استودیو دلتا",
    address: "شیراز، زند",
    source: MOCK_SOURCES[3],
    description: "آشنا از نمایشگاه تهران",
  },
  {
    id: "5",
    firstName: "امیر",
    lastName: "نوری",
    jobTitle: "مشاور مالی",
    phone: "09367778899",
    company: "موسسه اپسیلون",
    address: "تبریز، ارم",
    source: MOCK_SOURCES[4],
  },
  {
    id: "6",
    firstName: "نیلوفر",
    lastName: "صادقی",
    jobTitle: "مدیر محصول",
    phone: "09190001122",
    company: "فناوری زتا",
    address: "تهران، جردن",
    source: MOCK_SOURCES[0],
    description: "پتانسیل بالا برای قرارداد سالانه",
  },
];
