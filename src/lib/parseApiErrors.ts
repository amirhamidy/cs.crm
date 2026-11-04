import type { AxiosError } from "axios";

const USERNAME_MESSAGES: Record<string, string> = {
  "A user with that username already exists.":
    "این نام کاربری قبلاً ثبت شده است",
  "Enter a valid username. This value may contain only letters, numbers, and @/./+/-/_ characters.":
    "نام کاربری فقط می‌تواند شامل حروف، اعداد و @/./+/-/_ باشد",
  "This field may not be blank.": "نام کاربری نمی‌تواند خالی باشد",
  "This field is required.": "نام کاربری الزامی است",
  "Ensure this field has no more than 150 characters.":
    "نام کاربری نباید بیشتر از ۱۵۰ کاراکتر باشد",
};

const PHONE_MESSAGES: Record<string, string> = {
  "This field may not be blank.": "شماره موبایل نمی‌تواند خالی باشد",
  "This field is required.": "شماره موبایل الزامی است",
  "Enter a valid phone number.": "شماره موبایل معتبر نیست",
  "The phone number entered is not valid.": "شماره موبایل وارد شده معتبر نیست",
};

const PASSWORD_MESSAGES: Record<string, string> = {
  "This field may not be blank.": "رمز عبور نمی‌تواند خالی باشد",
  "This field is required.": "رمز عبور الزامی است",
  "This password is too short. It must contain at least 8 characters.":
    "رمز عبور باید حداقل ۸ کاراکتر داشته باشد",
  "This password is too common.": "رمز عبور بسیار ساده است",
  "This password is entirely numeric.": "رمز عبور نباید فقط عدد باشد",
};

const FULL_NAME_MESSAGES: Record<string, string> = {
  "This field may not be blank.": "نام کامل نمی‌تواند خالی باشد",
  "This field is required.": "نام کامل الزامی است",
};

const GENERAL_MESSAGES: Record<string, string> = {
  "Unable to log in with provided credentials.":
    "نام کاربری یا رمز عبور اشتباه است",
  "No active account found with the given credentials.":
    "حساب کاربری با این مشخصات یافت نشد",
  "Authentication credentials were not provided.":
    "لطفاً وارد حساب کاربری خود شوید",
  "You do not have permission to perform this action.":
    "دسترسی لازم برای این عملیات را ندارید",
  "Not found.": "مورد درخواستی یافت نشد",
  "A server error occurred.": "خطای سرور — لطفاً دوباره تلاش کنید",
  "This field may not be null.": "این فیلد نمی‌تواند خالی باشد",
  "This field is required.": "این فیلد الزامی است",
};

function translateMessage(raw: string, map: Record<string, string>): string {
  if (map[raw]) return map[raw];
  for (const key of Object.keys(map)) {
    if (raw.toLowerCase().includes(key.toLowerCase())) return map[key];
  }
  return GENERAL_MESSAGES[raw] ?? raw;
}

function extractFirstString(val: unknown): string | null {
  if (typeof val === "string") return val;
  if (Array.isArray(val) && typeof val[0] === "string") return val[0];
  return null;
}

export interface FieldErrors {
  username?: string;
  phone_number?: string;
  password?: string;
  full_name?: string;
  general?: string;
}

export function parseApiErrors(
  err: unknown,
  fallback = "خطا در ثبت اطلاعات",
): FieldErrors {
  const axiosErr = err as AxiosError<Record<string, unknown>>;
  const status = axiosErr.response?.status;
  const data = axiosErr.response?.data;

  if (!data) {
    if (!axiosErr.response)
      return {
        general: "اتصال به سرور برقرار نشد — اینترنت خود را بررسی کنید",
      };
    if (status === 500)
      return { general: "خطای سرور — لطفاً دوباره تلاش کنید" };
    if (status === 401)
      return { general: "نشست شما منقضی شده — لطفاً دوباره وارد شوید" };
    if (status === 403)
      return { general: "دسترسی لازم برای این عملیات را ندارید" };
    if (status === 429)
      return { general: "تعداد درخواست‌ها بیش از حد مجاز است — کمی صبر کنید" };
    return { general: fallback };
  }

  const result: FieldErrors = {};

  const usernameRaw = extractFirstString(data["username"]);
  if (usernameRaw)
    result.username = translateMessage(usernameRaw, USERNAME_MESSAGES);

  const phoneRaw = extractFirstString(data["phone_number"]);
  if (phoneRaw)
    result.phone_number = translateMessage(phoneRaw, PHONE_MESSAGES);

  const passwordRaw = extractFirstString(data["password"]);
  if (passwordRaw)
    result.password = translateMessage(passwordRaw, PASSWORD_MESSAGES);

  const fullNameRaw = extractFirstString(data["full_name"]);
  if (fullNameRaw)
    result.full_name = translateMessage(fullNameRaw, FULL_NAME_MESSAGES);

  const nonFieldRaw =
    extractFirstString(data["non_field_errors"]) ??
    extractFirstString(data["detail"]) ??
    extractFirstString(data["message"]) ??
    extractFirstString(data["error"]);

  if (nonFieldRaw)
    result.general = translateMessage(nonFieldRaw, GENERAL_MESSAGES);

  if (!Object.keys(result).length) return { general: fallback };

  return result;
}

export function flattenApiErrors(
  err: unknown,
  fallback = "خطا در ثبت اطلاعات",
): string {
  const parsed = parseApiErrors(err, fallback);
  return (
    parsed.username ??
    parsed.phone_number ??
    parsed.password ??
    parsed.full_name ??
    parsed.general ??
    fallback
  );
}
