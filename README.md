# Outlet 365 — E-commerce

E-commerce completo de moda masculina, calçados e acessórios para a **Outlet 365**, loja física localizada em Madalena-CE.

## 🎯 Objetivo

Criar uma loja virtual profissional mobile-first para vender online com catálogo organizado, página de produto com simulação de frete e escalabilidade regional.

## ✅ Funcionalidades Implementadas

- **Home** — Hero slider, grid de categorias, produtos em destaque, novidades, benefícios, feed do Instagram
- **Menu mobile lateral** — Drawer com categorias, links institucionais e link para o Instagram
- **Catálogo** (`categoria.html`) — Listagem com filtros por categoria, contagem de produtos
- **Página de Produto** (`produto.html`) — Galeria de fotos, seleção de tamanho, botão comprar, simulação de frete por CEP, descrição, produtos similares
- **Carrinho lateral** — Drawer com add/remove/qtd, subtotal persistido no localStorage
- **Checkout** (`checkout.html`) — Formulário completo com modal de confirmação de pedido
- **Busca** — Campo de busca com resultados em tempo real
- **Páginas institucionais** — Quem Somos, Entrega e Frete, Trocas e Devoluções, Contato
- **Toast notifications** — Feedback visual para ações do usuário
- **Design responsivo** — Mobile-first, funciona em todos os dispositivos

## 📄 Páginas e URIs

| Página | Arquivo | Parâmetros |
|---|---|---|
| Home | `index.html` | — |
| Catálogo | `categoria.html` | `?cat=camisas\|shorts-calcas\|calcados-chinelos\|acessorios` |
| Produto | `produto.html` | `?slug=<slug-do-produto>` |
| Checkout | `checkout.html` | — |
| Quem Somos | `sobre.html` | — |
| Entrega | `entrega.html` | — |
| Trocas | `trocas.html` | — |
| Contato | `contato.html` | — |

## 🛍️ Catálogo de Produtos (MVP)

| Categoria | Qtd | Faixa de Preço |
|---|---|---|
| Camisas | 5 | R$ 75 – R$ 127 |
| Shorts e Calças | 5 | R$ 42 – R$ 190 |
| Calçados e Chinelos | 5 | R$ 55 – R$ 109 |
| Acessórios | 2 | R$ 45 – R$ 69 |

## 🏗️ Estrutura de Arquivos

```
index.html          — Home
categoria.html      — Listagem de produtos
produto.html        — Página de produto (PDP)
checkout.html       — Finalizar compra
sobre.html          — Quem somos
entrega.html        — Entrega e frete
trocas.html         — Trocas e devoluções
contato.html        — Contato
css/
  style.css         — Todos os estilos
js/
  data.js           — Dados dos produtos e funções utilitárias
  cart.js           — Módulo do carrinho (localStorage)
  main.js           — Interações globais (menu, slider, busca, toast)
  catalog.js        — Lógica da página de catálogo
  produto.js        — Lógica da PDP (galeria, tamanhos, frete, similares)
```

## 🎨 Design

- **Cor primária:** Verde escuro `#1a6b3c`
- **Tipografia:** Inter (Google Fonts)
- **Estilo:** Masculino, moderno, limpo
- **Abordagem:** Mobile-first

## 🏪 Dados da Loja

