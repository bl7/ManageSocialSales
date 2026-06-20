export type MovementType = "purchase" | "sale" | "adjustment" | "sale_void" | "purchase_void";
export type ReferenceType = "purchase_item" | "sale_item" | "stock_adjustment" | "sale_void" | "purchase_void";
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";
export type SalePlatform =
  | "Instagram"
  | "Facebook"
  | "TikTok"
  | "WhatsApp"
  | "Walk-in"
  | "Other";

export type AdjustmentReason =
  | "Damaged"
  | "Lost"
  | "Returned"
  | "Wrong Count"
  | "Giveaway"
  | "Other";

export interface AppUser {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  category_id: string | null;
  category_name?: string | null;
  brand: string | null;
  supplier: string | null;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  default_cost_price: string;
  default_selling_price: string;
  reorder_level: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Settings {
  id: string;
  business_name: string;
  currency: string;
  low_stock_default: number;
  created_at: Date;
  updated_at: Date;
}

export interface VariantWithStock extends ProductVariant {
  product_name: string;
  sku: string | null;
  category: string | null;
  supplier: string | null;
  current_stock: number;
  purchased_qty: number;
  sold_qty: number;
  stock_status: StockStatus;
  latest_unit_cost: number | null;
}

export interface LedgerEntry {
  id: string;
  variant_id: string;
  movement_type: MovementType;
  reference_type: ReferenceType;
  reference_id: string | null;
  quantity_change: number;
  stock_after: number;
  unit_cost: string | null;
  unit_sale_price: string | null;
  notes: string | null;
  created_at: Date;
  product_name: string;
  size: string;
  color: string;
}

export interface DashboardStats {
  total_products: number;
  total_variants: number;
  total_stock_units: number;
  inventory_value: number;
  low_stock_items: number;
  out_of_stock_items: number;
  sales_this_month: number;
  units_sold_this_month: number;
  revenue_this_month: number;
  profit_this_month: number;
}
