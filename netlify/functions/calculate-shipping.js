// =====================================================
// OUTLET 365 — Netlify Function: calculate-shipping
// Cálculo dinâmico de frete via API SuperFrete + Fallback
// =====================================================

const ORIGIN_CEP = process.env.STORE_ORIGIN_CEP || "63860000"; // Madalena-CE

function calculatePackage(items, rawPackage) {
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

async function getFallbackOptions(cleanCep) {
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

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido.' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON inválido.' }) };
  }

  const { cep, items, package: customPackage } = body;
  const cleanCep = (cep || '').replace(/\D/g, '');

  if (!cleanCep || cleanCep.length !== 8) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'CEP de destino inválido (deve conter 8 dígitos).' }) };
  }

  const SUPERFRETE_TOKEN = process.env.SUPERFRETE_TOKEN;
  const pkg = calculatePackage(items, customPackage);

  // Se não houver token configurado, retorna tabela regional com fallback gracioso
  if (!SUPERFRETE_TOKEN) {
    console.log("SUPERFRETE_TOKEN não configurado. Retornando frete regional...");
    const fallbackResult = await getFallbackOptions(cleanCep);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...fallbackResult,
        package: pkg
      })
    };
  }

  try {
    const isSandbox = process.env.SUPERFRETE_ENVIRONMENT === 'sandbox';
    const apiUrl = isSandbox
      ? 'https://sandbox.superfrete.com/v1/shipping/calculate'
      : 'https://api.superfrete.com/v1/shipping/calculate';

    const sfPayload = {
      from: {
        postal_code: ORIGIN_CEP.replace(/\D/g, '')
      },
      to: {
        postal_code: cleanCep
      },
      services: "1,2,17", // PAC, SEDEX, Mini Envios
      options: {
        own_hand: false,
        receipt: false,
        insurance_value: 0,
        use_insurance_value: false
      },
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
      console.warn("SuperFrete API retornou erro ou formato inesperado:", sfData);
      const fallbackResult = await getFallbackOptions(cleanCep);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ...fallbackResult,
          package: pkg,
          note: 'Frete regional (SuperFrete indisponível no momento)'
        })
      };
    }

    // Mapear opções retornadas com sucesso
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

    // Se o CEP for de Madalena ou região próxima, inclui opção de Retirada na Loja
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

    // Se nenhuma opção válida foi retornada pela SuperFrete (ex: restrição de CEP), usa fallback
    if (options.length === 0) {
      const fallbackResult = await getFallbackOptions(cleanCep);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ...fallbackResult,
          package: pkg
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        source: 'superfrete',
        package: pkg,
        options
      })
    };

  } catch (error) {
    console.error("Erro interno ao calcular frete com SuperFrete:", error);
    const fallbackResult = await getFallbackOptions(cleanCep);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...fallbackResult,
        package: pkg
      })
    };
  }
};
