// Mock da lógica exata da função emit-nfe para podermos testar unitariamente
function calculateFiscalTags(item, fiscalOp, isSimplesNacional) {
  const itemPayload = {
    valor_bruto: item.total_price,
  };

  if (isSimplesNacional) {
    const itemCsosn = item.product.csosn || fiscalOp.csosn || "102";
    itemPayload.icms_situacao_tributaria = itemCsosn;
    
    if (itemCsosn === "101") {
      const icmsRate = item.product.icms_rate || 0;
      if (icmsRate > 0) {
        itemPayload.icms_percentual_credito = icmsRate;
        itemPayload.icms_valor_credito = parseFloat(((item.total_price * icmsRate) / 100).toFixed(2));
      }
    }
  } else {
    itemPayload.icms_situacao_tributaria = fiscalOp.cst || "00";
  }

  return itemPayload;
}

function assertEquals(actual, expected) {
  if (actual !== expected) {
    throw new Error(`Expected ${expected} but got ${actual}`);
  }
}

try {
  console.log("Executando TESTE 3 e 4 - CSOSN 101 com alíquota de 3.21%...");
  const item1 = {
    total_price: 306.54,
    product: {
      csosn: "101",
      icms_rate: 3.21
    }
  };
  const fiscalOp1 = { csosn: "102" };
  const payload1 = calculateFiscalTags(item1, fiscalOp1, true);
  
  assertEquals(payload1.icms_situacao_tributaria, "101");
  assertEquals(payload1.icms_percentual_credito, 3.21);
  assertEquals(payload1.icms_valor_credito, 9.84);
  console.log("OK!");

  console.log("Executando TESTE 5 - Consistência (Alíquota zero não deve gerar erro)...");
  const item2 = {
    total_price: 100.00,
    product: {
      csosn: "101",
      icms_rate: 0
    }
  };
  const payload2 = calculateFiscalTags(item2, fiscalOp1, true);
  assertEquals(payload2.icms_situacao_tributaria, "101");
  assertEquals(payload2.icms_percentual_credito, undefined);
  assertEquals(payload2.icms_valor_credito, undefined);
  console.log("OK!");

  console.log("Executando TESTE 8 - Produto antigo (Sem tags fiscais)...");
  const item3 = {
    total_price: 50.00,
    product: {}
  };
  const payload3 = calculateFiscalTags(item3, fiscalOp1, true);
  assertEquals(payload3.icms_situacao_tributaria, "102");
  assertEquals(payload3.icms_percentual_credito, undefined);
  console.log("OK!");

  console.log("TODOS OS TESTES PASSARAM COM SUCESSO!");
} catch(e) {
  console.error("FALHA NO TESTE:", e.message);
}
