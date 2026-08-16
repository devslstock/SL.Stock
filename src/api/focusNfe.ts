import { parseFocusError } from '@/utils/focusNfeError';

async function focusFetch(path: string, options: RequestInit = {}) {
  // Chamamos nosso backend serverless, que possui o token seguro
  const url = '/api/focus-proxy';
  
  const headers = new Headers(options.headers || {});
  headers.set('X-Focus-Path', path);
  
  if (!headers.has('Content-Type') && options.method !== 'GET' && options.method !== 'HEAD') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers });
  
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/pdf')) {
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro ao baixar PDF: ${errText}`);
    }
    return response.blob();
  }
  
  if (contentType && contentType.includes('application/xml')) {
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro ao baixar XML: ${errText}`);
    }
    return response.text();
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const docType = path.includes('/mdfe') ? 'mdfe' : path.includes('/nfe') ? 'nfe' : path.includes('/empresas') ? 'empresas' : 'auth';
    throw parseFocusError(data, response.status, path, docType as any);
  }

  return data;
}

export const focusNfeApi = {
  // ==========================================
  // FUNÇÕES DE TESTE E INTEGRAÇÃO
  // ==========================================

  /**
   * Verifica se a empresa (CNPJ) já está configurada
   */
  async checkCompany(cnpj: string) {
    // Focus aceita CNPJ apenas com numeros
    const cnpjNumeros = cnpj.replace(/\D/g, '');
    return focusFetch(`/v2/empresas/${cnpjNumeros}`, { method: 'GET' });
  },

  /**
   * NFE-001: Montagem de JSON Mockado para NF-e Homologação
   */
  buildNFeHomologationPayload(cnpjEmissor: string, ref: string) {
    return {
      natureza_operacao: 'Venda de mercadoria adquirida ou recebida de terceiros',
      data_emissao: new Date().toISOString(),
      tipo_documento: '1', // Saída
      local_destino: '1', // Operação interna
      finalidade_emissao: '1', // Normal
      consumidor_final: '1', // Sim
      presenca_comprador: '1', // Operação presencial
      cnpj_emitente: cnpjEmissor.replace(/\D/g, ''),
      nome_destinatario: 'NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL',
      cpf_destinatario: '00000000000',
      logradouro_destinatario: 'Rua Teste Homologacao',
      numero_destinatario: '123',
      bairro_destinatario: 'Centro',
      municipio_destinatario: 'São Paulo',
      uf_destinatario: 'SP',
      cep_destinatario: '01000000',
      indicador_inscricao_estadual_destinatario: '9', // Não contribuinte
      modalidade_frete: '9', // Sem frete
      items: [
        {
          numero_item: 1,
          codigo_produto: 'TESTE-01',
          descricao: 'Produto de Teste NFe Homologacao',
          cfop: '5102',
          unidade_comercial: 'UN',
          quantidade_comercial: 1,
          valor_unitario_comercial: 10.00,
          valor_bruto: 10.00,
          unidade_tributavel: 'UN',
          quantidade_tributavel: 1,
          valor_unitario_tributavel: 10.00,
          icms_origem: '0', // Nacional
          icms_situacao_tributaria: '102', // Simples Nacional
          pis_situacao_tributaria: '07', // Operação isenta
          cofins_situacao_tributaria: '07' // Operação isenta
        }
      ]
    };
  },

  /**
   * MDFE-001: Montagem de JSON Mockado para MDF-e Homologação
   */
  buildMDFeHomologationPayload(cnpjEmissor: string, ref: string) {
    return {
      cnpj_emitente: cnpjEmissor.replace(/\D/g, ''),
      tipo_emitente: '2', // Transportador de carga própria
      modelo_mdfe: '58',
      serie: '1',
      numero: '1',
      data_emissao: new Date().toISOString(),
      uf_inicio: 'SP',
      uf_fim: 'SP',
      modal_transporte: '1', // Rodoviário
      municipio_carregamento: [{ codigo_municipio_carregamento: '3550308', nome_municipio_carregamento: 'São Paulo' }],
      percurso: [],
      data_inicio_viagem: new Date().toISOString(),
      rntrc: '00000000', // Exigido para rodoviário, zero para teste próprio
      veiculo_tracao: {
        placa: 'ABC1234',
        renavam: '12345678901',
        tara: 1500,
        capacidade_kg: 5000,
        tipo_rodado: '01',
        tipo_carroceria: '00',
        uf_licenciamento: 'SP'
      },
      condutor: [
        {
          cpf: '00000000000',
          nome: 'Motorista Teste'
        }
      ],
      informacoes_adicionais: 'MDF-E EMITIDO EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL',
      municipio_descarregamento: [
        {
          codigo_municipio_descarregamento: '3550308',
          nome_municipio_descarregamento: 'São Paulo',
          nfe: [
            // Requer chave de NFe válida para atrelar, em testes reais precisamos de uma chave NFe
            // Como este é um teste mockado, colocamos uma chave de homologação fictícia se a SEFAZ não validar estrutura cruzada.
            // A Focus valida a estrutura da chave, então usamos uma chave com 44 caracteres numéricos (fake).
            { chave: '35230100000000000000550010000000011000000001' }
          ]
        }
      ]
    };
  },

  // ==========================================
  // OPERAÇÕES REAIS NFE
  // ==========================================

  async emitirNfe(ref: string, payload: any) {
    return focusFetch(`/v2/nfe?ref=${ref}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async consultarNfe(ref: string) {
    return focusFetch(`/v2/nfe/${ref}?completa=1`, { method: 'GET' });
  },

  async generateNFeDanfePreview(payload: any) {
    return focusFetch('/v2/nfe/danfe', {
      method: 'POST',
      body: JSON.stringify(payload)
    }); // Return Blob
  },

  async cancelarNfe(ref: string, justificativa: string) {
    return focusFetch(`/v2/nfe/${ref}`, {
      method: 'DELETE',
      body: JSON.stringify({ justificativa })
    });
  },

  // ==========================================
  // OPERAÇÕES REAIS MDFE
  // ==========================================

  async emitirMdfe(ref: string, payload: any) {
    return focusFetch(`/v2/mdfe?ref=${ref}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async consultarMdfe(ref: string) {
    return focusFetch(`/v2/mdfe/${ref}`, { method: 'GET' });
  },

  async cancelarMdfe(ref: string, justificativa: string) {
    return focusFetch(`/v2/mdfe/${ref}`, {
      method: 'DELETE',
      body: JSON.stringify({ justificativa })
    });
  },

  async encerrarMdfe(ref: string, uf: string, codigo_municipio: string) {
    return focusFetch(`/v2/mdfe/${ref}/encerrar`, {
      method: 'POST',
      body: JSON.stringify({
        uf,
        codigo_municipio,
        data_encerramento: new Date().toISOString()
      })
    });
  },

  // ==========================================
  // WEHBOOKS E XML STORAGE LOCAIS
  // ==========================================
  
  async testLocalWebhook(payload: any) {
    const url = '/api/webhooks/focus-nfe';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Falha no teste local do Webhook');
    return response.json();
  },

  async storeNFeXml(ref: string, xmlContent: string, tipo: 'nfe' | 'mdfe') {
    // MOCK: Em produção, salvaria no Supabase Storage.
    console.log(`[XML STORAGE MOCK] Armazenando XML de ${tipo} ref: ${ref}`);
    console.log(`[XML STORAGE MOCK] Conteudo truncado: ${xmlContent.substring(0, 100)}...`);
    return {
      status: 'sucesso',
      armazenamento: 'mock',
      path: `storage/fiscal/${tipo}/homologacao/${new Date().getFullYear()}/${new Date().getMonth()+1}/${ref}.xml`
    };
  }
};
