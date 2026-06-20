-- Phase 2: Parties, credit (udhar), payments, expenses, invoicing settings

CREATE TABLE IF NOT EXISTS bij_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  party_type TEXT NOT NULL DEFAULT 'customer'
    CHECK (party_type IN ('customer', 'supplier', 'both')),
  opening_balance NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bij_party_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES bij_parties(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  entry_type TEXT NOT NULL
    CHECK (entry_type IN ('sale', 'purchase', 'payment_in', 'payment_out', 'opening')),
  reference_type TEXT,
  reference_id UUID,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  balance_after NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bij_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES bij_parties(id),
  payment_date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  direction TEXT NOT NULL CHECK (direction IN ('received', 'paid')),
  payment_method TEXT DEFAULT 'cash',
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bij_expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS bij_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date DATE NOT NULL,
  category_id UUID NOT NULL REFERENCES bij_expense_categories(id),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  party_id UUID REFERENCES bij_parties(id),
  payment_method TEXT DEFAULT 'cash',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bij_sales ADD COLUMN IF NOT EXISTS party_id UUID REFERENCES bij_parties(id);
ALTER TABLE bij_sales ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'paid'
  CHECK (payment_status IN ('paid', 'partial', 'unpaid'));
ALTER TABLE bij_sales ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2) DEFAULT 0;
ALTER TABLE bij_sales ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE bij_sales ADD COLUMN IF NOT EXISTS invoice_number TEXT;

ALTER TABLE bij_purchases ADD COLUMN IF NOT EXISTS party_id UUID REFERENCES bij_parties(id);
ALTER TABLE bij_purchases ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'paid'
  CHECK (payment_status IN ('paid', 'partial', 'unpaid'));
ALTER TABLE bij_purchases ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2) DEFAULT 0;
ALTER TABLE bij_purchases ADD COLUMN IF NOT EXISTS due_date DATE;

UPDATE bij_sales SET amount_paid = total_amount, payment_status = 'paid'
  WHERE amount_paid IS NULL OR amount_paid = 0 AND total_amount > 0;
UPDATE bij_purchases SET amount_paid = total_amount, payment_status = 'paid'
  WHERE amount_paid IS NULL OR amount_paid = 0 AND total_amount > 0;

ALTER TABLE bij_settings ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT 'INV-';
ALTER TABLE bij_settings ADD COLUMN IF NOT EXISTS next_invoice_number INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_bij_parties_type ON bij_parties(party_type);
CREATE INDEX IF NOT EXISTS idx_bij_party_ledger_party_id ON bij_party_ledger(party_id);
CREATE INDEX IF NOT EXISTS idx_bij_payments_party_id ON bij_payments(party_id);
CREATE INDEX IF NOT EXISTS idx_bij_sales_party_id ON bij_sales(party_id);
CREATE INDEX IF NOT EXISTS idx_bij_purchases_party_id ON bij_purchases(party_id);
CREATE INDEX IF NOT EXISTS idx_bij_expenses_date ON bij_expenses(expense_date DESC);

INSERT INTO bij_expense_categories (name) VALUES
  ('Rent'), ('Shipping'), ('Packaging'), ('Marketing'), ('Other')
ON CONFLICT (name) DO NOTHING;
