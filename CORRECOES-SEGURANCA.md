# Correções de segurança aplicadas

## O que foi corrigido

A gravação direta de pedidos no checkout foi removida. Agora o pedido é montado e validado pela função server-side, que recalcula produtos, preços, quantidades, estoque, frete e total antes de chamar o Mercado Pago. A gravação no Supabase ocorre somente depois que o gateway retorna o estado do pagamento. Para pagamentos aprovados, a baixa de estoque usa uma RPC atômica; para pagamento pendente ou recusado, o pedido recebe o estado correspondente.

As funções server-side não usam mais chave pública fallback nem têm `service_role` embutida no código. Elas exigem `MP_ACCESS_TOKEN`, `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` configuradas exclusivamente no ambiente do Netlify ou no `.env` local, que não deve ser publicado.

As políticas RLS foram endurecidas. O papel `authenticated` não é mais considerado administrador automaticamente: operações administrativas exigem `app_metadata.role = admin`. O papel anônimo não pode mais inserir pedidos nem executar a baixa de estoque. O bucket de imagens continua público para leitura, mas uploads, alterações e exclusões exigem usuário autenticado com papel administrativo.

A RPC de estoque agora retorna erro quando o produto não existe ou quando a quantidade disponível é insuficiente, e a atualização é feita com condição atômica para evitar estoque negativo e reduzir risco de venda simultânea acima do estoque.

As dependências foram atualizadas; o Express foi atualizado para a série 5 e `npm audit --omit=dev` retornou **0 vulnerabilidades** no estado verificado.

## Ações obrigatórias antes de publicar

1. No Netlify, configure `MP_ACCESS_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPERFRETE_TOKEN` e `STORE_ORIGIN_CEP` em Site settings > Environment variables. Não coloque `SUPABASE_SERVICE_ROLE_KEY` em HTML, JavaScript público, Git ou ZIP publicado.
2. No Supabase SQL Editor, execute o arquivo `supabase-schema.sql` atualizado. Faça backup antes e execute primeiro em um projeto de homologação.
3. Configure o usuário administrador com `app_metadata.role = admin` por mecanismo seguro do Supabase. Não use `user_metadata` para autorização. Depois disso, encerre e inicie a sessão administrativa novamente.
4. Faça um pedido de teste com Mercado Pago em ambiente sandbox. Teste aprovação, recusa, pendência, timeout, repetição da mesma requisição e estoque insuficiente.
5. Confirme no Supabase que `anon` não consegue inserir/ler pedidos, que usuário autenticado sem `app_metadata.role=admin` não consegue operar produtos/pedidos e que somente o backend consegue executar `decrement_product_stock`.

## Limitações importantes

A CSP existente ainda permite `unsafe-inline` e `unsafe-eval` por compatibilidade com os HTMLs atuais. A próxima melhoria recomendada é retirar os handlers inline (`onclick`, `onchange`) e mover scripts inline para arquivos próprios; depois, remover essas duas exceções da CSP. O código público já recebeu escape de dados em várias renderizações, mas a remoção dos handlers inline é a correção mais forte para evitar confusão entre contexto HTML e contexto JavaScript.

A rotina `mp-preference` foi protegida contra chave fallback, mas o fluxo principal de checkout deve continuar usando `process-payment`, que é o caminho revisado para cálculo server-side, persistência pós-pagamento e baixa de estoque.
