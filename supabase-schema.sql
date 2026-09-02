-- =====================================================
-- OUTLET 365 — Supabase Schema Seguro (Produção)
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

-- 1. Permissões de Products
-- Visitantes públicos (anon) podem APENAS consultar produtos ativos
DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products
  FOR SELECT TO anon USING (active = true);

-- Usuários autenticados (Admin) têm acesso completo a produtos
DROP POLICY IF EXISTS "auth_all_products" ON products;
CREATE POLICY "auth_all_products" ON products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Permissões de Orders
-- Visitantes públicos (anon) podem APENAS INSERIR novos pedidos
DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders
  FOR INSERT TO anon WITH CHECK (true);

-- Visitantes NÃO podem consultar, atualizar ou apagar pedidos
DROP POLICY IF EXISTS "anon_select_orders" ON orders;
DROP POLICY IF EXISTS "anon_update_orders" ON orders;
DROP POLICY IF EXISTS "anon_delete_orders" ON orders;

-- Usuários autenticados (Admin) têm acesso a gerenciar pedidos
DROP POLICY IF EXISTS "auth_all_orders" ON orders;
CREATE POLICY "auth_all_orders" ON orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Permissões de Site Stats
-- Visitantes NÃO podem ler nem alterar site_stats diretamente via REST
DROP POLICY IF EXISTS "anon_select_site_stats" ON site_stats;
DROP POLICY IF EXISTS "anon_all_site_stats" ON site_stats;

-- Apenas usuários autenticados (Admin) podem ler estatísticas
DROP POLICY IF EXISTS "auth_all_site_stats" ON site_stats;
CREATE POLICY "auth_all_site_stats" ON site_stats
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Revoga permissões diretas de tabela do anon em site_stats para garantir
REVOKE SELECT, UPDATE, DELETE, INSERT ON site_stats FROM anon;

-- ─── RPC FUNCTION: increment_stat (Validada e Segura) ───────────────────
CREATE OR REPLACE FUNCTION increment_stat(stat_col TEXT, is_new_visitor BOOLEAN DEFAULT false)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today DATE := CURRENT_DATE;
BEGIN
  -- Validação estrita por whitelist para prevenir qualquer injeção
  IF stat_col NOT IN ('page_views', 'cart_adds', 'checkouts') THEN
    RAISE EXCEPTION 'Coluna de estatística inválida: %', stat_col;
  END IF;

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
$$;

-- Concede execução da RPC aos papéis anon e authenticated
GRANT EXECUTE ON FUNCTION increment_stat(TEXT, BOOLEAN) TO anon, authenticated;

-- ─── RPC FUNCTION: decrement_product_stock (Baixa de Estoque Segura) ───────
CREATE OR REPLACE FUNCTION decrement_product_stock(item_id TEXT, qty_to_sub INT, item_size TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_total INT;
  v_stock JSONB;
  current_size_qty INT;
BEGIN
  SELECT stock, variant_stock INTO current_total, v_stock
  FROM products
  WHERE id = item_id;

  IF FOUND THEN
    current_total := COALESCE(current_total, 0);
    v_stock := COALESCE(v_stock, '{}'::jsonb);

    IF item_size IS NOT NULL AND item_size <> '' AND (v_stock ? item_size) THEN
      current_size_qty := COALESCE((v_stock->>item_size)::INT, 0);
      v_stock := jsonb_set(v_stock, ARRAY[item_size], to_jsonb(GREATEST(0, current_size_qty - qty_to_sub)));
    END IF;

    UPDATE products
    SET stock = GREATEST(0, current_total - qty_to_sub),
        variant_stock = v_stock,
        sales_count = COALESCE(sales_count, 0) + qty_to_sub
    WHERE id = item_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION decrement_product_stock(TEXT, INT, TEXT) TO authenticated, service_role, anon;

-- ─── SUPABASE STORAGE: BUCKET products ───────────────────────────────────────
-- Cria o bucket 'products' como público se ainda não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('products', 'products', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE 
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Permite leitura pública de todas as fotos do bucket products
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'products');

-- Permite inserção/upload para usuários autenticados (ou anon via painel)
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'products');

-- Permite atualização de fotos
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
CREATE POLICY "Authenticated Update" ON storage.objects
FOR UPDATE USING (bucket_id = 'products');

-- Permite exclusão de fotos
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
CREATE POLICY "Authenticated Delete" ON storage.objects
FOR DELETE USING (bucket_id = 'products');
