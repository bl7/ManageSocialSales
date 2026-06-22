ALTER TABLE bij_settings
  ADD COLUMN IF NOT EXISTS date_calendar TEXT NOT NULL DEFAULT 'BS'
  CHECK (date_calendar IN ('AD', 'BS'));
