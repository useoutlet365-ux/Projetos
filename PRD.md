# PRD — E-commerce Outlet 365

## 1. Informações gerais do projeto

**Nome do projeto:** E-commerce Outlet 365  
**Marca:** Outlet 365  
**Segmento:** Moda masculina, calçados e acessórios  
**Modelo de negócio:** Loja física + loja online  
**Canal digital atual principal:** Instagram  
**Status do projeto:** MVP implementado — aguardando conteúdo real (fotos, domínio, gateway)  
**Abrangência inicial:** Madalena-CE e região próxima, com operação já iniciando vendas para municípios mais distantes  
**Stack:** HTML + CSS + Vanilla JS (estático, sem dependências de build)  
**Objetivo principal:** Criar uma loja virtual profissional para vender online com catálogo organizado, navegação simples, foco em mobile, simulação de frete e escalabilidade regional

---

## 2. Resumo executivo

A **Outlet 365** é uma loja de **moda masculina, calçados e acessórios** com presença física em Madalena-CE e comunicação ativa no Instagram. O e-commerce está implementado em HTML/CSS/JS puro, sem frameworks ou build steps, com todas as páginas funcionais e o fluxo completo de compra (catálogo → PDP → carrinho → checkout).

A referência funcional adotada para o projeto é a loja [Floretom](https://floretom.com.br), especialmente pela clareza do menu mobile, estrutura da página de produto e destaque a descrição, frete e produtos similares.

---

## 3. Dados confirmados da loja

| Campo | Informação |
|---|---|
| Nome da loja | Outlet 365 |
| Segmento | Moda masculina, calçados, roupas e acessórios |
| Tipo de operação | Loja física e online |
| Cidade | Madalena - CE |
| Endereço | Santa Terezinha, Rua José Patrício Nogueira, nº 220 |
| CEP | 63860-000 |
| Horário de atendimento | Segunda a sábado, 08:30 às 17:30 |
| Canal social principal | Instagram @outlet365__ |
| WhatsApp | (88) 99275-7076 |
| Chave PIX | 5588992757076 |

---

## 4. Problema de negócio

| Problema | Impacto |
|---|---|
| Catálogo disperso em Instagram e conversa | Cliente demora mais para decidir |
| Ausência de loja própria | Menor autoridade digital |
| Processo muito manual | Dificulta escala |
| Falta de página de produto estruturada | Menor confiança |
| Falta de frete visível na jornada | Reduz compras de outras cidades |
| Navegação sem categorias formais | Dificulta exploração do catálogo |

---

## 5. Público-alvo

**Primário:** Homens que compram roupas, calçados e acessórios masculinos para uso casual, trabalho e lazer.  
**Secundário:** Mulheres que compram presentes para maridos, namorados, filhos ou familiares.  
**Recorte geográfico:** Madalena-CE → cidades vizinhas → expansão regional progressiva.

---

## 6. Benchmark e referência

- **Referência principal:** [Floretom](https://floretom.com.br)
- Menu lateral com categorias bem visíveis
- Página de produto com descrição clara
- Simulação/opções de frete
- Seção de produtos similares
- Experiência mobile-first

---

## 7. Escopo do MVP

### Funcionalidades implementadas ✅

| Área | Funcionalidade | Status |
|---|---|---|
| Home | Banner hero slider (3 slides configuráveis), categorias, destaques, promoções, novidades, benefícios, feed do Instagram | ✅ Implementado |
| Navegação | Menu lateral mobile + nav desktop, busca em tempo real | ✅ Implementado |
| Catálogo | Listagem por categoria com filtros, skeleton loading | ✅ Implementado |
| Busca | Busca por nome e categoria com resultados ao vivo | ✅ Implementado |
| PDP | Galeria com thumbnails, nome/preço/parcelamento, tamanhos, frete por CEP, similares, compartilhar WA/IG | ✅ Implementado |
| Carrinho | Drawer lateral, adicionar/remover/alterar qtd, total, localStorage | ✅ Implementado |
| Checkout | Identificação, endereço, frete, pagamento (PIX/Cartão/Boleto), confirmação via WhatsApp | ✅ Implementado |
| Frete | Simulação por CEP (CE vs nacional), opção de retirada na loja | ✅ Implementado |
| WhatsApp flutuante | Botão fixo em todas as páginas com número real | ✅ Implementado |
| Institucional | Quem somos, entregas, trocas e devoluções, contato | ✅ Implementado |
| Mobile | Menu lateral, botões grandes, layout responsivo mobile-first | ✅ Implementado |
| Admin | Dashboard KPIs, financeiro, pedidos, produtos, novo produto, hero config | ✅ Implementado |
| Categorias extras | Perfumes, Promoções (na navegação e catálogo) | ✅ Implementado |

### Fora do escopo inicial

- App próprio
- Área do cliente avançada (login, histórico de pedidos)
- Programa de fidelidade
- ERP/CRM avançado
- Gateway de pagamento real (atualmente redireciona para WhatsApp)
- API real dos Correios / Melhor Envio (atualmente simula o frete)

---

## 8. Catálogo atual (17 produtos no data.js)

### Camisas

| Produto | Tamanhos | Preço |
|---|---|---:|
| Camisa básica fio 40.1 | P/M/G/GG | R$ 75,00 |
| Camisa pima peruana | P/M/G/GG | R$ 116,00 |
| Gola polo | P/M/G/GG | R$ 127,00 |
| Oversized OWL | P/M/G/GG | R$ 94,84 |
| Camisa longline | P/M/G/GG | R$ 89,57 |

### Shorts e Calças

| Produto | Tamanhos | Preço |
|---|---|---:|
| Short sarja | P/M/G/GG | R$ 105,37 |
| Short linho | P/M/G/GG | R$ 52,69 |
| Short elastano | P/M/G/GG | R$ 42,15 |
| Short jeans | 38/40/42/44/46/48 | R$ 126,45 |
| Calça Caunt jeans | 38/40/42/44/46/48 | R$ 189,99 |

### Calçados e Chinelos

| Produto | Numeração | Preço |
|---|---|---:|
| Chinelos multimarcas | 37 ao 44 | R$ 54,90 |
| Chinelo Crocs | 37 ao 44 | R$ 109,00 |
| Chinelo nuvem | 37 ao 44 | R$ 84,90 |
| Slide ortopédica | 37 ao 44 | R$ 84,90 |
| Slide básica | 38-39 / 40-41 / 42-43 | R$ 54,90 |
| Tênis/sapatos | 37 ao 44 | **preço a definir** |

### Acessórios

| Produto | Variação | Preço |
|---|---|---:|
| Cueca | P/M/G/GG | R$ 69,40 |
| Boné | padrão | R$ 44,90 |
| Perfumes árabes 100ml | 100ml | **preço a definir** |

---

## 9. Arquitetura de informação

```
Home
├── Camisas
│   ├── Camisa básica fio 40.1
│   ├── Camisa pima peruana
│   ├── Gola polo
│   ├── Oversized OWL
│   └── Camisa longline
├── Shorts e Calças
│   ├── Short sarja
│   ├── Short linho
│   ├── Short elastano
│   ├── Short jeans
│   └── Calça Caunt jeans
├── Calçados e Chinelos
│   ├── Chinelos multimarcas
│   ├── Chinelo Crocs
│   ├── Chinelo nuvem
│   ├── Slide ortopédica
│   ├── Slide básica
│   └── Tênis e sapatos
├── Acessórios
│   ├── Cueca
│   ├── Boné
│   └── Perfumes árabes
├── Promoções (filtro dinâmico via on_sale no data.js)
├── Quem somos
├── Entrega e frete
├── Trocas e devoluções
└── Contato
```

### Arquivos do projeto

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Home (hero slider, categorias, destaques, promoções, benefícios, instagram) |
| `categoria.html` | Catálogo com filtro por categoria |
| `produto.html` | PDP (galeria, tamanhos, frete por CEP, similares) |
| `checkout.html` | Formulário de compra + modal de confirmação |
| `sobre.html`, `entrega.html`, `trocas.html`, `contato.html` | Páginas institucionais |
| `admin.html` | Painel administrativo completo |
| `css/style.css` | Todos os estilos |
| `css/admin.css` | Estilos do admin |
| `js/data.js` | 17 produtos em `PRODUCTS[]` + helpers |
| `js/cart.js` | Carrinho com localStorage |
| `js/main.js` | Menu mobile, slider, busca, toast |
| `js/catalog.js` / `catalog-dynamic.js` | Listagem de produtos |
| `js/produto.js` | PDP (galeria, tamanhos, frete, similares) |
| `js/home-dynamic.js` | Seções dinâmicas da home |
| `js/admin.js` | Admin panel completo |

---

## 10. Requisitos funcionais principais

### Home
- [x] Banner principal com slider de 3 slides (configurável pelo admin)
- [x] Categorias em destaque (cards com imagem)
- [x] Vitrine de destaques (featured: true no data.js)
- [x] Promoções da semana (on_sale: true no data.js)
- [x] Novidades (new_arrival: true no data.js)
- [x] Seção de benefícios (entrega, parcelamento, segurança, troca)
- [x] Feed do Instagram (visual estático com link para @outlet365__)

### Menu mobile
- [x] Camisas, Shorts e Calças, Calçados e Chinelos, Acessórios, Perfumes, Promoções
- [x] Quem somos, Entrega e frete, Trocas e devoluções, Contato, Instagram

### Página de Produto (PDP)
- [x] Galeria de fotos com thumbnails
- [x] Nome, preço e parcelamento
- [x] Seleção de tamanho/numeração
- [x] Botão comprar (vai direto ao checkout) e adicionar ao carrinho (abre drawer)
- [x] Simulação de frete por CEP (CE vs nacional + opção de retirada)
- [x] Descrição do produto
- [x] Produtos similares
- [x] Compartilhar no WhatsApp e Instagram

### Carrinho
- [x] Drawer lateral
- [x] Adicionar/remover/alterar quantidade
- [x] Recalcular total
- [x] Seguir para checkout

### Checkout
- [x] Formulário completo: nome, e-mail, WhatsApp, endereço completo
- [x] Cálculo de frete
- [x] Seleção de pagamento: PIX / Cartão / Boleto
- [x] PIX com chave copiável (5588992757076)
- [x] Confirmação do pedido via WhatsApp (sem gateway real)

---

## 11. Diretrizes de UI/UX

- Estilo masculino e moderno
- Visual limpo com contraste forte
- **Paleta:** Preto (#0A0A0A), Branco (#FFFFFF), Azul Royal (#2452C8)
- Verde apenas para acentos pontuais (frete, confirmação, PIX)
- Fonte Inter (Google Fonts)
- Ícones Font Awesome 6.4
- Poucos cliques até o produto
- Botões grandes no celular
- Preços e parcelamento sempre visíveis nos cards
- Frete na PDP
- WhatsApp flutuante em todas as páginas

---

## 12. Jornada principal

```
Instagram / acesso direto
→ Home
→ Categoria
→ Produto
→ Seleção de tamanho
→ Simulação de frete
→ Adicionar ao carrinho
→ Checkout
→ Confirmação + WhatsApp
```

---

## 13. Métricas de sucesso (90 primeiros dias)

- Visitas totais e origem do tráfego
- Taxa de conversão
- Abandono de carrinho
- Produtos mais vistos e mais vendidos
- Ticket médio
- Cidades com maior volume de pedidos

---

## 14. Pendências para lançamento

| Item | Prioridade | Status |
|---|---|---|
| Fotos reais dos produtos | Alta | Pendente — usando Unsplash |
| Domínio final | Alta | Pendente |
| Gateway de pagamento real (Mercado Pago recomendado) | Alta | Pendente — checkout redireciona para WhatsApp |
| API real de frete (Correios / Melhor Envio) | Média | Pendente — usando simulação |
| Preços de tênis/sapatos | Média | A definir |
| Preços de perfumes árabes | Média | A definir |
| Favicon | Baixa | Não implementado |
| Open Graph tags (preview no WhatsApp/redes) | Baixa | Não implementado |
| Logo oficial (imagem) | Baixa | Usando texto tipográfico |
| Política de privacidade | Baixa | Pendente |

---

## 15. Critérios de aceite do MVP

1. [x] Site funcional no celular
2. [x] Categorias principais visíveis
3. [x] Produtos iniciais cadastrados (17 produtos)
4. [x] PDP com descrição, frete e similares
5. [x] Carrinho funcional
6. [x] Imagem profissional transmitida
7. [x] Jornada do catálogo ao checkout clara
8. [ ] Fotos reais dos produtos
9. [ ] Gateway de pagamento funcional
10. [ ] Domínio publicado
