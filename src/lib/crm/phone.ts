export function normalizePhoneNumber(value: string): string {
    const digits = value
        .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
        .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
        .replace(/[\s\-()]/g, "")
        .replace(/\D/g, "");

    if (digits.startsWith("0098")) return `0${digits.slice(4)}`;
    if (digits.startsWith("98")) return `0${digits.slice(2)}`;
    if (digits.startsWith("9") && digits.length === 10) return `0${digits}`;

    return digits;
}

export function isValidCustomerPhone(value: string): boolean {
    return /^\d{10,15}$/.test(value);
}
