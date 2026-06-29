-- =====================================================
-- OUTLET 365 — Supabase Schema
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
  stock           INT DEFAULT 0,
  active          BOOLEAN DEFAULT true,
  sales_count     INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

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
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABELA: site_stats ─────────────────────────────
CREATE TABLE IF NOT EXISTS site_stats (
  date             DATE PRIMARY KEY,
  page_views       INT DEFAULT 0,
  unique_visitors  INT DEFAULT 0,
  cart_adds        INT DEFAULT 0,
  checkouts        INT DEFAULT 0
);

-- ─── RLS ────────────────────────────────────────────
ALTER TABLE products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;

-- Products: leitura pública (ativos), escrita só autenticados
CREATE POLICY "anon_select_products" ON products
  FOR SELECT TO anon USING (active = true);

CREATE POLICY "auth_all_products" ON products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Orders: inserção pública (checkout), gestão só autenticados
CREATE POLICY "anon_insert_orders" ON orders
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "auth_all_orders" ON orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Site Stats: leitura pública desativada, gestão só autenticados (RPC gerencia inserção atômica com controle)
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

-- ─── SEED: produtos iniciais ─────────────────────────
INSERT INTO products (id, slug, name, category, subcategory, price, original_price, installments, sizes, description, image_url, featured, new_arrival, weekly_promo, hero_card, stock, active) VALUES

-- CAMISAS
('p1','camisa-basica-fio-401','Camisa Básica Fio 40.1','camisas','Básicas',75.00,0,3,'P,M,G,GG','Camisa básica confeccionada com fio 40.1 de alta qualidade, proporcionando toque macio e durabilidade. Ideal para o dia a dia, lazer e ocasiões casuais. Modelagem regular com conforto garantido.','https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',true,false,false,false,20,true),
('p2','camisa-pima-peruana','Camisa Pima Peruana','camisas','Premium',116.00,0,3,'P,M,G,GG','Camisa confeccionada com algodão pima peruano, reconhecido pela suavidade e resistência superiores. Uma peça premium para quem busca estilo e qualidade no guarda-roupa masculino.','https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80',true,true,false,false,15,true),
('p3','gola-polo','Gola Polo','camisas','Polo',127.00,0,3,'P,M,G,GG','Camisa polo clássica com acabamento refinado. Combina elegância e praticidade para diversas ocasiões, do casual ao semi-formal. Tecido de alta qualidade com caimento perfeito.','https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80',true,false,false,false,18,true),
('p4','oversized-owl','Oversized OWL','camisas','Street',94.84,0,3,'P,M,G,GG','Camisa oversized da linha OWL com modelagem ampla e estilo street. Perfeita para looks casuais com personalidade. Tecido leve e confortável para o dia a dia.','https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80',false,true,false,false,12,true),
('p5','camisa-longline','Camisa Longline','camisas','Street',89.57,0,3,'P,M,G,GG','Camisa longline com corte alongado e modelagem moderna. Combina com calças e shorts para um visual descolado e atual. Tecido respirável e confortável.','https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80',false,true,false,false,10,true),

-- SHORTS E CALÇAS
('p6','short-sarja','Short Sarja','shorts-calcas','Shorts',105.37,0,3,'P,M,G,GG','Short em sarja com tecido resistente e caimento elegante. Ideal para o trabalho casual, lazer e passeios. Com bolsos funcionais e fechamento com botão.','https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=600&q=80',true,false,false,false,14,true),
('p7','short-linho','Short Linho','shorts-calcas','Shorts',52.69,0,3,'P,M,G,GG','Short em linho leve e respirável, perfeito para os dias quentes. Tecido natural que proporciona frescor e conforto ao longo do dia.','https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=600&q=80',false,false,false,false,16,true),
('p8','short-elastano','Short Elastano','shorts-calcas','Shorts',42.15,0,3,'P,M,G,GG','Short com elastano que garante liberdade de movimento e conforto total. Ideal para atividades ao ar livre e lazer casual.','https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&q=80',false,false,false,false,20,true),
('p9','short-jeans','Short Jeans','shorts-calcas','Shorts',126.45,0,3,'38,40,42,44,46,48','Short jeans com lavagem diferenciada e acabamento de qualidade. Um clássico masculino que combina com qualquer look. Corte reto com bolsos frontais e traseiros.','https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80',true,false,false,false,11,true),
('p10','calca-caunt-jeans','Calça Caunt Jeans','shorts-calcas','Calças',189.99,0,3,'38,40,42,44,46,48','Calça jeans Caunt com corte moderno e caimento impecável. Tecido de alta qualidade com stretch para conforto e mobilidade. Peça essencial para qualquer guarda-roupa masculino.','https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80',true,true,false,false,9,true),

