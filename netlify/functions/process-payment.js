const crypto = require('crypto');

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function response(statusCode, body) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

function text(value, max = 180) {
  return String(value ?? '').trim().slice(0, max);
}

function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim()) && String(value).length <= 254;
}

async function supabaseFetch(url, serviceKey, options = {}) {
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    ...(options.headers || {})
  };
  return fetch(url, { ...options, headers });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return response(405, { error: 'Método não permitido' });

  const mpToken = process.env.MP_ACCESS_TOKEN;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!mpToken || !serviceKey || !supabaseUrl) {
    console.error('Variáveis server-side ausentes: MP_ACCESS_TOKEN, SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_URL.');
    return response(500, { error: 'Serviço de pagamento não configurado no backend (variáveis de ambiente ausentes).' });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const inputOrder = body.order || {};
    const cartItems = body.cartItems;
    const paymentFormData = body.paymentFormData || {};

    if (!Array.isArray(cartItems) || cartItems.length === 0 || cartItems.length > 50) {
      return response(400, { error: 'Carrinho inválido.' });
    }

    const customerName = text(inputOrder.customer_name, 120);
    const customerEmail = text(inputOrder.customer_email, 254).toLowerCase();
    const customerPhone = text(inputOrder.customer_phone, 30);
    const city = text(inputOrder.city, 100);
    const state = text(inputOrder.state || 'CE', 2).toUpperCase();
    const address = text(inputOrder.address, 240);
    const cep = text(inputOrder.cep, 12).replace(/\D/g, '');
    if (customerName.length < 2 || !validEmail(customerEmail) || !city || !address || cep.length !== 8) {
      return response(400, { error: 'Dados do cliente ou endereço inválidos.' });
    }

    const clientOrderId = text(inputOrder.id, 80);
    const orderId = /^[A-Za-z0-9_-]{6,80}$/.test(clientOrderId) ? clientOrderId : crypto.randomUUID();

    const productsRes = await supabaseFetch(
      `${supabaseUrl}/rest/v1/products?select=id,name,price,active,stock,variant_stock`,
      serviceKey
    );
    if (!productsRes.ok) {
      console.error('Falha ao consultar produtos:', productsRes.status);
      return response(500, { error: 'Não foi possível validar os produtos.' });
    }

    const products = new Map((await productsRes.json()).map(product => [product.id, product]));
    const normalizedItems = [];
    let subtotalCents = 0;

    for (const rawItem of cartItems) {
      const id = text(rawItem.id, 120);
      const size = text(rawItem.size, 40);
      const qty = Number(rawItem.qty);
      const product = products.get(id);
      if (!product || product.active !== true || !Number.isInteger(qty) || qty < 1 || qty > 100) {
        return response(400, { error: 'Produto ou quantidade inválida.' });
      }

      const stock = Number(product.stock || 0);
      if (stock < qty) return response(409, { error: `Estoque insuficiente para ${text(product.name, 100)}.` });

      let variantStock = product.variant_stock || {};
      if (typeof variantStock === 'string') {
        try { variantStock = JSON.parse(variantStock); } catch { variantStock = {}; }
      }
      if (size && Object.prototype.hasOwnProperty.call(variantStock, size) && Number(variantStock[size]) < qty) {
        return response(409, { error: `Estoque insuficiente para o tamanho selecionado.` });
      }

      const unitPrice = money(product.price);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) return response(500, { error: 'Preço de produto inválido.' });
      subtotalCents += Math.round(unitPrice * 100) * qty;
      normalizedItems.push({ id, name: text(product.name, 160), size, qty, price: unitPrice });
    }

    const shipping = money(inputOrder.shipping ?? 0);
    if (!Number.isFinite(shipping) || shipping < 0 || shipping > 600) {
      return response(400, { error: 'Opção de frete inválida.' });
    }

    const expectedTotal = Math.round((subtotalCents + Math.round(shipping * 100)) / 100 * 100) / 100;
    const clientTotal = money(inputOrder.total);
    if (!Number.isFinite(clientTotal) || Math.abs(expectedTotal - clientTotal) > 0.05) {
      return response(400, { error: 'Valor total divergente do calculado pelo servidor.' });
    }

    const paymentMethod = text(paymentFormData.payment_method_id, 60);
    if (!paymentMethod) return response(400, { error: 'Forma de pagamento inválida.' });
    const installments = Math.min(12, Math.max(1, Number(paymentFormData.installments) || 1));
    const cleanPhone = customerPhone.replace(/\D/g, '');
    const [street = '', streetNumber = ''] = address.split(',').map(part => part.trim());
    const payerEmail = validEmail(paymentFormData.payer?.email) ? text(paymentFormData.payer.email, 254).toLowerCase() : customerEmail;

    const paymentPayload = {
      transaction_amount: expectedTotal,
      token: text(paymentFormData.token, 500),
      description: `Pedido Outlet 365 #${orderId}`,
      installments,
      payment_method_id: paymentMethod,
      issuer_id: paymentFormData.issuer_id,
      payer: {
        email: payerEmail,
        identification: paymentFormData.payer?.identification,
        first_name: customerName.split(' ')[0],
        last_name: customerName.split(' ').slice(1).join(' ') || 'Cliente',
        phone: { area_code: cleanPhone.slice(0, 2) || '88', number: cleanPhone.slice(2) || '999999999' },
        address: {
          zip_code: cep,
          street_name: street.slice(0, 120),
          street_number: /^\d+$/.test(streetNumber) ? Number(streetNumber) : 0,
          city,
          state
        }
      },
      metadata: { order_id: orderId }
    };

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': orderId
      },
      body: JSON.stringify(paymentPayload)
    });
    const paymentData = await mpResponse.json();
    if (!mpResponse.ok) {
      console.error('Mercado Pago rejeitou a solicitação:', mpResponse.status, paymentData.status_detail || paymentData.message || 'sem detalhe');
      return response(mpResponse.status, paymentData);
    }

    const orderStatus = paymentData.status === 'approved'
      ? 'confirmado'
      : (paymentData.status === 'rejected' || paymentData.status === 'cancelled' ? 'cancelado' : 'pendente');

    const orderRow = {
      id: orderId,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      city,
      state,
      address,
      cep,
      subtotal: Math.round(subtotalCents) / 100,
      shipping,
      total: expectedTotal,
      status: orderStatus,
      payment_method: paymentMethod,
      items_json: JSON.stringify(normalizedItems),
      notes: '',
      channel: 'online',
      created_at: new Date().toISOString()
    };

    const orderRes = await supabaseFetch(`${supabaseUrl}/rest/v1/orders`, serviceKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(orderRow)
    });
    if (!orderRes.ok) {
      console.error('Pagamento criado, mas pedido não foi gravado:', orderRes.status, await orderRes.text());
      return response(500, { error: 'Pagamento processado, mas houve erro ao registrar o pedido. Contate a loja.', status: paymentData.status });
    }

    if (paymentData.status === 'approved') {
      for (const item of normalizedItems) {
        const stockRes = await supabaseFetch(`${supabaseUrl}/rest/v1/rpc/decrement_product_stock`, serviceKey, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_id: item.id, qty_to_sub: item.qty, item_size: item.size || null })
        });
        if (!stockRes.ok) {
          console.error('Pagamento aprovado, mas baixa de estoque falhou para:', item.id, stockRes.status);
          await supabaseFetch(`${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, serviceKey, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'estoque_erro' })
          });
          return response(500, { error: 'Pagamento aprovado; a loja precisa conferir o estoque manualmente.', status: paymentData.status, order_id: orderId });
        }
      }
    }

    return response(200, { ...paymentData, order_id: orderId });
  } catch (error) {
    console.error('Erro interno ao processar pagamento:', error.message);
    return response(500, { error: 'Erro interno ao processar pagamento.' });
  }
};
