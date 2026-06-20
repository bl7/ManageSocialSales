CREATE TABLE IF NOT EXISTS bij_product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bij_products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES bij_product_categories(id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bij_products' AND column_name = 'category'
  ) THEN
    INSERT INTO bij_product_categories (name)
    SELECT DISTINCT TRIM(category)
    FROM bij_products
    WHERE category IS NOT NULL AND TRIM(category) != ''
    ON CONFLICT (name) DO NOTHING;

    UPDATE bij_products p
    SET category_id = c.id
    FROM bij_product_categories c
    WHERE TRIM(p.category) = c.name AND p.category_id IS NULL;

    ALTER TABLE bij_products DROP COLUMN category;
  END IF;
END $$;
