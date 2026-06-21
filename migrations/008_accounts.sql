-- Cash & bank accounts and account ledger

CREATE TABLE IF NOT EXISTS bij_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  account_type TEXT NOT NULL DEFAULT 'cash'
    CHECK (account_type IN ('cash', 'bank', 'digital')),
  opening_balance NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bij_account_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES bij_accounts(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'opening_adjustment', 'sale_received', 'purchase_paid', 'expense',
    'payment_in', 'payment_out', 'investment', 'sale_void', 'purchase_void'
  )),
  amount NUMERIC(10,2) NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  balance_after NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO bij_accounts (name, account_type, opening_balance) VALUES
  ('Cash', 'cash', 0),
  ('Bank', 'bank', 0),
  ('eSewa', 'digital', 0),
  ('Khalti', 'digital', 0)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE bij_sale_payment_methods
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES bij_accounts(id);

UPDATE bij_sale_payment_methods pm
SET account_id = a.id
FROM bij_accounts a
WHERE pm.account_id IS NULL
  AND (
    (pm.name = 'Cash' AND a.name = 'Cash')
    OR (pm.name = 'Bank Transfer' AND a.name = 'Bank')
    OR (pm.name = 'eSewa' AND a.name = 'eSewa')
    OR (pm.name = 'Khalti' AND a.name = 'Khalti')
  );

ALTER TABLE bij_purchases ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES bij_accounts(id);
ALTER TABLE bij_expenses ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES bij_accounts(id);
ALTER TABLE bij_payments ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES bij_accounts(id);
ALTER TABLE bij_investments ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES bij_accounts(id);

CREATE INDEX IF NOT EXISTS idx_bij_account_ledger_account_id ON bij_account_ledger(account_id);
CREATE INDEX IF NOT EXISTS idx_bij_account_ledger_entry_date ON bij_account_ledger(entry_date DESC);
