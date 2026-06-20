-- Shree Inventory schema (bij_ prefix for shared database)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS bij_app_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bij_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  category TEXT,
  brand TEXT,
  supplier TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bij_product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES bij_products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  default_cost_price NUMERIC(10,2) DEFAULT 0,
  default_selling_price NUMERIC(10,2) DEFAULT 0,
  reorder_level INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_id, size, color)
);

CREATE TABLE IF NOT EXISTS bij_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_date DATE NOT NULL,
  supplier TEXT,
  notes TEXT,
  total_amount NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bij_purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES bij_purchases(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES bij_product_variants(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC(10,2) NOT NULL CHECK (unit_cost >= 0),
  line_total NUMERIC(10,2) NOT NULL CHECK (line_total >= 0)
);

CREATE TABLE IF NOT EXISTS bij_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date DATE NOT NULL,
  platform TEXT,
  notes TEXT,
  total_amount NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bij_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES bij_sales(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES bij_product_variants(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_sale_price NUMERIC(10,2) NOT NULL CHECK (unit_sale_price >= 0),
  line_total NUMERIC(10,2) NOT NULL CHECK (line_total >= 0)
);

CREATE TABLE IF NOT EXISTS bij_stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_date DATE NOT NULL,
  variant_id UUID NOT NULL REFERENCES bij_product_variants(id),
  quantity_change INTEGER NOT NULL CHECK (quantity_change <> 0),
  reason TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bij_inventory_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES bij_product_variants(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'adjustment')),
  reference_type TEXT NOT NULL CHECK (reference_type IN ('purchase_item', 'sale_item', 'stock_adjustment')),
  reference_id UUID,
  quantity_change INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  unit_cost NUMERIC(10,2),
  unit_sale_price NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bij_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT DEFAULT 'Shree Inventory',
  currency TEXT DEFAULT '$',
  low_stock_default INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bij_product_variants_product_id ON bij_product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_bij_purchase_items_variant_id ON bij_purchase_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_bij_sale_items_variant_id ON bij_sale_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_bij_stock_adjustments_variant_id ON bij_stock_adjustments(variant_id);
CREATE INDEX IF NOT EXISTS idx_bij_inventory_ledger_variant_id ON bij_inventory_ledger(variant_id);
CREATE INDEX IF NOT EXISTS idx_bij_inventory_ledger_created_at ON bij_inventory_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bij_sales_sale_date ON bij_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_bij_purchases_purchase_date ON bij_purchases(purchase_date);
