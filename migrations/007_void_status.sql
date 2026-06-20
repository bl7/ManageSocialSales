ALTER TABLE bij_sales ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE bij_sales ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;
ALTER TABLE bij_sales ADD COLUMN IF NOT EXISTS void_reason TEXT;

ALTER TABLE bij_purchases ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE bij_purchases ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;
ALTER TABLE bij_purchases ADD COLUMN IF NOT EXISTS void_reason TEXT;

UPDATE bij_sales SET status = 'active' WHERE status IS NULL;
UPDATE bij_purchases SET status = 'active' WHERE status IS NULL;

ALTER TABLE bij_inventory_ledger DROP CONSTRAINT IF EXISTS bij_inventory_ledger_movement_type_check;
ALTER TABLE bij_inventory_ledger ADD CONSTRAINT bij_inventory_ledger_movement_type_check
  CHECK (movement_type IN ('purchase', 'sale', 'adjustment', 'sale_void', 'purchase_void'));

ALTER TABLE bij_inventory_ledger DROP CONSTRAINT IF EXISTS bij_inventory_ledger_reference_type_check;
ALTER TABLE bij_inventory_ledger ADD CONSTRAINT bij_inventory_ledger_reference_type_check
  CHECK (reference_type IN ('purchase_item', 'sale_item', 'stock_adjustment', 'sale_void', 'purchase_void'));

ALTER TABLE bij_party_ledger DROP CONSTRAINT IF EXISTS bij_party_ledger_entry_type_check;
ALTER TABLE bij_party_ledger ADD CONSTRAINT bij_party_ledger_entry_type_check
  CHECK (entry_type IN ('sale', 'purchase', 'payment_in', 'payment_out', 'opening', 'sale_void', 'purchase_void'));
