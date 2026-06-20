CREATE TABLE IF NOT EXISTS bij_sale_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO bij_sale_payment_methods (name) VALUES
  ('Cash'),
  ('COD'),
  ('eSewa'),
  ('Khalti'),
  ('Bank Transfer')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE bij_sales ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES bij_sale_payment_methods(id);
ALTER TABLE bij_sales ADD COLUMN IF NOT EXISTS delivery_charge NUMERIC(10,2) DEFAULT 0 CHECK (delivery_charge >= 0);
