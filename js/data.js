// =====================================================
// OUTLET 365 — Products Data
// Produtos carregados do Supabase via DB.loadProducts()
// =====================================================

// Preenchido assincronamente pelo db.js — não editar aqui
var PRODUCTS = [];

// ── STUB (substituído pelo array acima após DB.loadProducts()) ──
var _STATIC_PRODUCTS_REMOVED = [
  {
    id: "p1", slug: "camisa-basica-fio-401",
    name: "Camisa Básica Fio 40.1",
    category: "camisas", subcategory: "Básicas",
    price: 75.00, installments: 3,
    sizes: ["P", "M", "G", "GG"],
    description: "Camisa básica confeccionada com fio 40.1 de alta qualidade, proporcionando toque macio e durabilidade. Ideal para o dia a dia, lazer e ocasiões casuais. Modelagem regular com conforto garantido.",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80"
    ],
    featured: true, new_arrival: false, stock: 20
  },
  {
    id: "p2", slug: "camisa-pima-peruana",
    name: "Camisa Pima Peruana",
    category: "camisas", subcategory: "Premium",
    price: 116.00, installments: 3,
    sizes: ["P", "M", "G", "GG"],
    description: "Camisa confeccionada com algodão pima peruano, reconhecido pela suavidade e resistência superiores. Uma peça premium para quem busca estilo e qualidade no guarda-roupa masculino.",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80",
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600&q=80"
    ],
    featured: true, new_arrival: true, stock: 15
  },
  {
    id: "p3", slug: "gola-polo",
    name: "Gola Polo",
    category: "camisas", subcategory: "Polo",
    price: 127.00, installments: 3,
    sizes: ["P", "M", "G", "GG"],
    description: "Camisa polo clássica com acabamento refinado. Combina elegância e praticidade para diversas ocasiões, do casual ao semi-formal. Tecido de alta qualidade com caimento perfeito.",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80",
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&q=80"
    ],
    featured: true, new_arrival: false, stock: 18
  },
  {
    id: "p4", slug: "oversized-owl",
    name: "Oversized OWL",
    category: "camisas", subcategory: "Street",
    price: 94.84, installments: 3,
    sizes: ["P", "M", "G", "GG"],
    description: "Camisa oversized da linha OWL com modelagem ampla e estilo street. Perfeita para looks casuais com personalidade. Tecido leve e confortável para o dia a dia.",
    image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80",
      "https://images.unsplash.com/photo-1542574271-7f3b92e6c821?w=600&q=80"
    ],
    featured: false, new_arrival: true, stock: 12
  },
  {
    id: "p5", slug: "camisa-longline",
    name: "Camisa Longline",
    category: "camisas", subcategory: "Street",
    price: 89.57, installments: 3,
    sizes: ["P", "M", "G", "GG"],
    description: "Camisa longline com corte alongado e modelagem moderna. Combina com calças e shorts para um visual descolado e atual. Tecido respirável e confortável.",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80",
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80"
    ],
    featured: false, new_arrival: true, stock: 10
  },
  {
    id: "p6", slug: "short-sarja",
    name: "Short Sarja",
    category: "shorts-calcas", subcategory: "Shorts",
    price: 105.37, installments: 3,
    sizes: ["P", "M", "G", "GG"],
    description: "Short em sarja com tecido resistente e caimento elegante. Ideal para o trabalho casual, lazer e passeios. Com bolsos funcionais e fechamento com botão.",
    image: "https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=600&q=80",
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80"
    ],
    featured: true, new_arrival: false, stock: 14
  },
  {
    id: "p7", slug: "short-linho",
    name: "Short Linho",
    category: "shorts-calcas", subcategory: "Shorts",
    price: 52.69, installments: 3,
    sizes: ["P", "M", "G", "GG"],
    description: "Short em linho leve e respirável, perfeito para os dias quentes. Tecido natural que proporciona frescor e conforto ao longo do dia.",
    image: "https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=600&q=80",
      "https://images.unsplash.com/photo-1562183241-840b8af0721e?w=600&q=80"
    ],
    featured: false, new_arrival: false, stock: 16
  },
  {
    id: "p8", slug: "short-elastano",
    name: "Short Elastano",
    category: "shorts-calcas", subcategory: "Shorts",
    price: 42.15, installments: 3,
    sizes: ["P", "M", "G", "GG"],
    description: "Short com elastano que garante liberdade de movimento e conforto total. Ideal para atividades ao ar livre e lazer casual.",
    image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&q=80",
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80"
    ],
    featured: false, new_arrival: false, stock: 20
  },
  {
    id: "p9", slug: "short-jeans",
    name: "Short Jeans",
    category: "shorts-calcas", subcategory: "Shorts",
    price: 126.45, installments: 3,
    sizes: ["38", "40", "42", "44", "46", "48"],
    description: "Short jeans com lavagem diferenciada e acabamento de qualidade. Um clássico masculino que combina com qualquer look. Corte reto com bolsos frontais e traseiros.",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80",
      "https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=600&q=80"
    ],
    featured: true, new_arrival: false, stock: 11
  },
  {
    id: "p10", slug: "calca-caunt-jeans",
    name: "Calça Caunt Jeans",
    category: "shorts-calcas", subcategory: "Calças",
    price: 189.99, installments: 3,
    sizes: ["38", "40", "42", "44", "46", "48"],
    description: "Calça jeans Caunt com corte moderno e caimento impecável. Tecido de alta qualidade com stretch para conforto e mobilidade. Peça essencial para qualquer guarda-roupa masculino.",
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80",
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80"
    ],
    featured: true, new_arrival: true, stock: 9
  },
  {
    id: "p11", slug: "chinelo-multimarcas",
    name: "Chinelo Multimarcas",
    category: "calcados-chinelos", subcategory: "Chinelos",
    price: 54.90, installments: 3,
    sizes: ["37", "38", "39", "40", "41", "42", "43", "44"],
    description: "Chinelo confortável com solado de alta durabilidade. Design clássico e versátil para o uso diário, praia ou piscina. Disponível em diversas cores.",
    image: "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600&q=80",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80"
    ],
    featured: false, new_arrival: false, stock: 25
  },
  {
    id: "p12", slug: "chinelo-crocs",
    name: "Chinelo Crocs",
    category: "calcados-chinelos", subcategory: "Chinelos",
    price: 109.00, installments: 3,
    sizes: ["37", "38", "39", "40", "41", "42", "43", "44"],
    description: "Chinelo Crocs original, referência em conforto e durabilidade. Material leve e resistente, perfeito para o dia a dia. Com alça traseira ajustável para segurança.",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80"
    ],
    featured: true, new_arrival: false, stock: 18
  },
  {
    id: "p13", slug: "chinelo-nuvem",
    name: "Chinelo Nuvem",
    category: "calcados-chinelos", subcategory: "Chinelos",
    price: 84.90, installments: 3,
    sizes: ["37", "38", "39", "40", "41", "42", "43", "44"],
    description: "Chinelo Nuvem com palmilha ultra macia que proporciona sensação de leveza a cada passo. Tecnologia de amortecimento avançada para conforto durante todo o dia.",
    image: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&q=80",
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&q=80"
    ],
    featured: true, new_arrival: true, stock: 15
  },
  {
    id: "p14", slug: "slide-ortopedica",
    name: "Slide Ortopédica",
    category: "calcados-chinelos", subcategory: "Slides",
    price: 84.90, installments: 3,
    sizes: ["37", "38", "39", "40", "41", "42", "43", "44"],
    description: "Slide com suporte ortopédico para máximo conforto dos pés. Solado antiderrapante e tira ajustável. Indicada para quem busca saúde e bem-estar no calçado.",
    image: "https://images.unsplash.com/photo-1556048219-bb6978360b84?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1556048219-bb6978360b84?w=600&q=80",
      "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=600&q=80"
    ],
    featured: false, new_arrival: false, stock: 12
  },
  {
    id: "p15", slug: "slide-basica",
    name: "Slide Básica",
    category: "calcados-chinelos", subcategory: "Slides",
    price: 54.90, installments: 3,
    sizes: ["38-39", "40-41", "42-43"],
    description: "Slide básica com design minimalista e elegante. Solado confortável e tira larga para estabilidade. Perfeita para o uso casual diário com praticidade.",
    image: "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&q=80",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80"
    ],
    featured: false, new_arrival: false, stock: 20
  },
  {
    id: "p18", slug: "perfume-arabe-oud-royal",
    name: "Perfume Árabe Oud Royal",
    category: "perfumes", subcategory: "Perfumes Árabes",
    price: 89.90, installments: 3,
    sizes: ["50ml"],
    description: "Perfume árabe Oud Royal com fragrância marcante e sofisticada. Notas de oud, âmbar e especiarias orientais. Longa duração, ideal para ocasiões especiais e uso diário.",
    image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&q=80",
      "https://images.unsplash.com/photo-1541643600914-78b084683702?w=600&q=80"
    ],
    featured: true, new_arrival: true, stock: 15
  },
  {
    id: "p19", slug: "perfume-arabe-al-haramain",
    name: "Perfume Árabe Al Haramain",
    category: "perfumes", subcategory: "Perfumes Árabes",
    price: 74.90, installments: 3,
    sizes: ["30ml"],
    description: "Al Haramain, clássico da perfumaria oriental. Aroma adocicado com notas de rosa, musk e baunilha. Fragrância intensa e envolvente que dura o dia todo.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&q=80",
      "https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=600&q=80"
    ],
    featured: false, new_arrival: true, stock: 20
  },
  {
    id: "p20", slug: "perfume-arabe-dark-oud",
    name: "Perfume Árabe Dark Oud",
    category: "perfumes", subcategory: "Perfumes Árabes",
    price: 109.90, installments: 3,
    sizes: ["50ml"],
    description: "Dark Oud é um perfume árabe de alto impacto com notas profundas de madeira de oud defumada, couro e âmbar negro. Para quem busca presença e elegância marcante.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=600&q=80",
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80"
    ],
    featured: true, new_arrival: false, stock: 10
  },
  {
    id: "p21", slug: "perfume-arabe-musk-al-madina",
    name: "Musk Al Madina",
    category: "perfumes", subcategory: "Perfumes Árabes",
    price: 59.90, installments: 3,
    sizes: ["30ml"],
    description: "Musk Al Madina, perfume árabe clássico com suave fragrância de musk branco, flores e madeira. Leve, fresco e perfeito para o dia a dia.",
    image: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&q=80",
      "https://images.unsplash.com/photo-1590156562745-5690bc5aab56?w=600&q=80"
    ],
    featured: false, new_arrival: true, stock: 18
  },
  {
    id: "p16", slug: "cueca",
    name: "Cueca",
    category: "acessorios", subcategory: "Roupas Íntimas",
    price: 69.40, installments: 3,
    sizes: ["P", "M", "G", "GG"],
    description: "Cueca em malha de alta qualidade com elástico resistente. Corte anatômico para máximo conforto e liberdade de movimento. Tecido respirável para uso durante o dia todo.",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4b4e6e?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1594938298603-c8148c4b4e6e?w=600&q=80"
    ],
    featured: false, new_arrival: false, stock: 30
  },
  {
    id: "p17", slug: "bone",
    name: "Boné",
    category: "acessorios", subcategory: "Bonés",
    price: 44.90, installments: 3,
    sizes: ["Único"],
    description: "Boné com aba curva e fecho ajustável para todos os tamanhos. Tecido resistente e respirável. Completa qualquer look casual com estilo e atitude.",
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80",
      "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=600&q=80"
    ],
    featured: true, new_arrival: true, stock: 22
  }
]; // fim _STATIC_PRODUCTS_REMOVED

