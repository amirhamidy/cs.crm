/**
 * جدا کردن داده‌ی هر انبار از انبارهای دیگر (سمت کلاینت، مکمل فیلتر سمت بک‌اند).
 *
 * قاعده:
 *  1) اگر خود رکورد فیلد انبار داشته باشد (warehouse / warehouse_id) همان ملاک است.
 *  2) وگرنه محصول رکورد باید در موجودی (stock) همین انبار وجود داشته باشد.
 *  3) رکوردی که نه فیلد انبار دارد نه محصول، «قابل انتساب» نیست
 *     و فقط اگر keepUnattributed=true باشد نمایش داده می‌شود.
 */

type AnyRecord = Record<string, unknown>;

const WAREHOUSE_KEYS = ["warehouse_id", "warehouse"] as const;

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "object") {
    return toNumber((value as AnyRecord).id);
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * undefined  → رکورد اصلاً فیلد انبار ندارد (بک‌اند نفرستاده)
 * null       → فیلد هست ولی خالی است
 * number     → شناسه‌ی انبار رکورد
 */
export function readWarehouseId(record: unknown): number | null | undefined {
  if (!record || typeof record !== "object") return undefined;
  const source = record as AnyRecord;

  for (const key of WAREHOUSE_KEYS) {
    if (key in source) return toNumber(source[key]);
  }

  return undefined;
}

export function readProductId(record: unknown): number | null {
  if (!record || typeof record !== "object") return null;
  const source = record as AnyRecord;

  return toNumber(source.product ?? source.product_id);
}

/** موجودی‌هایی که واقعاً مال این انبارند */
export function scopeStocks<T>(stocks: T[], warehouseId: number): T[] {
  return stocks.filter((stock) => {
    const own = readWarehouseId(stock);
    // بک‌اند فیلد انبار نفرستاده → به فیلتر query اعتماد می‌کنیم
    return own === undefined ? true : own === warehouseId;
  });
}

export function productIdsOf(stocks: Array<{ product: number }>): Set<number> {
  return new Set(stocks.map((stock) => Number(stock.product)));
}

export function belongsToWarehouse(
  record: unknown,
  warehouseId: number,
  productIds: Set<number>,
  keepUnattributed = false,
): boolean {
  const own = readWarehouseId(record);
  if (own !== undefined) return own === warehouseId;

  const productId = readProductId(record);
  if (productId === null) return keepUnattributed;

  return productIds.has(productId);
}

/** خود محصول: فیلد انبار دارد یا در موجودی این انبار هست */
export function productBelongs(
  product: { id: number },
  warehouseId: number,
  productIds: Set<number>,
): boolean {
  const own = readWarehouseId(product);
  if (own !== undefined) return own === warehouseId;
  return productIds.has(Number(product.id));
}
