"use client";
import { create } from "zustand";
import type { PortalProduct } from "@/types/portal";

export interface PortalCartItem { product: PortalProduct; quantity: number; }
interface PortalCartState {
  accountId: number | null; items: PortalCartItem[];
  bindAccount: (id: number | null) => void;
  add: (product: PortalProduct, quantity: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void; clear: () => void;
  total: () => number;
  syncProducts: (fresh: PortalProduct[]) => void;
}
const key = (id: number) => `portal-cart:${id}`;
const round = (n: number) => Math.round(n * 1000) / 1000;
function persist(id: number | null, items: PortalCartItem[]) {
  if (id == null) return;
  try { localStorage.setItem(key(id), JSON.stringify(items)); } catch { /* ignore */ }
}
export const usePortalCartStore = create<PortalCartState>((set, get) => ({
  accountId: null, items: [],
  bindAccount: (id) => {
    if (id == null) { set({ accountId: null, items: [] }); return; }
    let items: PortalCartItem[] = [];
    try { const raw = localStorage.getItem(key(id)); if (raw) items = JSON.parse(raw) as PortalCartItem[]; } catch { items = []; }
    set({ accountId: id, items });
  },
  add: (product, quantity) => {
    const { accountId, items } = get();
    if (quantity <= 0 || quantity > product.available_quantity) return;
    const exists = items.some((item) => item.product.id === product.id);
    if (exists) return;
    const next = [...items, { product, quantity: round(quantity) }];
    persist(accountId, next); set({ items: next });
  },
  setQuantity: (productId, quantity) => {
    const { accountId, items } = get();
    const next = items.map((item) => item.product.id === productId ? { ...item, quantity: round(Math.max(0, Math.min(quantity, item.product.available_quantity))) } : item).filter((item) => item.quantity > 0);
    persist(accountId, next); set({ items: next });
  },
  remove: (productId) => { const { accountId, items } = get(); const next = items.filter((i) => i.product.id !== productId); persist(accountId, next); set({ items: next }); },
  clear: () => { const { accountId } = get(); persist(accountId, []); set({ items: [] }); },
  syncProducts: (fresh) => {
    const { accountId, items } = get();
    const byId = new Map(fresh.map((p) => [p.id, p]));
    // Update price/stock; drop items no longer available; clamp quantity
    const next = items.flatMap((item) => {
      const product = byId.get(item.product.id);
      if (!product) return [item];
      if (product.available_quantity <= 0) return [];
      return [{ product, quantity: Math.min(item.quantity, product.available_quantity) }];
    });
    persist(accountId, next); set({ items: next });
  },
  total: () => get().items.reduce((sum, item) => sum + Number(item.product.sale_price) * item.quantity, 0),
}));
