import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, token, companyId, isDryRun, certificateBase64, certificatePassword } = req.body

  // Always use provided token in test, or fallback to env for sync
  const focusToken = token || process.env.FOCUS_NFE_TOKEN

  if (!focusToken) {
    return res.status(401).json({ error: 'Token da Focus NFe ausente. Configure a variável de ambiente FOCUS_NFE_TOKEN ou passe o token na requisição.' })
  }

  // Supabase admin client for backend DB operations
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Need service role to bypass RLS in backend if needed
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Falta configuração do Supabase no backend (VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY).' })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Auth Header
  const authHeader = `Basic ${Buffer.from(`${focusToken}:`).toString('base64')}`

  try {
    // 1. TEST CONNECTION
    if (action === 'TEST_CONNECTION') {
      const focusUrl = `https://api.focusnfe.com.br/v2/empresas/00000000000000` // Testing with a fake CNPJ to see if we get 404 (Auth OK) or 401 (Auth Failed)
      const response = await fetch(focusUrl, {
        method: 'GET',
        headers: { 'Authorization': authHeader, 'Accept': 'application/json' }
      })
      
      const data = await response.json().catch(() => ({}))
      
      if (response.status === 401 || response.status === 403) {
        return res.status(401).json({ error: 'Acesso não autorizado. Verifique o Token Principal.' })
      }
      
      return res.status(200).json({ success: true, message: 'Conexão bem sucedida.' })
    }

    // 2. SYNC COMPANY
    if (action === 'SYNC_COMPANY') {
      if (!companyId) return res.status(400).json({ error: 'companyId obrigatório' })
      
      // Get global settings to check env (homologacao vs producao)
      const { data: settings } = await supabase.from('focus_nfe_settings').select('*').limit(1).single()
      // Fetch company
      const baseUrl = 'https://api.focusnfe.com.br'
      const { data: company, error: companyErr } = await supabase.from('companies').select('*').eq('id', companyId).single()
      if (companyErr || !company) return res.status(404).json({ error: 'Empresa não encontrada' })

      const isHomologacao = company.focusnfe_env === 'homologacao' || !company.focusnfe_env;

      if (!company.cnpj) {
        return res.status(400).json({ error: 'Empresa não possui CNPJ. Não é possível sincronizar.' })
      }

      // Check if it already exists in Focus NFe by CNPJ
      const cnpjNumeros = company.cnpj.replace(/\D/g, '')
      let method = 'POST'
      let endpoint = `/v2/empresas`
      let existingId = company.focus_nfe_empresa_id

      const getRes = await fetch(`${baseUrl}/v2/empresas?cnpj=${cnpjNumeros}`, {
        method: 'GET',
        headers: { 'Authorization': authHeader, 'Accept': 'application/json' }
      })

      if (getRes.status === 200) {
        const existingFocusData = await getRes.json()
        if (Array.isArray(existingFocusData) && existingFocusData.length > 0) {
          existingId = existingFocusData[0].id
          method = 'PUT'
          endpoint = `/v2/empresas/${existingId}`
        } else if (existingFocusData && existingFocusData.id) {
          existingId = existingFocusData.id
          method = 'PUT'
          endpoint = `/v2/empresas/${existingId}`
        }
      }

      // Build payload
      const payload: any = {
        nome: company.name,
        nome_fantasia: company.fantasy_name || company.name,
        cnpj: cnpjNumeros,
        // Inscrição estadual/municipal não temos mapeados explicitamente no model atual, passaremos vazios se não tivermos
        regime_tributario: company.tax_regime === 'simples_nacional' ? 1 : company.tax_regime === 'regime_normal' ? 3 : 1,
        email: company.email || 'nao-informado@teste.com',
        telefone: (company.phone || '').replace(/\D/g, '') || '11999999999',
        logradouro: company.garage_street || 'Não Informado',
        numero: company.garage_number || 'S/N',
        complemento: company.garage_complement || '',
        bairro: company.garage_neighborhood || 'Centro',
        municipio: company.garage_city || 'São Paulo',
        uf: company.garage_state || 'SP',
        cep: (company.garage_cep || '').replace(/\D/g, '') || '01000000',
        
        // Habilitações globais
        enviar_email_destinatario: true,
        habilita_nfe: settings?.enable_nfe || false,
        habilita_nfce: settings?.enable_nfce || false,
        habilita_nfse: settings?.enable_nfse || false,
        recebe_nfe: settings?.enable_receive_nfe || false,
        recebe_cte: settings?.enable_receive_cte || false
      }

      // Tratamento da logo para a NF-e
      if (company.exibir_logo_nf && company.logo_url) {
        // Remover prefixo do data URL (ex: "data:image/png;base64,")
        const base64Data = company.logo_url.replace(/^data:image\/[a-z]+;base64,/, '')
        payload.arquivo_logo_base64 = base64Data
      } else {
        payload.delete_logo = true // Forçar remoção caso tenha sido desativado
      }

      if (certificateBase64) {
        payload.arquivo_certificado_base64 = certificateBase64
        payload.senha_certificado = certificatePassword
      }

      // NOTE: `dry_run` param is for NF-e emission endpoints, not for companies.
      // The environment for companies is dictated purely by the provided Token.

      const syncRes = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const syncData = await syncRes.json().catch(() => ({}))
      
      // LOG IT
      await supabase.from('focus_nfe_sync_logs').insert([{
        company_id: companyId,
        operation: isDryRun ? 'TEST' : (method === 'POST' ? 'CREATE' : 'UPDATE'),
        endpoint: endpoint,
        result: syncRes.ok ? 'SUCCESS' : 'ERROR',
        http_status: syncRes.status,
        message: syncRes.ok ? 'Sincronizado com sucesso' : (syncData.mensagem || JSON.stringify(syncData.erros || syncData)),
      }])

      if (!syncRes.ok) {
        const errorMsg = syncData.mensagem || JSON.stringify(syncData.erros || syncData)
        let friendlyMsg = errorMsg
        if (syncRes.status === 401) friendlyMsg = 'Acesso não autorizado na Focus NFe.'
        else if (errorMsg.toLowerCase().includes('certificado')) friendlyMsg = 'Erro no Certificado Digital: ' + errorMsg
        
        await supabase.from('companies').update({
          focus_nfe_status: 'ERRO',
          focus_nfe_last_error: friendlyMsg,
          focus_nfe_sync_status: 'Erro na sincronização',
          focus_nfe_updated_at: new Date().toISOString()
        }).eq('id', companyId)

        return res.status(400).json({ error: friendlyMsg, details: syncData })
      }

      if (!isDryRun) {
        await supabase.from('companies').update({
          focus_nfe_empresa_id: existingId || syncData.id,
          focusnfe_token: isHomologacao ? syncData.token_homologacao : syncData.token_producao,
          focus_nfe_status: 'SINCRONIZADA',
          focus_nfe_last_error: null,
          focus_nfe_sync_status: 'OK',
          focus_nfe_last_sync: new Date().toISOString(),
          focus_nfe_updated_at: new Date().toISOString(),
          focus_nfe_cert_expires_at: syncData.data_validade_certificado ? new Date(syncData.data_validade_certificado).toISOString() : null,
          ...(method === 'POST' ? { focus_nfe_created_at: new Date().toISOString() } : {})
        }).eq('id', companyId)
      }

      return res.status(200).json({ success: true, data: syncData })
    }

    if (action === 'GET_BACKUPS') {
      const { companyId } = req.body
      if (!companyId) return res.status(400).json({ error: 'companyId ausente' })

      const { data: company, error: companyErr } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single()
      
      if (companyErr || !company) return res.status(400).json({ error: 'Empresa não encontrada' })
      if (!company.cnpj) return res.status(400).json({ error: 'Empresa sem CNPJ cadastrado' })

      const cnpjNumeros = company.cnpj.replace(/\D/g, '')
      const getRes = await fetch(`${baseUrl}/v2/backups/${cnpjNumeros}.json`, {
        method: 'GET',
        headers: { 'Authorization': authHeader, 'Accept': 'application/json' }
      })

      const responseData = await getRes.json()

      if (!getRes.ok) {
        return res.status(getRes.status).json({ error: responseData.mensagem || 'Erro ao buscar backups' })
      }

      return res.status(200).json({ success: true, data: responseData })
    }

    // 5. GET NFES RECEBIDAS
    if (action === 'GET_NFES_RECEBIDAS') {
      const { cnpj, versao, pendente } = req.body
      if (!cnpj) return res.status(400).json({ error: 'CNPJ obrigatório' })
      
      const baseUrl = 'https://api.focusnfe.com.br'
      let queryParams = `?cnpj=${cnpj}`
      if (versao !== undefined) queryParams += `&versao=${versao}`
      if (pendente) queryParams += `&pendente=1`

      const getRes = await fetch(`${baseUrl}/v2/nfes_recebidas${queryParams}`, {
        method: 'GET',
        headers: { 'Authorization': authHeader, 'Accept': 'application/json' }
      })

      const responseData = await getRes.json().catch(() => ({}))
      
      if (!getRes.ok) {
        return res.status(getRes.status).json({ error: responseData.mensagem || 'Erro ao buscar notas recebidas' })
      }

      // We should also pass max_version down so frontend can store it
      const maxVersion = getRes.headers.get('X-Max-Version')
      
      return res.status(200).json({ success: true, data: responseData, max_version: maxVersion ? parseInt(maxVersion) : undefined })
    }

    // 6. MANIFESTAR NFE
    if (action === 'MANIFESTAR_NFE') {
      const { chave, manifestacao, justificativa } = req.body
      if (!chave || !manifestacao) return res.status(400).json({ error: 'Chave e manifestação obrigatórios' })
      
      const baseUrl = 'https://api.focusnfe.com.br'
      const payload: any = { manifestacao }
      if (justificativa) payload.justificativa = justificativa

      const postRes = await fetch(`${baseUrl}/v2/nfes_recebidas/${chave}/manifesto`, {
        method: 'POST',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const responseData = await postRes.json().catch(() => ({}))
      
      if (!postRes.ok) {
        return res.status(postRes.status).json({ error: responseData.mensagem || 'Erro ao manifestar nota' })
      }

      return res.status(200).json({ success: true, data: responseData })
    }

    // 7. BAIXAR XML NFE
    if (action === 'BAIXAR_XML_NFE') {
      const { chave } = req.body
      if (!chave) return res.status(400).json({ error: 'Chave obrigatória' })
      
      const baseUrl = 'https://api.focusnfe.com.br'
      const getRes = await fetch(`${baseUrl}/v2/nfes_recebidas/${chave}.xml`, {
        method: 'GET',
        headers: { 'Authorization': authHeader, 'Accept': 'application/xml, text/xml, */*' }
      })

      if (!getRes.ok) {
        const errorText = await getRes.text()
        return res.status(getRes.status).json({ error: 'Erro ao baixar XML', details: errorText })
      }

      const xmlText = await getRes.text()
      return res.status(200).json({ success: true, xml: xmlText })
    }

    // 8. INUTILIZAR NUMERACAO
    if (action === 'INUTILIZAR_NFE') {
      const { cnpj, serie, numero_inicial, numero_final, justificativa } = req.body
      if (!cnpj || !serie || !numero_inicial || !numero_final || !justificativa) {
        return res.status(400).json({ error: 'Dados insuficientes para inutilização' })
      }
      
      const baseUrl = 'https://api.focusnfe.com.br'
      const payload = {
        cnpj,
        serie,
        numero_inicial,
        numero_final,
        justificativa
      }

      const postRes = await fetch(`${baseUrl}/v2/nfe/inutilizacao`, {
        method: 'POST',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const responseData = await postRes.json().catch(() => ({}))
      
      if (!postRes.ok) {
        return res.status(postRes.status).json({ error: responseData.mensagem || 'Erro ao inutilizar numeração', detalhes: responseData })
      }

      return res.status(200).json({ success: true, data: responseData })
    }

    // 9. CRIAR WEBHOOK
    if (action === 'CRIAR_WEBHOOK') {
      const { cnpj } = req.body
      if (!cnpj) return res.status(400).json({ error: 'CNPJ obrigatório' })
      
      const baseUrl = 'https://api.focusnfe.com.br'
      
      // We will register a webhook for multiple events: NFe, NFe Recebidas
      // The exact URL would normally be determined by process.env.PUBLIC_URL or req.headers.host
      // Because we are on vercel, we can infer it or assume a known env var.
      const host = req.headers.host || 'slstock.com'
      const protocol = host.includes('localhost') ? 'http' : 'https'
      const webhookUrl = `${protocol}://${host}/api/webhook/focus`

      const events = ['nfe', 'nfes_recebidas']
      const results = []

      for (const event of events) {
        const payload = {
          cnpj,
          event,
          url: webhookUrl
        }

        const postRes = await fetch(`${baseUrl}/v2/hooks`, {
          method: 'POST',
          headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        const data = await postRes.json().catch(() => ({}))
        results.push({ event, status: postRes.status, data })
      }

      return res.status(200).json({ success: true, results })
    }

    return res.status(400).json({ error: 'Ação inválida' })

  } catch (error: any) {
    console.error('[FocusNFe Service] Erro interno:', error)
    return res.status(500).json({ error: 'Erro interno no backend', details: error.message })
  }
}
