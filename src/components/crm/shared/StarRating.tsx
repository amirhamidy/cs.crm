import { Star } from "lucide-react";
import { formatScore } from "@/lib/crm/format";

interface Props {
    /** میانگین امتیاز بین ۰ تا ۵؛ null یعنی بدون امتیاز */
    value: number | null;
    size?: number;
    showNumber?: boolean;
    count?: number;
}

/** نمایش ستاره‌ای امتیاز (با پشتیبانی از اعشار) */
export default function StarRating({ value, size = 14, showNumber = true, count }: Props) {
    if (value == null) {
        return <span className="text-[13px] font-semibold text-gray-400">بدون امتیاز</span>;
    }

    return (
        <span
            className="inline-flex items-center gap-1.5"
            aria-label={`امتیاز ${formatScore(value)} از ۵`}
        >
            <span className="inline-flex items-center" dir="ltr">
                {[1, 2, 3, 4, 5].map((i) => {
                    const fill = Math.max(0, Math.min(1, value - (i - 1)));
                    return (
                        <span
                            key={i}
                            className="relative inline-block"
                            style={{ width: size, height: size }}
                        >
                            <Star
                                size={size}
                                className="absolute inset-0 text-gray-300 dark:text-white/20"
                                strokeWidth={1.6}
                            />
                            <span
                                className="absolute inset-0 overflow-hidden"
                                style={{ width: `${fill * 100}%` }}
                            >
                                <Star
                                    size={size}
                                    className="text-amber-400"
                                    fill="currentColor"
                                    strokeWidth={1.6}
                                />
                            </span>
                        </span>
                    );
                })}
            </span>
            {showNumber && (
                <span className="text-[13px] font-extrabold text-gray-800 dark:text-gray-100">
                    {formatScore(value)}
                </span>
            )}
            {count != null && (
                <span className="text-[13px] font-semibold text-gray-400">
                    ({count.toLocaleString("fa-IR")})
                </span>
            )}
        </span>
    );
}
