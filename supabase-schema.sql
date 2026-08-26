-- =====================================================
-- OUTLET 365 — Supabase Schema (Produção)
-- Execute no SQL Editor do painel Supabase
-- =====================================================

-- ─── TABELA: products ───────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id              TEXT PRIMARY KEY,
  slug            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,
  subcategory     TEXT DEFAULT '',
  price           DECIMAL(10,2) NOT NULL,
  original_price  DECIMAL(10,2) DEFAULT 0,
  installments    INT DEFAULT 3,
  sizes           TEXT DEFAULT 'Único',
  description     TEXT DEFAULT '',
  image_base64    TEXT DEFAULT '',
  image_url       TEXT DEFAULT '',
  featured        BOOLEAN DEFAULT false,
  new_arrival     BOOLEAN DEFAULT false,
  weekly_promo    BOOLEAN DEFAULT false,
  hero_card       BOOLEAN DEFAULT false,
  category_cover  BOOLEAN DEFAULT false,
  weight          DECIMAL(10,3) DEFAULT 0.300,
  height          DECIMAL(10,2) DEFAULT 5.0,
  width           DECIMAL(10,2) DEFAULT 15.0,
  length          DECIMAL(10,2) DEFAULT 20.0,
  stock           INT DEFAULT 0,
  variant_stock   JSONB DEFAULT '{}'::jsonb,
  active          BOOLEAN DEFAULT true,
  sales_count     INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Garante que colunas adicionadas recentemente existam se a tabela já foi criada antes
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_cover BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(10,3) DEFAULT 0.300;
ALTER TABLE products ADD COLUMN IF NOT EXISTS height DECIMAL(10,2) DEFAULT 5.0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS width DECIMAL(10,2) DEFAULT 15.0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS length DECIMAL(10,2) DEFAULT 20.0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS variant_stock JSONB DEFAULT '{}'::jsonb;

-- ─── TABELA: orders ─────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY,
  customer_name   TEXT NOT NULL,
  customer_email  TEXT NOT NULL DEFAULT '',
  customer_phone  TEXT NOT NULL DEFAULT '',
  city            TEXT NOT NULL DEFAULT '',
  state           TEXT DEFAULT 'CE',
  address         TEXT DEFAULT '',
  cep             TEXT DEFAULT '',
  subtotal        DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping        DECIMAL(10,2) NOT NULL DEFAULT 0,
  total           DECIMAL(10,2) NOT NULL DEFAULT 0,
  status          TEXT DEFAULT 'pendente',
  payment_method  TEXT DEFAULT '',
  items_json      TEXT DEFAULT '[]',
  notes           TEXT DEFAULT '',
  channel         TEXT DEFAULT 'online',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'online';

-- ─── TABELA: site_stats ─────────────────────────────
CREATE TABLE IF NOT EXISTS site_stats (
  date             DATE PRIMARY KEY,
  page_views       INT DEFAULT 0,
  unique_visitors  INT DEFAULT 0,
  cart_adds        INT DEFAULT 0,
  checkouts        INT DEFAULT 0
);

-- ─── RLS (Row Level Security) ───────────────────────
ALTER TABLE products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;

-- Products
DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products
  FOR SELECT TO anon USING (active = true);

DROP POLICY IF EXISTS "auth_all_products" ON products;
CREATE POLICY "auth_all_products" ON products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Orders
DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_orders" ON orders;
CREATE POLICY "auth_all_orders" ON orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Site Stats
DROP POLICY IF EXISTS "auth_all_site_stats" ON site_stats;
CREATE POLICY "auth_all_site_stats" ON site_stats
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── RPC FUNCTION: increment_stat ───────────────────
CREATE OR REPLACE FUNCTION increment_stat(stat_col TEXT, is_new_visitor BOOLEAN DEFAULT false)
RETURNS VOID AS $$
DECLARE
  today DATE := CURRENT_DATE;
BEGIN
  -- Garante que o registro do dia de hoje existe
  INSERT INTO site_stats (date)
  VALUES (today)
  ON CONFLICT (date) DO NOTHING;

  -- Incrementa de forma atômica o respectivo contador
  IF stat_col = 'page_views' THEN
    UPDATE site_stats 
    SET page_views = page_views + 1,
        unique_visitors = unique_visitors + CASE WHEN is_new_visitor THEN 1 ELSE 0 END
    WHERE date = today;
  ELSIF stat_col = 'cart_adds' THEN
    UPDATE site_stats SET cart_adds = cart_adds + 1 WHERE date = today;
  ELSIF stat_col = 'checkouts' THEN
    UPDATE site_stats SET checkouts = checkouts + 1 WHERE date = today;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
