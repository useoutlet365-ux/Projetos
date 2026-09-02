# Relatório de Conclusão e Guia Pós-Auditoria — Outlet 365

Todas as vulnerabilidades e apontamentos identificados na auditoria de segurança (**A1 a A8**) foram corrigidos no código-fonte do projeto.

---

## Resumo das Correções Implementadas

| ID | Vulnerabilidade / Apontamento | Status | Ação Realizada no Código |
|---|---|---|---|
| **A1 & A2** | Domínio, TLS e Redirecionamento Netlify | **Configurado / Guia** | Adicionado `_headers` com HSTS (`max-age=31536000; includeSubDomains; preload`) e regras no `netlify.toml`. *(Siga o passo a passo abaixo no painel do Netlify e Registro.br)*. |
| **A3** | XSS DOM e Stored XSS por interpolação em `innerHTML` | **Resolvido** | Criado utilitário universal `escapeHtml` e aplicada sanitização em: busca (`main.js`), catálogo (`catalog.js`), página de produto (`produto.js`), carrinho (`cart.js`), vitrine (`home-dynamic.js`), checkout (`checkout.html`) e **painel admin completo** (`admin.js`). |
| **A4** | Integridade de Preço, Pedido e Baixa de Estoque Prematura | **Resolvido** | Removida a baixa de estoque no cliente no `checkout.html`. A rota de backend (`/api/process-payment` em `server.js` e `netlify/functions/process-payment.js`) recalcula os preços reais do banco, valida o subtotal e **só efetua a baixa atômica de estoque após aprovação confirmada do pagamento**. |
| **A5** | RLS no Supabase, Proteção de `site_stats` e RPCs | **Resolvido** | Atualizado [`supabase-schema.sql`](supabase-schema.sql): `anon` não lê `site_stats` nem `orders`; `increment_stat` possui validação estrita com whitelist; criada função RPC segura `decrement_product_stock`. |
| **A6** | Cabeçalhos de Segurança HTTP e CSP | **Resolvido** | Criado [`_headers`](_headers) e adicionados headers no [`netlify.toml`](netlify.toml) com HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy` e CSP permitindo Supabase, Mercado Pago, Google Fonts, CDNs e WhatsApp. |
| **A7** | Dependências JS com versões flutuantes | **Resolvido** | Fixada a versão `@supabase/supabase-js@2.49.1` em todos os 11 arquivos HTML do projeto. |
| **A8** | Exposição pública de `package.json` e `package-lock.json` | **Resolvido** | Adicionadas regras de redirecionamento 404 no [`netlify.toml`](netlify.toml) e bloqueio no [`_headers`](_headers) para `package.json`, `package-lock.json`, `.env*`, `*.sql` e `*.md`. |

---

## 📌 Guia de Ações Externas Obrigatórias

### 1. Configuração de DNS e Certificado SSL no Netlify (A1 & A2)

1. Acesse o painel do **Netlify** > **Site Configuration** > **Domain management**.
2. Em **Custom domains**:
   - Adicione `outlett365.com.br` e `www.outlett365.com.br`.
   - Defina `www.outlett365.com.br` (ou `outlett365.com.br`) como **Primary domain**.
   - O outro domínio funcionará automaticamente como redirect (301) HTTPS.
3. No seu provedor de DNS (**Registro.br**):
   - **Registro A**: `outlett365.com.br` apontando para `75.2.60.5` (IP padrão Netlify).
   - **Registro CNAME**: `www.outlett365.com.br` apontando para `seu-site.netlify.app`.
4. Em **HTTPS / SSL/TLS certificate** no Netlify:
   - Clique em **Verify DNS configuration** e depois em **Provision certificate** (Let's Encrypt gerenciado).
   - Confirme que o certificado agora inclui ambos os domínios (`outlett365.com.br` e `www.outlett365.com.br`).

---

### 2. Executar o Schema Atualizado no Supabase (A5)

1. Acesse o painel do [Supabase](https://supabase.com/dashboard) do seu projeto.
2. Abra o menu **SQL Editor**.
3. Copie e cole todo o conteúdo do arquivo [`supabase-schema.sql`](supabase-schema.sql).
4. Clique em **Run** (Executar).
5. O script aplicará as políticas de segurança RLS (bloqueando consultas anônimas em `site_stats` e `orders`) e atualizará a RPC `increment_stat`.

---

## Checklist de Testes e Validação Realizados

- [x] **Sintaxe JavaScript:** Validação completa com `node -c` em todas as Netlify Functions, servidor Node e scripts do frontend.
- [x] **Sanitização XSS:** Busca não interpola tags arbitrárias; painel administrativo sanitiza campos de texto de pedidos e itens.
- [x] **Fluxo de Estoque:** `DB.decrementStockForOrder` removido do checkout inicial; decremento é acionado via backend pós-aprovação do Mercado Pago.
- [x] **Segurança de Arquivos:** `package.json`, `package-lock.json` e arquivos SQL configurados com resposta 404 no deploy.
