-- Investors, account transfers, profit withdrawals, investment CRUD support

CREATE TABLE IF NOT EXISTS bij_investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bij_investors_name ON bij_investors(name);

ALTER TABLE bij_investments
  ADD COLUMN IF NOT EXISTS investor_id UUID REFERENCES bij_investors(id);

-- Backfill investors from existing investment names
INSERT INTO bij_investors (name)
SELECT DISTINCT investor_name
FROM bij_investments
WHERE investor_name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM bij_investors i WHERE LOWER(i.name) = LOWER(bij_investments.investor_name)
  );

UPDATE bij_investments i
SET investor_id = inv.id
FROM bij_investors inv
WHERE i.investor_id IS NULL
  AND LOWER(inv.name) = LOWER(i.investor_name);

CREATE TABLE IF NOT EXISTS bij_account_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_account_id UUID NOT NULL REFERENCES bij_accounts(id),
  to_account_id UUID NOT NULL REFERENCES bij_accounts(id),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  transfer_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (from_account_id <> to_account_id)
);

CREATE INDEX IF NOT EXISTS idx_bij_account_transfers_date
  ON bij_account_transfers(transfer_date DESC);

CREATE TABLE IF NOT EXISTS bij_profit_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID REFERENCES bij_investors(id),
  account_id UUID NOT NULL REFERENCES bij_accounts(id),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  withdrawal_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bij_profit_withdrawals_date
  ON bij_profit_withdrawals(withdrawal_date DESC);

CREATE INDEX IF NOT EXISTS idx_bij_profit_withdrawals_investor
  ON bij_profit_withdrawals(investor_id);

-- Extend account ledger entry types
ALTER TABLE bij_account_ledger DROP CONSTRAINT IF EXISTS bij_account_ledger_entry_type_check;
ALTER TABLE bij_account_ledger ADD CONSTRAINT bij_account_ledger_entry_type_check
  CHECK (entry_type IN (
    'opening_adjustment', 'sale_received', 'purchase_paid', 'expense',
    'payment_in', 'payment_out', 'investment', 'investment_void',
    'sale_void', 'purchase_void', 'transfer_in', 'transfer_out', 'profit_withdrawal'
  ));

CREATE INDEX IF NOT EXISTS idx_bij_investments_investor_id ON bij_investments(investor_id);