- **Nome:** Outlet 365
- **Endereço:** Santa Terezinha, Rua José Patrício Nogueira, nº 220 — Madalena-CE, CEP 63860-000
- **Horário:** Segunda a sábado: 08:30 às 17:30
- **Instagram:** [@outlet365__](https://www.instagram.com/outlet365__)

## 🛠️ Painel Administrativo

Acesse em: `admin.html`

### Seções do Admin
| Seção | Funcionalidade |
|---|---|
| **Dashboard** | KPIs (faturamento, pedidos, visitantes, conversão), gráfico de receita diária, engajamento, últimos pedidos, top produtos |
| **Financeiro** | Receita total, ticket médio, melhor dia, gráfico de barras, funil de conversão, pedidos por cidade, extrato diário |
| **Pedidos** | Listagem completa com filtro por status, visualização detalhada, atualização de status inline |
| **Produtos** | Grid com filtro por categoria, editar, ativar/desativar, excluir |
| **Novo Produto** | Formulário mobile-first com câmera, seleção de tamanhos, toggles de destaque, card principal e promoção |
| **Card Principal** | Gerenciar até 5 produtos no destaque da home |

### Funcionalidades do Formulário de Produto
- 📷 **Câmera mobile** — Abre câmera diretamente no celular (`capture="environment"`)
- 🔥 **Promoção da Semana** — Toggle que faz o produto aparecer na seção especial da home
- ⭐ **Card Principal** — Toggle que adiciona ao destaque (máx. 5 produtos)
- 🏷️ **Subcategorias dinâmicas** — Mudam conforme a categoria selecionada
- 📐 **Seleção visual de tamanhos** — Botões clicáveis por categoria
- ✅ **Validação** com limite de hero card em tempo real

## ⏳ Funcionalidades Pendentes (Pós-MVP)

- [x] Integração com gateway de pagamento real (Mercado Pago)
- [ ] Integração com gateway de pagamento real (PagSeguro)
- [ ] Integração com API real dos Correios para cálculo de frete
- [ ] Área do cliente (login, pedidos, endereços)
- [ ] Painel de administração de produtos
- [ ] Integração com sistema de estoque
- [ ] Programa de fidelidade
- [ ] Fotos reais dos produtos (substituir imagens Unsplash)
- [ ] WhatsApp número real (quando disponível)
- [ ] Perfumes árabes e tênis/sapatos com preços (pendentes de definição)
 
## 📱 Próximos Passos Recomendados
 
1. **Substituir imagens** pelas fotos reais dos produtos
2. **Adicionar WhatsApp** oficial quando disponível
3. **Integrar Correios** ou Melhor Envio para cálculo real de frete
4. **Publicar** via aba Publish

## 🚀 Integração Mercado Pago & Netlify Functions

A loja possui integração segura com o Mercado Pago (Checkout Pro) suportando pagamentos via **PIX**, **Cartão de Crédito** (com parcelamento) e **Boleto**, operando tanto localmente com um servidor Express quanto em produção através de **Netlify Functions** (Serverless).

### 1. Funcionamento em Produção (Netlify)

Ao publicar na Netlify, as credenciais confidenciais do Mercado Pago são mantidas em segurança no backend através de uma Serverless Function.

- **Configuração de Rotas (`netlify.toml`)**: Mapeia as chamadas da API do front-end (`/api/mp-preference`) para a Netlify Function de forma transparente e automática.
- **Serverless Function (`netlify/functions/mp-preference.js`)**: Recebe o payload do checkout e assina a preferência de pagamento com o `MP_ACCESS_TOKEN` no servidor.
- **Retornos de Pagamento**: Trata os status de retorno (`success`, `pending`, `failure`) na própria página de checkout, limpando o carrinho, exibindo o modal de confirmação e gerando links personalizados para atendimento via WhatsApp com o ID do pedido.

#### Configuração das Variáveis de Ambiente no Netlify:
1. Acesse o painel da Netlify.
2. Vá em **Site Configuration** > **Environment variables** (Variáveis de ambiente).
3. Adicione uma variável:
   - Nome: `MP_ACCESS_TOKEN`
   - Valor: Seu Token de Acesso de produção (ou sandbox) obtido no painel de desenvolvedor do Mercado Pago.

---

### 2. Desenvolvimento e Testes Locais (Retrocompatibilidade)

Para desenvolver ou testar o fluxo de checkout em sua máquina local:

1. Crie ou edite o arquivo `.env` na raiz do projeto com seu token do Mercado Pago:
   ```env
   MP_ACCESS_TOKEN=TEST-seu_token_de_teste_ou_producao
   ```
2. Instale as dependências locais do Express:
   ```bash
   npm install
   ```
3. Inicie o servidor Express local:
   ```bash
   npm start
   ```
4. Acesse `http://localhost:3000/checkout.html`. Ao finalizar a compra, a chamada local será processada pelo `server.js` na porta 3000 e você será redirecionado para a tela de pagamento em modo Sandbox (Ambiente de Testes).
