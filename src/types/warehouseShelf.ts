export type WithShelf<T> = T & { shelf_code?: string | null };

export type ShelfSummary = {
  shelf_code: string;
  product_count: number;
};

export type PicklistProduct = {
  id: number;
  name: string;
  shelf_code: string;
  sale_price: string;
  category: number | null;
  name_category?: string | null;
  category_name?: string | null;
  unit_type: string;
  unit_label: string | null;
  current_stock: number | null;
  in_order: boolean;
  ordered_quantity: number | null;
};

export type PicklistParams = {
  warehouseId?: number | null;
  orderTaskId?: number | null;
  shelfCode?: string;
  category?: number | null;
  search?: string;
  inStock?: boolean;
  page?: number;
};

export type PicklistPage = {
  items: PicklistProduct[];
  count: number;
};

export type AddItemInput = {
  product_id: number;
  quantity: number;
};

export type OrderItemWithShelf = {
  id: number;
  product: number;
  name_product?: string;
  shelf_code?: string | null;
  quantity: number | string;
  completed_quantity?: number | string | null;
  status?: string;
  display_status?: string;
};
