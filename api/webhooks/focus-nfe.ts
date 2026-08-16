export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Webhooks must be POST requests.' });
  }

  try {
    const payload = req.body;
    console.log('[Webhook Focus NFe] Payload recebido:', JSON.stringify(payload, null, 2));

    // Aqui salvaríamos o payload em uma tabela Supabase para processamento
    // No ambiente de testes, apenas validamos que chegou e retornamos 200
    
    // Identificação básica do documento
    const referencia = payload.ref || payload.referencia || 'Desconhecida';
    const tipo = payload.tipo_documento || payload.tipo || 'Desconhecido';
    const status = payload.status || 'Desconhecido';

    return res.status(200).json({ 
      mensagem: 'Webhook processado com sucesso (TESTE LOCAL)',
      documento: tipo,
      referencia: referencia,
      status: status
    });
  } catch (error) {
    console.error('[Webhook Focus NFe] Erro interno:', error);
    return res.status(500).json({ error: 'Internal Server Error no processamento do Webhook' });
  }
}
