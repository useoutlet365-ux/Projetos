const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const SUPERFRETE_TOKEN = process.env.SUPERFRETE_TOKEN;
const ORIGIN_CEP = process.env.STORE_ORIGIN_CEP || "63860000";

if (!MP_ACCESS_TOKEN) {
  console.warn('⚠️ MP_ACCESS_TOKEN não definido. A API Mercado Pago não funcionará.');
}
if (!SUPERFRETE_TOKEN) {
  console.warn('⚠️ SUPERFRETE_TOKEN não definido. O cálculo de frete utilizará fallback regional.');
}

app.use(cors());
app.use(express.json());

// PWA: Headers recomendados para Service Worker e Manifest
app.get('/sw.js', (req, res) => {
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'sw.js'));
});

app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.join(__dirname, 'manifest.json'));
});

app.use(express.static(path.join(__dirname)));

// ── CÁLCULO DE FRETE (SuperFrete + Fallback) ──
function calculatePackageDimensions(items, rawPackage) {
  if (rawPackage && rawPackage.weight) {
    return {
      weight: Math.max(0.1, Math.min(30, parseFloat(rawPackage.weight) || 0.3)),
      height: Math.max(2, Math.min(105, parseFloat(rawPackage.height) || 5)),
      width: Math.max(11, Math.min(105, parseFloat(rawPackage.width) || 15)),
      length: Math.max(16, Math.min(105, parseFloat(rawPackage.length) || 20))
    };
  }

  let totalWeight = 0;
  let totalHeight = 0;
  let maxWidth = 11;
  let maxLength = 16;

  const list = Array.isArray(items) && items.length > 0 ? items : [{ weight: 0.3, height: 5, width: 15, length: 20, qty: 1 }];

  for (const item of list) {
    const qty = parseInt(item.qty) || 1;
    const w = parseFloat(item.weight) || 0.3;
    const h = parseFloat(item.height) || 5;
    const wi = parseFloat(item.width) || 15;
    const l = parseFloat(item.length) || 20;

    totalWeight += w * qty;
    totalHeight += h * qty;
    if (wi > maxWidth) maxWidth = wi;
    if (l > maxLength) maxLength = l;
  }

  return {
    weight: Math.max(0.1, Math.min(30, parseFloat(totalWeight.toFixed(3)))),
    height: Math.max(2, Math.min(105, Math.round(totalHeight))),
    width: Math.max(11, Math.min(105, Math.round(maxWidth))),
    length: Math.max(16, Math.min(105, Math.round(maxLength)))
  };
}

async function getRegionalShippingFallback(cleanCep) {
  let uf = 'CE';
  let cidade = 'Sua cidade';

  try {
    const viaCepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (viaCepRes.ok) {
      const vcData = await viaCepRes.json();
      if (!vcData.erro) {
        uf = vcData.uf || 'CE';
        cidade = vcData.localidade || 'Sua cidade';
      }
    }
  } catch (err) {
    console.warn("ViaCep fallback error:", err);
  }

  const isLocal = uf === 'CE' || cleanCep.startsWith('63') || cleanCep.startsWith('60') || cleanCep.startsWith('61') || cleanCep.startsWith('62');

  const options = [];
  if (isLocal) {
    options.push({
      id: '1',
      name: 'PAC Correios',
      price: 18.50,
      delivery_time: 5,
      delivery_range: { min: 3, max: 5 },
      description: '3 a 5 dias úteis'
    });
    options.push({
      id: '2',
      name: 'SEDEX',
      price: 28.90,
      delivery_time: 2,
      delivery_range: { min: 1, max: 2 },
      description: '1 a 2 dias úteis'
    });
    options.push({
      id: 'retirada',
      name: 'Retirada na Loja',
      price: 0,
      delivery_time: 0,
      delivery_range: { min: 0, max: 0 },
      description: 'Disponível seg–sáb 08:30–17:30 (Madalena-CE)'
    });
  } else {
    options.push({
      id: '1',
      name: 'PAC Correios',
      price: 26.90,
      delivery_time: 12,
      delivery_range: { min: 7, max: 12 },
      description: '7 a 12 dias úteis'
    });
    options.push({
      id: '2',
      name: 'SEDEX',
      price: 48.50,
      delivery_time: 5,
      delivery_range: { min: 3, max: 5 },
      description: '3 a 5 dias úteis'
    });
  }

  return {
    source: 'fallback',
    city: cidade,
    state: uf,
    options
  };
}

