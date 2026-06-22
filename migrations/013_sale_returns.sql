-- Sale returns (partial refunds / item returns)

ALTER TABLE bij_sale_items
  ADD COLUMN IF NOT EXISTS returned_quantity INT NOT NULL DEFAULT 0;

ALTER TABLE bij_sales
  ADD COLUMN IF NOT EXISTS amount_refunded NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS returned_value NUMERIC(10,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS bij_sale_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES bij_sales(id) ON DELETE CASCADE,
  return_date DATE NOT NULL,
  refund_amount NUMERIC(10,2) NOT NULL,
  cash_refund NUMERIC(10,2) NOT NULL DEFAULT 0,
  credit_adjustment NUMERIC(10,2) NOT NULL DEFAULT 0,
  account_id UUID REFERENCES bij_accounts(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bij_sale_return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES bij_sale_returns(id) ON DELETE CASCADE,
  sale_item_id UUID NOT NULL REFERENCES bij_sale_items(id),
  variant_id UUID NOT NULL REFERENCES bij_product_variants(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_refund_price NUMERIC(10,2) NOT NULL,
  line_refund NUMERIC(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bij_sale_returns_sale_id ON bij_sale_returns(sale_id);
CREATE INDEX IF NOT EXISTS idx_bij_sale_return_items_return_id ON bij_sale_return_items(return_id);

ALTER TABLE bij_inventory_ledger DROP CONSTRAINT IF EXISTS bij_inventory_ledger_movement_type_check;
ALTER TABLE bij_inventory_ledger ADD CONSTRAINT bij_inventory_ledger_movement_type_check
  CHECK (movement_type IN ('purchase', 'sale', 'adjustment', 'sale_void', 'purchase_void', 'sale_return'));

ALTER TABLE bij_inventory_ledger DROP CONSTRAINT IF EXISTS bij_inventory_ledger_reference_type_check;
ALTER TABLE bij_inventory_ledger ADD CONSTRAINT bij_inventory_ledger_reference_type_check
  CHECK (reference_type IN ('purchase_item', 'sale_item', 'stock_adjustment', 'sale_void', 'purchase_void', 'sale_return'));

ALTER TABLE bij_party_ledger DROP CONSTRAINT IF EXISTS bij_party_ledger_entry_type_check;
ALTER TABLE bij_party_ledger ADD CONSTRAINT bij_party_ledger_entry_type_check
  CHECK (entry_type IN ('sale', 'purchase', 'payment_in', 'payment_out', 'opening', 'sale_void', 'purchase_void', 'sale_return'));

ALTER TABLE bij_account_ledger DROP CONSTRAINT IF EXISTS bij_account_ledger_entry_type_check;
ALTER TABLE bij_account_ledger ADD CONSTRAINT bij_account_ledger_entry_type_check
  CHECK (entry_type IN (
    'opening_adjustment', 'sale_received', 'purchase_paid', 'expense',
    'payment_in', 'payment_out', 'investment', 'investment_void',
    'sale_void', 'purchase_void', 'transfer_in', 'transfer_out', 'profit_withdrawal',
    'sale_refund'
  ));
