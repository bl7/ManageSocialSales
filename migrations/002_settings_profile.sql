-- Extended business profile for Phase 1

ALTER TABLE bij_settings ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE bij_settings ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE bij_settings ADD COLUMN IF NOT EXISTS business_email TEXT;
ALTER TABLE bij_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
