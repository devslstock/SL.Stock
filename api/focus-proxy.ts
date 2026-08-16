
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const focusToken = process.env.FOCUS_NFE_TOKEN;
    
    if (!focusToken) {
      console.error('FOCUS_NFE_TOKEN não configurado no servidor.');
      return res.status(500).json({ error: 'Erro de configuração: Token da Focus NFe ausente no backend.' });
    }

    const targetPath = req.headers['x-focus-path'] || req.query.path;
    
    if (!targetPath) {
      return res.status(400).json({ error: 'Caminho de destino (path) não informado.' });
    }

    // Usamos sempre a URL de homologação para esta suíte de testes
    const focusBaseUrl = 'https://homologacao.focusnfe.com.br';
    const focusUrl = `${focusBaseUrl}${targetPath}`;
    
    // Auth Token Focus (Basic: base64(token:))
    const authHeader = `Basic ${Buffer.from(`${focusToken}:`).toString('base64')}`;
    
    const headers = {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const fetchOptions = {
      method: req.method,
      headers: headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    console.log(`[FocusNFe Proxy] ${req.method} ${focusUrl}`);
    
    const response = await fetch(focusUrl, fetchOptions);
    
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/pdf')) {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="danfe.pdf"');
      return res.status(response.status).send(buffer);
    } else if (contentType && contentType.includes('application/xml')) {
      data = await response.text();
      res.setHeader('Content-Type', 'application/xml');
      return res.status(response.status).send(data);
    } else {
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = text;
      }
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('[FocusNFe Proxy] Erro interno:', error);
    return res.status(500).json({ 
      mensagem: 'Falha de rede ou timeout ao conectar com a Focus NFe via Proxy.',
      error: error.message 
    });
  }
}
