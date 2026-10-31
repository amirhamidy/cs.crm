export type Step1Form = {
    username: string;
    phone_number: string;
    password: string;
    type: 1 | 2;
};

export type Step2Form = {
    full_name: string;
};

export type Step1Errors = Partial<Record<keyof Step1Form, string>>;
export type Step2Errors = Partial<Record<keyof Step2Form, string>>;

export const PHONE_REGEX = /^09\d{9}$/;

export const INITIAL_STEP1: Step1Form = {
    username: "",
    phone_number: "",
    password: "",
    type: 2,
};

export const INITIAL_STEP2: Step2Form = {
    full_name: "",
};

export function toEnglishDigits(value: string) {
    return value
        .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
        .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

export function normalizePhoneNumber(value: string) {
    const digits = toEnglishDigits(value).replace(/\D/g, "");

    if (digits.startsWith("0098") && digits.length === 14) {
        return `0${digits.slice(4)}`;
    }

    if (digits.startsWith("98") && digits.length === 12) {
        return `0${digits.slice(2)}`;
    }

    if (digits.startsWith("9") && digits.length === 10) {
        return `0${digits}`;
    }

    return digits.slice(0, 11);
}

export function normalizeUsername(value: string) {
    return value.trim().toLowerCase();
}
