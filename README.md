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

- [ ] Integração com gateway de pagamento real (Mercado Pago, PagSeguro)
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
3. **Definir gateway de pagamento** (Mercado Pago recomendado)
4. **Integrar Correios** ou Melhor Envio para cálculo real de frete
5. **Publicar** via aba Publish
## 🚀 Integração Mercado Pago

Esta loja agora suporta checkout via Mercado Pago para cartão e boleto. Para usar localmente, execute um servidor Node.js que cria a preferência de pagamento com o token de acesso Mercado Pago.

### Passos rápidos

1. Crie um arquivo `.env` na raiz com:

   MP_ACCESS_TOKEN=seu_token_de_acesso_mercadopago

2. Instale as dependências:

   npm install

3. Inicie o servidor:

   npm start

4. Acesse `http://localhost:3000/checkout.html` e finalize o pedido.
