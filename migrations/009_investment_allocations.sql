CREATE TABLE IF NOT EXISTS bij_investment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id UUID NOT NULL REFERENCES bij_investments(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES bij_accounts(id),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (investment_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_bij_investment_allocations_investment_id
  ON bij_investment_allocations(investment_id);

-- Backfill single-account investments created before split support
INSERT INTO bij_investment_allocations (investment_id, account_id, amount)
SELECT i.id, i.account_id, i.amount
FROM bij_investments i
WHERE i.account_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM bij_investment_allocations ia WHERE ia.investment_id = i.id
  );
