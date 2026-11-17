import { toPersianDigits } from "@/lib/jalali";

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const DECIMAL_PRECISION = 4;
const DECIMAL_SCALE = 10 ** DECIMAL_PRECISION;

function decimalToUnits(value: number | string): number {
  const raw = String(value).trim();

  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(raw);

  if (!match) {
    const parsed = Number(raw);

    return Number.isFinite(parsed) ? Math.round(parsed * DECIMAL_SCALE) : 0;
  }

  const sign: number = match[1] === "-" ? -1 : 1;
  const whole: number = Number(match[2]);
  const fraction: string = match[3] ?? "";

  const kept: string = fraction
    .padEnd(DECIMAL_PRECISION, "0")
    .slice(0, DECIMAL_PRECISION);

  let units: number = whole * DECIMAL_SCALE + Number(kept || "0");

  if (
    fraction.length > DECIMAL_PRECISION &&
    fraction[DECIMAL_PRECISION] >= "5"
  ) {
    units = units + 1;
  }

  return sign * units;
}

function roundedInteger(value: number | string): number {
  const units: number = decimalToUnits(value);

  return Math.sign(units) * Math.floor(Math.abs(units) / DECIMAL_SCALE + 0.5);
}

export function sumProductionDecimals(
  values: readonly (number | string)[],
): number {
  const total: number = values.reduce<number>(
    (sum, value) => sum + decimalToUnits(value),
    0,
  );

  return total / DECIMAL_SCALE;
}

export function formatProductionInteger(
  value: number | string | null | undefined,
): string {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(Number(value))
  ) {
    return "—";
  }

  return toPersianDigits(integerFormatter.format(roundedInteger(value)));
}

export function formatProductionPercent(
  value: number | string | null | undefined,
): string {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(Number(value))
  ) {
    return "—";
  }

  return toPersianDigits(integerFormatter.format(roundedInteger(value)));
}

export function formatProductionHours(
  value: number | string | null | undefined,
): string {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(Number(value))
  ) {
    return "—";
  }

  const units: number = decimalToUnits(value);

  if (units < 0) return "—";

  const totalMinutes: number = Math.floor(
    (units * 60 + DECIMAL_SCALE / 2) / DECIMAL_SCALE,
  );

  const wholeHours: number = Math.floor(totalMinutes / 60);
  const minutes: number = totalMinutes % 60;

  if (!wholeHours) {
    return `${toPersianDigits(minutes)} دقیقه`;
  }

  if (!minutes) {
    return `${toPersianDigits(wholeHours)} ساعت`;
  }

  return `${toPersianDigits(wholeHours)} ساعت و ${toPersianDigits(
    minutes,
  )} دقیقه`;
}

export function formatProductionLogHours(
  hours: number | string | null | undefined,
  startTime?: string | null,
  endTime?: string | null,
): string {
  if (startTime && endTime) {
    const start: number | null = timeToMinutes(startTime);
    const end: number | null = timeToMinutes(endTime);

    if (start !== null && end !== null) {
      const duration: number = end > start ? end - start : end + 1440 - start;

      return formatProductionHours(duration / 60);
    }
  }

  return formatProductionHours(hours);
}

function timeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(value);

  if (!match) return null;

  const hours: number = Number(match[1]);
  const minutes: number = Number(match[2]);

  return hours <= 23 && minutes <= 59 ? hours * 60 + minutes : null;
}
