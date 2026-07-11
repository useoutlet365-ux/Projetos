const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

if (!MP_ACCESS_TOKEN) {
  console.warn('⚠️ MP_ACCESS_TOKEN não definido. A API Mercado Pago não funcionará.');
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/mp-preference', async (req, res) => {
  if (!MP_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'MP_ACCESS_TOKEN não configurado.' });
  }

  const payload = req.body?.payload;
  if (!payload) {
    return res.status(400).json({ error: 'Payload inválido ou ausente.' });
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL || "https://umbqcfefdctakdkxlixy.supabase.co";
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtYnFjZmVmZGN0YWtka3hsaXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NjE5MDYsImV4cCI6MjA5NTEzNzkwNn0.r9fRNxtd2h64AEvE4O9RbLIa0EKh0et7lLiApJmOcu4";

    // 1. Obter todos os produtos do Supabase para validação
    const productsRes = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,price,active`, {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!productsRes.ok) {
      console.error("Falha ao consultar banco de dados Supabase:", await productsRes.text());
      return res.status(500).json({ error: "Erro interno ao conectar com a base de dados para validação." });
    }

    const dbProducts = await productsRes.json();
    const productsMap = new Map(dbProducts.map(p => [p.id, p]));

    // 2. Validar cada item e substituir o preço pelo preço real do banco de dados
    let calculatedSubtotal = 0;
    for (const item of payload.items) {
      const dbProd = productsMap.get(item.id);
      if (!dbProd) {
        return res.status(400).json({ error: `Produto inválido ou inexistente: ${item.title}` });
      }
      if (!dbProd.active) {
        return res.status(400).json({ error: `Produto indisponível: ${item.title}` });
      }

      // Substituir o preço enviado pelo preço correto cadastrado no banco
      const dbPrice = parseFloat(dbProd.price);
      item.unit_price = dbPrice;
      calculatedSubtotal += dbPrice * item.quantity;
    }

    // 3. Validar frete (deve bater com as regras estabelecidas no checkout: 0, 18.5, 28.9, 26.9 ou 48.5)
    const allowedShippingCosts = [0, 18.5, 28.9, 26.9, 48.5];
    const clientShippingCost = parseFloat(payload.shipments?.cost ?? 0);
    if (!allowedShippingCosts.includes(clientShippingCost)) {
      return res.status(400).json({ error: "Opção de frete inválida ou adulterada." });
    }

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.json(data);
  } catch (error) {
    console.error('Erro ao criar preferência Mercado Pago:', error);
    return res.status(500).json({ error: 'Erro interno ao criar preferência Mercado Pago.' });
  }
});

app.post('/api/process-payment', async (req, res) => {
  if (!MP_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'MP_ACCESS_TOKEN não configurado.' });
  }

  const { order, cartItems, paymentFormData } = req.body;
  if (!order || !cartItems || !paymentFormData) {
    return res.status(400).json({ error: 'Payload inválido ou incompleto.' });
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL || "https://umbqcfefdctakdkxlixy.supabase.co";
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtYnFjZmVmZGN0YWtka3hsaXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NjE5MDYsImV4cCI6MjA5NTEzNzkwNn0.r9fRNxtd2h64AEvE4O9RbLIa0EKh0et7lLiApJmOcu4";

    // 1. Obter todos os produtos do Supabase para validação
    const productsRes = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,price,active`, {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!productsRes.ok) {
      console.error("Falha ao consultar banco de dados Supabase:", await productsRes.text());
      return res.status(500).json({ error: "Erro interno ao conectar com a base de dados para validação." });
    }

    const dbProducts = await productsRes.json();
    const productsMap = new Map(dbProducts.map(p => [p.id, p]));

    // 2. Validar cada item do carrinho e calcular subtotal
    let calculatedSubtotal = 0;
    for (const item of cartItems) {
      const dbProd = productsMap.get(item.id);
      if (!dbProd) {
        return res.status(400).json({ error: `Produto inválido ou inexistente: ${item.name}` });
      }
      if (!dbProd.active) {
        return res.status(400).json({ error: `Produto indisponível: ${item.name}` });
      }
      const dbPrice = parseFloat(dbProd.price);
      calculatedSubtotal += dbPrice * item.qty;
    }

    // 3. Validar valor do frete
    const allowedShippingCosts = [0, 18.5, 28.9, 26.9, 48.5];
    const clientShippingCost = parseFloat(order.shipping ?? 0);
    if (!allowedShippingCosts.includes(clientShippingCost)) {
      return res.status(400).json({ error: "Opção de frete inválida ou adulterada." });
    }

    // 4. Validar o valor total
    const expectedTotal = calculatedSubtotal + clientShippingCost;
    const clientTotal = parseFloat(order.total ?? 0);
    const mpTotal = parseFloat(paymentFormData.transaction_amount ?? 0);

    if (Math.abs(expectedTotal - clientTotal) > 0.01 || Math.abs(expectedTotal - mpTotal) > 0.01) {
      return res.status(400).json({ error: "Valor total divergente do calculado pelo servidor." });
    }

    // 5. Preparar chamada para o Mercado Pago
    const payerPhone = {
      area_code: order.customer_phone.replace(/\D/g, '').slice(0, 2),
      number: order.customer_phone.replace(/\D/g, '').slice(2)
    };
    const [street, number] = order.address.split(',').map(part => part.trim());

    const paymentPayload = {
      transaction_amount: mpTotal,
      token: paymentFormData.token,
      description: `Pedido Outlet 365 #${order.id}`,
      installments: paymentFormData.installments || 1,
      payment_method_id: paymentFormData.payment_method_id,
      issuer_id: paymentFormData.issuer_id,
      payer: {
        email: paymentFormData.payer.email || order.customer_email,
        identification: paymentFormData.payer.identification,
        first_name: order.customer_name.split(' ')[0],
        last_name: order.customer_name.split(' ').slice(1).join(' ') || 'Silva',
        phone: payerPhone,
        address: {
          zip_code: order.cep.replace(/\D/g, ''),
          street_name: street || '',
          street_number: (number && !isNaN(Number(number))) ? Number(number) : 0,
          city: order.city,
          state: order.state
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
        'X-Idempotency-Key': order.id
      },
      body: JSON.stringify(paymentPayload)
    });

    const paymentData = await mpResponse.json();
    if (!mpResponse.ok) {
      console.error("Erro na API de Pagamento do Mercado Pago:", paymentData);
      return res.status(mpResponse.status).json(paymentData);
    }

    // 6. Atualizar status do pedido no Supabase baseado na resposta
    let newStatus = 'pendente';
    if (paymentData.status === 'approved') {
      newStatus = 'confirmado';
    } else if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
      newStatus = 'cancelado';
    }

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

    return res.json(paymentData);
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    return res.status(500).json({ error: 'Erro interno ao processar pagamento.' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Servidor Outlet365 rodando em http://localhost:${PORT}`);
});