app.post('/api/calculate-shipping', async (req, res) => {
  const { cep, items, package: customPackage } = req.body || {};
  const cleanCep = (cep || '').replace(/\D/g, '');

  if (!cleanCep || cleanCep.length !== 8) {
    return res.status(400).json({ error: 'CEP de destino inválido (deve conter 8 dígitos).' });
  }

  const pkg = calculatePackageDimensions(items, customPackage);

  if (!SUPERFRETE_TOKEN) {
    const fallbackResult = await getRegionalShippingFallback(cleanCep);
    return res.json({
      ...fallbackResult,
      package: pkg
    });
  }

  try {
    const isSandbox = process.env.SUPERFRETE_ENVIRONMENT === 'sandbox';
    const apiUrl = isSandbox
      ? 'https://sandbox.superfrete.com/api/v0/calculator'
      : 'https://api.superfrete.com/api/v0/calculator';

    const sfPayload = {
      from: { postal_code: ORIGIN_CEP.replace(/\D/g, '') },
      to: { postal_code: cleanCep },
      services: "1,2,17",
      options: { own_hand: false, receipt: false, insurance_value: 0, use_insurance_value: false },
      package: pkg
    };

    const sfResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPERFRETE_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Outlet365 (contato@outlet365.com.br)'
      },
      body: JSON.stringify(sfPayload)
    });

    const sfData = await sfResponse.json();

    if (!sfResponse.ok || !Array.isArray(sfData)) {
      console.warn("SuperFrete retornou erro:", sfData);
      const fallbackResult = await getRegionalShippingFallback(cleanCep);
      return res.json({
        ...fallbackResult,
        package: pkg,
        note: 'Frete regional (SuperFrete indisponível no momento)'
      });
    }

    const options = [];
    sfData.forEach(service => {
      if (service.has_error || !service.price) return;

      const priceNum = parseFloat(service.price) || 0;
      const minDays = service.delivery_range?.min || service.delivery_time || 1;
      const maxDays = service.delivery_range?.max || service.delivery_time || 5;

      let labelName = service.name || 'Correios';
      if (service.id == 1) labelName = 'PAC Correios';
      else if (service.id == 2) labelName = 'SEDEX';
      else if (service.id == 17) labelName = 'Mini Envios';

      options.push({
        id: String(service.id),
        name: labelName,
        price: priceNum,
        delivery_time: service.delivery_time || maxDays,
        delivery_range: { min: minDays, max: maxDays },
        description: `${minDays} a ${maxDays} dias úteis`
      });
    });

    if (cleanCep.startsWith('63860') || cleanCep.startsWith('6386')) {
      options.push({
        id: 'retirada',
        name: 'Retirada na Loja',
        price: 0,
        delivery_time: 0,
        delivery_range: { min: 0, max: 0 },
        description: 'Disponível seg–sáb 08:30–17:30 (Madalena-CE)'
      });
    }

    if (options.length === 0) {
      const fallbackResult = await getRegionalShippingFallback(cleanCep);
      return res.json({
        ...fallbackResult,
        package: pkg
      });
    }

    return res.json({
      source: 'superfrete',
      package: pkg,
      options
    });

  } catch (error) {
    console.error("Erro interno ao calcular frete com SuperFrete:", error);
    const fallbackResult = await getRegionalShippingFallback(cleanCep);
    return res.json({
      ...fallbackResult,
      package: pkg
    });
  }
});

// ── CRIAÇÃO DE PREFERÊNCIA MERCADO PAGO ──
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

      const dbPrice = parseFloat(dbProd.price);
      item.unit_price = dbPrice;
      calculatedSubtotal += dbPrice * item.quantity;
    }

    // 3. Validar frete não-negativo
    const clientShippingCost = parseFloat(payload.shipments?.cost ?? 0);
    if (isNaN(clientShippingCost) || clientShippingCost < 0 || clientShippingCost > 600) {
      return res.status(400).json({ error: "Opção de frete inválida." });
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

// ── PROCESSAMENTO DE PAGAMENTO DIRETO ──
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
    const clientShippingCost = parseFloat(order.shipping ?? 0);
    if (isNaN(clientShippingCost) || clientShippingCost < 0 || clientShippingCost > 600) {
      return res.status(400).json({ error: "Opção de frete inválida." });
    }

    // 4. Validar o valor total
    const expectedTotal = calculatedSubtotal + clientShippingCost;
    const clientTotal = parseFloat(order.total ?? 0);
    const mpTotal = parseFloat(paymentFormData.transaction_amount ?? 0);

    if (Math.abs(expectedTotal - clientTotal) > 0.05 || Math.abs(expectedTotal - mpTotal) > 0.05) {
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
