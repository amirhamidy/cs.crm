"use client";

import { useEffect, useState } from "react";
import { productsApi } from "@/lib/api";
import type { FeedProduct } from "@/types/crm";

export function useAllProducts(enabled = true) {
  const [products, setProducts] = useState<FeedProduct[]>([]);

  useEffect(() => {
    if (!enabled) {
      setProducts([]);
      return;
    }
    let active = true;
    productsApi.all().then((items) => {
      if (active) setProducts(items);
    }).catch(() => {
      if (active) setProducts([]);
    });
    return () => { active = false; };
  }, [enabled]);

  return products;
}
