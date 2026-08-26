# PRD — E-commerce & PWA Outlet 365

## 1. Informações Gerais do Projeto

- **Nome do Projeto:** E-commerce & PWA Outlet 365  
- **Marca:** Outlet 365  
- **Segmento:** Moda masculina, calçados e acessórios  
- **Modelo de Negócio:** Loja física + Loja virtual (Omnichannel regional e nacional)  
- **Canais Digitais:** Loja Virtual / PWA e Instagram oficial  
- **Status do Projeto:** **Produção / PWA Integrado** (Supabase + SuperFrete + Mercado Pago + Admin com Autenticação)  
- **Abrangência:** Madalena-CE, região do Sertão Central e envio para todo o Brasil  
- **Stack Tecnológica:** 
  - **Frontend:** HTML5 semântico, CSS3 (Design System modular), Vanilla JS (ES6+ modular).
  - **PWA:** Service Worker (`sw.js`), Web App Manifest (`manifest.json`), Caching offline.
  - **Backend & Cloud Database:** [Supabase](https://supabase.com) (PostgreSQL, Row Level Security, RPC Analytics, Supabase Auth).
  - **Gateway de Pagamento:** [Mercado Pago](https://www.mercadopago.com.br) (Checkout Pro, PIX, Cartão e Boleto via Netlify Functions e Express).
  - **Cálculo de Frete:** [SuperFrete](https://superfrete.com) (Correios/Jadlog) + Motor de Fallback Regional e Retirada na Loja.
  - **Hospedagem & Serverless:** [Netlify](https://netlify.com) com Serverless Functions (`netlify/functions/`).

---

## 2. Resumo Executivo

A **Outlet 365** é uma referência em moda masculina, calçados e acessórios sediada em Madalena-CE. O projeto é uma plataforma de e-commerce completa, de alto desempenho, mobile-first e instalável como aplicativo (PWA).

A plataforma conta com arquitetura escalável e desacoplada: banco de dados em nuvem Supabase com sincronização em tempo real, cálculo de frete oficial via SuperFrete, processamento seguro de pagamentos com Mercado Pago, baixa automática de estoque por variação de tamanho e painel administrativo protegido por autenticação.

---

## 3. Dados Oficiais da Empresa

| Campo | Informação Oficial |
|---|---|
| **Razão Social / Nome** | Outlet 365 |
| **Segmento** | Moda masculina, roupas, calçados e acessórios |
| **Tipo de Operação** | Loja física e e-commerce |
| **Endereço** | Santa Terezinha, Rua José Patrício Nogueira, nº 220 |
| **Cidade / UF** | Madalena - CE |
| **CEP de Origem** | 63860-000 |
| **Horário de Atendimento** | Segunda a sábado, 08:30 às 17:30 |
| **Instagram Oficial** | [@outlet365__](https://www.instagram.com/outlet365__) |
| **WhatsApp de Vendas** | (88) 99275-7076 |
| **Chave PIX Oficial** | `5588992757076` |

---

## 4. Problemas Resolvidos & Objetivos de Negócio

| Desafio Anterior | Solução Implementada no Projeto |
|---|---|
| Vendas dependentes de catálogo no WhatsApp/Instagram | Catálogo digital dinâmico 24/7 com fotos, descrições e grade de tamanhos |
| Falta de confiança em fretes para outras regiões | Simulação precisa via SuperFrete (PAC/SEDEX/Jadlog) direto na página de produto |
| Gestão manual e falhas no controle de estoque | Controle automatizado de estoque por variação/tamanho com baixa automática no pedido |
| Checkout manual e demorado | Checkout integrado com Mercado Pago (PIX com chave/QR Code, Cartão e Boleto) |
| Falta de métricas de acesso e vendas | Dashboard analítico com KPIs, visitantes, conversão e relatórios de faturamento |
| Ausência de aplicativo nas lojas | PWA instalável com carregamento instantâneo e suporte offline |

---

## 5. Público-Alvo e Persona

- **Primário:** Homens de 18 a 45 anos que buscam roupas casuais, calçados e acessórios com estilo moderno e excelente custo-benefício.
- **Secundário:** Mulheres comprando presentes (maridos, namorados, filhos, amigos).
- **Geografia:** 
  1. Madalena-CE e cidades vizinhas (Canindé, Boa Viagem, Quixeramobim, Quixadá).
  2. Estado do Ceará e expansão nacional para todo o Brasil.

---

## 6. Escopo de Funcionalidades Implementadas

### ✅ 1. Loja Virtual & PWA
- [x] **Home Dinâmica:** Hero banner configurável, seções automatizadas (Destaques, Promoções, Novidades), categorias e feed social.
- [x] **Catálogo & Filtros:** Navegação por categorias, subcategorias dinâmicas, ordenação de produtos e skeleton loading.
- [x] **Página de Produto (PDP):** Galeria de imagens com zoom, seletor visual de tamanhos com feedback de estoque, simulação de frete por CEP em tempo real, botão de compra rápida e compartilhamento social.
- [x] **Carrinho:** Drawer lateral com controle de quantidades, persistência em `localStorage` e validação com o estoque do Supabase.
- [x] **Checkout:** Formulário inteligente com busca automática de CEP (ViaCEP), opções de entrega (SuperFrete / Retirada), múltiplos meios de pagamento e fallback com link direto para o WhatsApp.
- [x] **PWA (Progressive Web App):** Service Worker para cache offline, manifesto web, instalação em tela inicial (Android/iOS) e favicons em alta definição.
- [x] **Páginas Institucionais:** Quem Somos, Entrega e Prazos, Trocas e Devoluções e Contato com mapa e horários.

### ✅ 2. Back-end, Banco de Dados & Integrações
- [x] **Supabase Database:** Tabelas estruturadas (`products`, `orders`, `site_stats`) com Row Level Security (RLS) e triggers.
- [x] **Controle de Estoque:** Gestão por variações (grade de tamanhos) e decremento transacional no ato do pedido (`decrementStockForOrder`).
- [x] **Mercado Pago (Serverless):** Netlify Function (`mp-preference.js` e `process-payment.js`) e Express local para geração segura de pagamentos.
- [x] **SuperFrete API:** Netlify Function (`calculate-shipping.js`) calculando peso cúbico e medidas de embalagem com fallback regional garantido.
- [x] **Analytics & Telemetria:** Função RPC (`increment_stat`) no Supabase para rastreamento de acessos únicos, visualizações e pedidos.

### ✅ 3. Painel Administrativo (`admin.html`)
- [x] **Autenticação Segura:** Login (`admin-login.html`) e recuperação de senha (`admin-reset.html`) com Supabase Auth.
- [x] **Dashboard Geral:** Faturamento total, ticket médio, total de pedidos, taxa de conversão, visitantes e gráfico diário.
- [x] **Gestão de Produtos:** Cadastro, edição e exclusão de produtos com upload de foto (câmera/arquivo), subcategorias dinâmicas, controle de estoque por tamanho, peso/dimensões e destaques.
- [x] **Gestão de Pedidos:** Acompanhamento de pedidos em tempo real, detalhes do comprador/itens e alteração de status (Pendente, Pago, Enviado, Entregue, Cancelado).
- [x] **Gestão do Hero / Destaques:** Organização dos banners e produtos em evidência na Home.

---

## 7. Estrutura do Banco de Dados (Supabase)

### Tabela: `products`
- `id` (text, PK)
- `slug` (text, unique)
- `name` (text)
- `category` (text)
- `subcategory` (text)
- `price` (numeric), `original_price` (numeric)
- `installments` (integer)
- `sizes` (text)
- `stock` (integer), `variant_stock` (jsonb)
- `weight` (numeric), `height` (numeric), `width` (numeric), `length` (numeric)
- `image_url` (text), `image_base64` (text)
- `featured` (boolean), `new_arrival` (boolean), `weekly_promo` (boolean), `hero_card` (boolean)
- `active` (boolean)

### Tabela: `orders`
- `id` (text, PK)
- `customer` (jsonb) — nome, email, whatsapp, endereço
- `items` (jsonb) — lista de itens, tamanhos, quantidades e preços
- `shipping` (jsonb) — método de envio, valor do frete, prazo estimado
- `payment` (jsonb) — método (PIX, Cartão, Boleto), status da transação
- `total` (numeric), `status` (text), `created_at` (timestamp)

### Tabela: `site_stats`
- `date` (date, PK)
- `visitors` (integer), `views` (integer), `orders_count` (integer), `revenue` (numeric)

---

## 8. Arquitetura de Informação e Arquivos

```
Outlet 365/
├── index.html                   # Página principal (Home)
├── categoria.html               # Catálogo de produtos com filtros
├── produto.html                 # Página de detalhes do produto (PDP)
├── checkout.html                # Checkout transparente e integrado
├── admin.html                   # Dashboard e Painel de Controle
├── admin-login.html             # Login administrativo
├── admin-reset.html             # Recuperação de senha do admin
├── sobre.html                   # Quem somos
├── entrega.html                 # Prazos e política de entrega
├── trocas.html                  # Política de trocas e devoluções
├── contato.html                 # Informações de contato e atendimento
├── manifest.json                # Configurações PWA
├── sw.js                        # Service Worker para cache offline
├── favicon.ico                  # Favicon
├── server.js                    # Servidor local Express
├── supabase-schema.sql          # Definições SQL do Supabase
├── package.json                 # Manifesto Node.js
│
├── css/
│   ├── style.css                # Design System principal da loja
│   └── admin.css                # Estilos dedicados do painel administrativo
│
├── js/
│   ├── supabase-client.js       # Configuração do cliente Supabase
│   ├── db.js                    # Camada de dados e regras de negócio do banco
│   ├── data.js                  # Catálogo de produtos inicial / fallback
│   ├── cart.js                  # Lógica do carrinho de compras
│   ├── main.js                  # Comportamentos globais da UI
│   ├── home-dynamic.js          # Renderizador dinâmico da Home
│   ├── catalog.js               # Filtros e listagem do catálogo
│   ├── produto.js               # Interações da PDP e cálculo de frete
│   ├── pwa.js                   # Gerenciador de ciclo de vida do PWA
│   └── admin.js                 # Lógica e regras do painel admin
│
├── netlify/
│   └── functions/
│       ├── calculate-shipping.js# API de frete (SuperFrete + Fallback)
│       ├── mp-preference.js     # Criação de sessão Mercado Pago
│       └── process-payment.js   # Processamento de pagamentos
│
└── scripts/
    ├── generate-favicons.js     # Utilitário de assets visuais
    └── update-html-icons.js     # Inserção automatizada de tags nos HTMLs
```

---

## 9. Diretrizes de UI / UX & Identidade Visual

- **Paleta de Cores:**
  - Cor Primária: Azul Real (`#080ce6` / `#2452c8`)
  - Acentos de Ação / Sucesso: Verde Esmeralda (`#10B981`)
  - Fundo & Superfícies: Branco Puro (`#FFFFFF`) e Cinza Claro (`#F8FAFC`)
  - Modo Escuro / Elementos Noturnos: Preto Grafite (`#0F172A`)
- **Tipografia:** Família `Inter` (Google Fonts) para máxima legibilidade em dispositivos móveis.
- **Ícones:** Font Awesome 6.4 + SVG icons customizados.
- **Responsividade:** Mobile-first rigoroso, otimizado para navegação com uma única mão.

---

## 10. Checklist de Lançamento & Aceite

- [x] Catálogo completo com suporte a banco de dados em nuvem (Supabase).
- [x] Painel administrativo com controle de produtos, pedidos, faturamento e autenticação.
- [x] Gestão de estoque com controle por variação e baixa automática em vendas.
- [x] Integração de frete oficial (SuperFrete) com fallback regional e retirada na loja.
- [x] Gateway de pagamento integrado (Mercado Pago Checkout Pro & PIX).
- [x] Progressive Web App (PWA) habilitado com Service Worker e Manifesto.
- [x] Responsividade mobile testada em múltiplos tamanhos de tela.
- [x] Informações cadastrais oficiais (WhatsApp, Endereço, Horário e PIX) padronizadas.
- [ ] Cadastro das fotos reais dos produtos em alta definição no painel admin.
- [ ] Configuração do domínio personalizado final (.com.br) no Netlify.
