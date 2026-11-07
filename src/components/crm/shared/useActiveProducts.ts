"use client";

import { useEffect, useState } from "react";
import { productsApi } from "@/lib/api";
import type { FeedProduct } from "@/types/crm";

/**
 * فهرست کالاهای فعال برای فیلترها.
 * خود productsApi.active نتیجه را کش و هم‌زمان‌ها را یکی می‌کند، پس چند صفحه‌ی مختلف درخواست اضافه نمی‌زنند.
 */
export function useActiveProducts() {
    const [products, setProducts] = useState<FeedProduct[]>([]);

    useEffect(() => {
        let alive = true;
        productsApi
            .active()
            .then((list) => alive && setProducts(list))
            .catch(() => undefined);
        return () => {
            alive = false;
        };
    }, []);

    return products;
}
