export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  jobType: "accountant" | "marketer" | "warehouse" | "specialist";
  joined: string;
  avatarUrl?: string;
}

export interface UsersFiltersState {
  search: string;
  role: "all" | "admin" | "user";
}

export const JOB_TYPE_LABELS: Record<User["jobType"], string> = {
  accountant: "حسابدار",
  marketer: "بازاریاب",
  warehouse: "انبار دار",
  specialist: "کارشناس",
};

export const ROLE_LABELS: Record<User["role"], string> = {
  admin: "ادمین",
  user: "کاربر",
};