const CATEGORIES = {
  "camisas":           { label: "Camisas",            description: "Básicas, polo, premium e street" },
  "shorts-calcas":     { label: "Shorts e Calças",    description: "Sarja, linho, jeans e elastano" },
  "calcados-chinelos": { label: "Calçados e Chinelos", description: "Chinelos, slides e calçados masculinos" },
  "acessorios":        { label: "Acessórios",         description: "Cuecas, bonés e mais" },
  "perfumes":          { label: "Perfumes",           description: "Perfumes árabes e fragrâncias orientais" },
  "promocoes":         { label: "🔥 Promoções",       description: "Ofertas especiais com tempo limitado" }
};

function getPromoProducts() {
  return PRODUCTS.filter(p => p.weekly_promo);
}

function getProductsByCategory(cat) {
  if (!cat || cat === 'todos') return PRODUCTS;
  if (cat === 'promocoes') return PRODUCTS.filter(p => p.weekly_promo);
  return PRODUCTS.filter(p => p.category === cat);
}

function getFeaturedProducts() {
  return PRODUCTS.filter(p => p.featured);
}

function getNewArrivals() {
  return PRODUCTS.filter(p => p.new_arrival);
}

function getProductBySlug(slug) {
  return PRODUCTS.find(p => p.slug === slug) || null;
}

function getSimilarProducts(product, count = 4) {
  return PRODUCTS
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, count);
}

function searchProducts(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.category.includes(q) ||
    (p.subcategory && p.subcategory.toLowerCase().includes(q))
  );
}

function formatPrice(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatInstallments(price, times) {
  const val = price / times;
  return `ou ${times}x de ${formatPrice(val)} sem juros`;
}
