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
    const payload = body?.payload;

    if (!payload) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Payload inválido ou ausente." }),
      };
    }

    const SUPABASE_URL = process.env.SUPABASE_URL || "https://umbqcfefdctakdkxlixy.supabase.co";
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada.');

    // 1. Obter todos os produtos do Supabase para validação
    const productsRes = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,price,active`, {
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
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

    // 2. Validar cada item e substituir o preço pelo preço real do banco de dados
    let calculatedSubtotal = 0;
    for (const item of payload.items) {
      const dbProd = productsMap.get(item.id);
      if (!dbProd) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Produto inválido ou inexistente: ${item.title}` }),
        };
      }
      if (!dbProd.active) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Produto indisponível: ${item.title}` }),
        };
      }

      // Substituir o preço enviado pelo preço correto cadastrado no banco
      const dbPrice = parseFloat(dbProd.price);
      item.unit_price = dbPrice;
      calculatedSubtotal += dbPrice * item.quantity;
    }

    // 3. Validar frete não-negativo
    const clientShippingCost = parseFloat(payload.shipments?.cost ?? 0);
    if (isNaN(clientShippingCost) || clientShippingCost < 0 || clientShippingCost > 600) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Opção de frete inválida." }),
      };
    }

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Erro na Netlify Function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro interno ao processar preferência de pagamento." }),
    };
  }
};
