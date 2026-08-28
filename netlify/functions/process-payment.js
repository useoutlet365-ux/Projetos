exports.handler = async (event, context) => {
  // Apenas permitir chamadas via POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Método não permitido" }),
    };
  }

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_ACCESS_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "MP_ACCESS_TOKEN não está configurada no painel da Netlify." }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { order, cartItems, paymentFormData } = body || {};

    if (!order || !cartItems || !paymentFormData || !Array.isArray(cartItems) || cartItems.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Payload inválido ou incompleto." }),
      };
    }

    const SUPABASE_URL = process.env.SUPABASE_URL || "https://umbqcfefdctakdkxlixy.supabase.co";
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtYnFjZmVmZGN0YWtka3hsaXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NjE5MDYsImV4cCI6MjA5NTEzNzkwNn0.r9fRNxtd2h64AEvE4O9RbLIa0EKh0et7lLiApJmOcu4";

    // 1. Obter todos os produtos do Supabase para validação rígida de preços e estoque ativo
    const productsRes = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,price,active`, {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!productsRes.ok) {
      console.error("Falha ao consultar banco de dados Supabase:", await productsRes.text());
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Erro interno ao conectar com a base de dados para validação." }),
      };
    }

    const dbProducts = await productsRes.json();
    const productsMap = new Map(dbProducts.map(p => [p.id, p]));

    // 2. Validar cada item do carrinho e calcular subtotal baseado nos dados do servidor
    let calculatedSubtotal = 0;
    for (const item of cartItems) {
      const dbProd = productsMap.get(item.id);
      if (!dbProd) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Produto inválido ou inexistente: ${item.name || item.id}` }),
        };
      }
      if (!dbProd.active) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Produto indisponível no momento: ${item.name || item.id}` }),
        };
      }
      const qty = parseInt(item.qty) || 0;
      if (qty <= 0 || qty > 100) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Quantidade de produto inválida." }),
        };
      }
      const dbPrice = parseFloat(dbProd.price);
      calculatedSubtotal += dbPrice * qty;
    }

    // 3. Validar valor do frete
    const clientShippingCost = parseFloat(order.shipping ?? 0);
    if (isNaN(clientShippingCost) || clientShippingCost < 0 || clientShippingCost > 600) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Opção de frete inválida." }),
      };
    }

    // 4. Validar o valor total calculado
    const expectedTotal = calculatedSubtotal + clientShippingCost;
    const clientTotal = parseFloat(order.total ?? 0);
    const mpTotal = parseFloat(paymentFormData.transaction_amount ?? 0);

    if (Math.abs(expectedTotal - clientTotal) > 0.05 || Math.abs(expectedTotal - mpTotal) > 0.05) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Valor total divergente do calculado pelo servidor. Recarregue seu carrinho." }),
      };
    }

    // 5. Preparar chamada para o Mercado Pago
    const cleanPhone = (order.customer_phone || '').replace(/\D/g, '');
    const payerPhone = {
      area_code: cleanPhone.slice(0, 2) || '88',
      number: cleanPhone.slice(2) || '999999999'
    };
    const addressParts = (order.address || '').split(',');
    const street = (addressParts[0] || '').trim();
    const number = (addressParts[1] || '').trim();

    const paymentPayload = {
      transaction_amount: mpTotal,
      token: paymentFormData.token,
      description: `Pedido Outlet 365 #${order.id}`,
      installments: paymentFormData.installments || 1,
      payment_method_id: paymentFormData.payment_method_id,
      issuer_id: paymentFormData.issuer_id,
      payer: {
        email: paymentFormData.payer?.email || order.customer_email,
        identification: paymentFormData.payer?.identification,
        first_name: (order.customer_name || 'Cliente').split(' ')[0],
        last_name: (order.customer_name || '').split(' ').slice(1).join(' ') || 'Silva',
        phone: payerPhone,
        address: {
          zip_code: (order.cep || '').replace(/\D/g, ''),
          street_name: street || 'Endereço',
          street_number: (number && !isNaN(Number(number))) ? Number(number) : 0,
          city: order.city || 'Madalena',
          state: order.state || 'CE'
        }
      },
      metadata: {
        order_id: order.id
      }
    };

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': String(order.id)
      },
      body: JSON.stringify(paymentPayload)
    });

    const paymentData = await mpResponse.json();
    if (!mpResponse.ok) {
      console.error("Erro na API de Pagamento do Mercado Pago:", paymentData);
      return {
        statusCode: mpResponse.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      };
    }

    // 6. Atualizar status do pedido e efetuar baixa de estoque no Supabase somente se aprovado
    let newStatus = 'pendente';
    if (paymentData.status === 'approved') {
      newStatus = 'confirmado';
    } else if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
      newStatus = 'cancelado';
    }

    // Atualiza status do pedido
    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${order.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (!updateRes.ok) {
      console.error("Erro ao atualizar status do pedido no Supabase:", await updateRes.text());
    }

    // Baixa de estoque atômica no servidor se pagamento foi aprovado
    if (paymentData.status === 'approved') {
      for (const item of cartItems) {
        if (!item.id) continue;
        try {
          await fetch(`${SUPABASE_URL}/rest/v1/rpc/decrement_product_stock`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              item_id: item.id,
              qty_to_sub: parseInt(item.qty) || 1,
              item_size: item.size || null
            })
          });
        } catch (e) {
          console.error(`Erro ao baixar estoque do item ${item.id}:`, e);
        }
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    };
  } catch (error) {
    console.error("Erro na Netlify Function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro interno ao processar pagamento." }),
    };
  }
};
