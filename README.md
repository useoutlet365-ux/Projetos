# Outlet 365 — E-commerce & PWA

E-commerce completo e Progressive Web App (PWA) de moda masculina, calçados e acessórios para a **Outlet 365**, loja física e virtual localizada em Madalena-CE.

---

## 🎯 Objetivo do Projeto

Proporcionar uma experiência de compra online moderna, rápida e mobile-first, integrando catálogo dinâmico em nuvem, simulação real de frete (SuperFrete + Correios/Jadlog), checkout seguro com Mercado Pago (PIX, Cartão e Boleto), gestão completa via Painel Administrativo com autenticação e suporte a funcionamento offline/PWA instalável.

---

## 🚀 Tecnologias e Arquitetura

- **Front-end:** HTML5 semântico, CSS3 moderno (design system responsivo, dark/light accents, microinterações), Vanilla JavaScript (modular e performático).
- **PWA (Progressive Web App):** Service Worker (`sw.js`), Manifesto Web (`manifest.json`), suporte a instalação em tela inicial e cache de recursos estáticos.
- **Banco de Dados & Autenticação:** [Supabase](https://supabase.com) (PostgreSQL em nuvem, Row Level Security, RPC de métricas, Supabase Auth para o Admin).
- **Gateway de Pagamento:** [Mercado Pago](https://www.mercadopago.com.br) (Checkout Pro & PIX) via Netlify Functions e backend Express local.
- **Cálculo de Frete:** Integração oficial com API [SuperFrete](https://superfrete.com) (PAC, SEDEX, Mini Envios, Jadlog) com fallback regional inteligente para o Ceará e retirada na loja.
- **Hospedagem & Serverless:** [Netlify](https://netlify.com) com Serverless Functions (`netlify/functions/`) e suporte a servidor local Node.js/Express (`server.js`).

---

## ✅ Funcionalidades Implementadas

### 🛍️ Loja & Experiência do Cliente
- **Home Dinâmica** (`index.html`) — Hero slider configurável, vitrines automáticas (Destaques, Promoções da Semana, Novidades), grid de categorias, benefícios e feed do Instagram.
- **Navegação & Menu Mobile** — Drawer lateral fluído com links por categoria, institucional e redes sociais.
- **Busca em Tempo Real** — Pesquisa instantânea por nome, categoria e descrição.
- **Catálogo Inteligente** (`categoria.html`) — Listagem filtrada por categoria e subcategoria, contagem de itens e skeleton loading.
- **Página de Produto (PDP)** (`produto.html`) — Galeria com zoom/thumbnails, seleção visual de variações/tamanhos com validação de estoque em tempo real, cálculo de frete por CEP via SuperFrete, produtos similares e compartilhamento WhatsApp.
- **Carrinho Drawer** (`cart.js`) — Persistência em `localStorage`, controle dinâmico de quantidades com base no estoque disponível e cálculo de subtotal.
- **Checkout Integrado** (`checkout.html`) — Formulário completo com validação de CEP e endereço, cálculo de frete selecionável, integração com Mercado Pago e opção de fallback com fechamento via WhatsApp oficial.
- **PWA Instalável** — Notificação de instalação (A2HS), ícones em alta resolução para Android/iOS e operação offline com Service Worker.
- **Páginas Institucionais** — Quem Somos (`sobre.html`), Entrega e Frete (`entrega.html`), Trocas e Devoluções (`trocas.html`) e Contato (`contato.html`).

### 🛡️ Painel Administrativo (`admin.html`)
- **Autenticação Segura** (`admin-login.html`, `admin-reset.html`) — Login com e-mail/senha via Supabase Auth e fluxo de recuperação de senha.
- **Dashboard & KPIs** — Métricas em tempo real: faturamento total, pedidos realizados, visitantes, conversão, gráfico de receita diária e produtos mais vendidos.
- **Gestão de Produtos** — Cadastro completo com fotos (upload/câmera com conversão base64 ou URL), variações de tamanho com estoque individual por grade, dimensões e peso para frete, toggles de promoção/destaque/hero e ordenação.
- **Baixa Automática de Estoque** — Atualização automática das quantidades e variações no Supabase a cada pedido confirmado.
- **Gestão de Pedidos** — Listagem cronológica, filtro por status (Pendente, Pago, Enviado, Entregue, Cancelado) e atualização de status em tempo real.
- **Módulo Financeiro** — Resumo de faturamento, ticket médio, análise de canais e extrato detalhado.
- **Gerenciador da Home** — Configuração visual dos cards em destaque no Hero da loja.

---

## 📄 Estrutura de Páginas e Rotas

| Página | Arquivo | Finalidade |
|---|---|---|
| **Home** | `index.html` | Vitrine principal da loja |
| **Catálogo** | `categoria.html` | Listagem com filtros (`?cat=camisas\|shorts-calcas\|...`) |
| **Produto** | `produto.html` | Página de detalhes (`?slug=<slug-do-produto>`) |
| **Checkout** | `checkout.html` | Finalização de compra e pagamento |
| **Login Admin** | `admin-login.html` | Acesso autenticado à área restrita |
| **Recuperação de Senha** | `admin-reset.html` | Redefinição de credenciais do admin |
| **Painel Admin** | `admin.html` | Gestão de produtos, pedidos, estoque e métricas |
| **Quem Somos** | `sobre.html` | História e informações da marca |
| **Entrega & Frete** | `entrega.html` | Políticas de envio e prazos |
| **Trocas & Devoluções** | `trocas.html` | Política de troca conforme CDC |
| **Contato** | `contato.html` | Canais de atendimento e localização |

---

## 🏗️ Estrutura de Arquivos do Projeto

```
c:/Outlet365/
├── index.html                   # Página inicial da loja
├── categoria.html               # Página de catálogo / listagem
├── produto.html                 # Página de detalhes do produto (PDP)
├── checkout.html                # Página de checkout e pagamento
├── sobre.html                   # Página institucional: Quem Somos
├── entrega.html                 # Página institucional: Entrega e Frete
├── trocas.html                  # Página institucional: Trocas e Devoluções
├── contato.html                 # Página institucional: Contato
├── admin.html                   # Painel administrativo
├── admin-login.html             # Login do painel administrativo
├── admin-reset.html             # Recuperação de senha do admin
├── manifest.json                # Manifesto PWA
├── sw.js                        # Service Worker (PWA & Cache)
├── favicon.ico                  # Favicon oficial
├── server.js                    # Servidor local Node.js / Express
├── supabase-schema.sql          # Schema do banco de dados PostgreSQL (Supabase)
├── package.json                 # Dependências e scripts do projeto
│
├── css/
│   ├── style.css                # Estilos globais da loja (Design System)
│   └── admin.css                # Estilos dedicados ao Painel Administrativo
│
├── js/
│   ├── supabase-client.js       # Inicialização do cliente Supabase
│   ├── db.js                    # Camada de abstração e operações de banco (CRUD, Estoque, Auth)
│   ├── data.js                  # Catálogo padrão e dados estáticos de fallback
│   ├── cart.js                  # Gerenciador do carrinho de compras (localStorage)
│   ├── main.js                  # Interações globais (menu mobile, busca, toast)
│   ├── home-dynamic.js          # Renderização dinâmica dos blocos da Home
│   ├── catalog.js               # Lógica de filtros e listagem do catálogo
│   ├── produto.js               # Lógica da PDP (galeria, tamanhos, frete, similares)
│   ├── pwa.js                   # Registro do Service Worker e prompt de instalação
│   └── admin.js                 # Lógica completa do painel administrativo
│
├── netlify/
│   └── functions/
│       ├── calculate-shipping.js# Serverless function: Cálculo de frete (SuperFrete)
│       ├── mp-preference.js     # Serverless function: Criar preferência Mercado Pago
│       └── process-payment.js   # Serverless function: Processamento transparente
│
└── scripts/
    ├── generate-favicons.js     # Script auxiliar para geração de ícones PWA
    └── update-html-icons.js     # Script para atualização de meta tags nos HTMLs
```

---

## 🏪 Dados Oficiais da Loja

- **Razão Social / Nome:** Outlet 365
- **Endereço:** Santa Terezinha, Rua José Patrício Nogueira, nº 220 — Madalena - CE, CEP: 63860-000
- **Horário de Funcionamento:** Segunda a Sábado: 08:30 às 17:30
- **Instagram Oficial:** [@outlet365__](https://www.instagram.com/outlet365__)
- **WhatsApp Oficial:** (88) 99275-7076
- **Chave PIX:** `5588992757076`

---

## ⚙️ Configuração e Execução

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (ou configure no Netlify):

```env
# Mercado Pago (Produção ou Sandbox)
MP_ACCESS_TOKEN=TEST-seu_access_token_mercado_pago

# Supabase — somente backend/Netlify Functions; NUNCA publique esta chave no frontend
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key

# SuperFrete (Token da API)
SUPERFRETE_TOKEN=seu_token_superfrete

# CEP de Origem da Loja
STORE_ORIGIN_CEP=63860000

# Porta do servidor local (opcional)
PORT=3000
```

### 2. Executando Localmente

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor local:
   ```bash
   npm start
   ```
3. Acesse a loja em: `http://localhost:3000`

### Papel administrativo no Supabase

As policies administrativas exigem `app_metadata.role = admin` no JWT. Configure esse valor somente pelo painel seguro do Supabase ou por uma função server-side; não use `user_metadata`, pois esse campo pode ser alterado pelo próprio usuário. Depois de alterar o `app_metadata`, encerre e inicie a sessão novamente para receber um JWT atualizado.

### 3. Deploy em Produção (Netlify)

O projeto está configurado para deploy imediato no Netlify com suporte a Serverless Functions:
1. Conecte o repositório ao Netlify.
2. Defina as variáveis privadas (`MP_ACCESS_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPERFRETE_TOKEN`, `STORE_ORIGIN_CEP`) em **Site settings > Environment variables**. Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` em HTML, JavaScript público ou repositório.
3. O arquivo `netlify.toml` gerenciará os redirecionamentos para `/api/*` automaticamente.
