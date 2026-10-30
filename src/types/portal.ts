import type { Paginated } from "@/types/pagination";
import type { UnitType, ApiUnitDetail } from "@/types/warehouse";

export interface PortalAccount {
  id: number; username: string; customer_id: number; full_name: string;
  company_name: string; phone_number: string;
}
export interface PortalLoginResponse { access: string; expires_in: number; account: PortalAccount; }
export interface PortalProduct {
  id: number; name: string; sale_price: string; category: number | null;
  category_name: string; unit_type: UnitType; available_quantity: number;
  dimension_unit_detail: ApiUnitDetail | null; weight_unit_detail: ApiUnitDetail | null;
  volume_unit_detail: ApiUnitDetail | null; area_unit_detail: ApiUnitDetail | null;
  count_unit_detail: ApiUnitDetail | null;
}
export type OrderStatus = "pending" | "confirmed" | "rejected" | "cancelled";
export interface PortalOrderItem {
  id: number; product: number; product_name: string; quantity: number;
  unit_price: string; line_total: number;
}
export interface PortalOrder {
  id: number; customer: number; customer_name: string; customer_phone: string;
  company_name: string; status: OrderStatus; status_display: string;
  note: string; staff_note: string; items: PortalOrderItem[];
  total_price: number; created_at: string; updated_at: string;
}
export interface PortalOrderPayload { note?: string; items: { product: number; quantity: number }[]; }
export interface AdminPortalAccount {
  id: number; customer: number; customer_name: string; customer_phone: string;
  company_name: string; username: string; is_active: boolean; granted_by: number | null;
  granted_by_username: string; last_login: string | null; created_at: string;
}
export interface CreatePortalAccountPayload { customer: number; username: string; password?: string; is_active?: boolean; }
export interface CreatePortalAccountResponse { id: number; customer: number; username: string; generated_password?: string; is_active: boolean; }
export type PortalProductPage = Paginated<PortalProduct>;