-- CALÇADOS E CHINELOS
('p11','chinelo-multimarcas','Chinelo Multimarcas','calcados-chinelos','Chinelos',54.90,0,3,'37,38,39,40,41,42,43,44','Chinelo confortável com solado de alta durabilidade. Design clássico e versátil para o uso diário, praia ou piscina. Disponível em diversas cores.','https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600&q=80',false,false,false,false,25,true),
('p12','chinelo-crocs','Chinelo Crocs','calcados-chinelos','Chinelos',109.00,0,3,'37,38,39,40,41,42,43,44','Chinelo Crocs original, referência em conforto e durabilidade. Material leve e resistente, perfeito para o dia a dia. Com alça traseira ajustável para segurança.','https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',true,false,false,false,18,true),
('p13','chinelo-nuvem','Chinelo Nuvem','calcados-chinelos','Chinelos',84.90,0,3,'37,38,39,40,41,42,43,44','Chinelo Nuvem com palmilha ultra macia que proporciona sensação de leveza a cada passo. Tecnologia de amortecimento avançada para conforto durante todo o dia.','https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&q=80',true,true,false,false,15,true),
('p14','slide-ortopedica','Slide Ortopédica','calcados-chinelos','Slides',84.90,0,3,'37,38,39,40,41,42,43,44','Slide com suporte ortopédico para máximo conforto dos pés. Solado antiderrapante e tira ajustável. Indicada para quem busca saúde e bem-estar no calçado.','https://images.unsplash.com/photo-1556048219-bb6978360b84?w=600&q=80',false,false,false,false,12,true),
('p15','slide-basica','Slide Básica','calcados-chinelos','Slides',54.90,0,3,'38-39,40-41,42-43','Slide básica com design minimalista e elegante. Solado confortável e tira larga para estabilidade. Perfeita para o uso casual diário com praticidade.','https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&q=80',false,false,false,false,20,true),

-- ACESSÓRIOS
('p16','cueca','Cueca','acessorios','Roupas Íntimas',69.40,0,3,'P,M,G,GG','Cueca em malha de alta qualidade com elástico resistente. Corte anatômico para máximo conforto e liberdade de movimento. Tecido respirável para uso durante o dia todo.','https://images.unsplash.com/photo-1594938298603-c8148c4b4e6e?w=600&q=80',false,false,false,false,30,true),
('p17','bone','Boné','acessorios','Bonés',44.90,0,3,'Único','Boné com aba curva e fecho ajustável para todos os tamanhos. Tecido resistente e respirável. Completa qualquer look casual com estilo e atitude.','https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80',true,true,false,false,22,true),

-- PERFUMES
('p18','perfume-arabe-oud-royal','Perfume Árabe Oud Royal','perfumes','Perfumes Árabes',89.90,0,3,'50ml','Perfume árabe Oud Royal com fragrância marcante e sofisticada. Notas de oud, âmbar e especiarias orientais. Longa duração, ideal para ocasiões especiais e uso diário.','https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&q=80',true,true,false,false,15,true),
('p19','perfume-arabe-al-haramain','Perfume Árabe Al Haramain','perfumes','Perfumes Árabes',74.90,0,3,'30ml','Al Haramain, clássico da perfumaria oriental. Aroma adocicado com notas de rosa, musk e baunilha. Fragrância intensa e envolvente que dura o dia todo.','https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&q=80',false,true,false,false,20,true),
('p20','perfume-arabe-dark-oud','Perfume Árabe Dark Oud','perfumes','Perfumes Árabes',109.90,0,3,'50ml','Dark Oud é um perfume árabe de alto impacto com notas profundas de madeira de oud defumada, couro e âmbar negro. Para quem busca presença e elegância marcante.','https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=600&q=80',true,false,false,false,10,true),
('p21','perfume-arabe-musk-al-madina','Musk Al Madina','perfumes','Perfumes Árabes',59.90,0,3,'30ml','Musk Al Madina, perfume árabe clássico com suave fragrância de musk branco, flores e madeira. Leve, fresco e perfeito para o dia a dia.','https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&q=80',false,true,false,false,18,true)

ON CONFLICT (id) DO NOTHING;
