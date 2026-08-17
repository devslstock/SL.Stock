import { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const payload = req.body
    
    // O payload do webhook da Focus tem o seguinte formato:
    // { cnpj, evento, xml, ...outros_dados_do_documento }
    const { cnpj, evento, tipo, chave_nfe, status, versao } = payload
    
    if (!cnpj) {
      return res.status(400).json({ error: 'Payload inválido: CNPJ ausente' })
    }

    // Identifica qual a empresa deste CNPJ
    const { data: company, error: companyErr } = await supabase
      .from('companies')
      .select('id')
      .eq('cnpj', cnpj)
      .single()

    if (companyErr || !company) {
      console.error('Empresa não encontrada para CNPJ:', cnpj)
      return res.status(404).json({ error: 'Empresa não encontrada' })
    }

    const companyId = company.id

    // Registrar o evento genérico no banco (para histórico)
    await supabase.from('focus_nfe_sync_logs').insert([{
      company_id: companyId,
      operation: `WEBHOOK_${evento || tipo || 'UNKNOWN'}`,
      endpoint: '/api/webhook/focus',
      result: 'SUCCESS',
      http_status: 200,
      message: JSON.stringify(payload)
    }])

    // Se for NFe Emitida
    if (evento === 'nfe' || (payload.caminho_xml_nota_fiscal && !payload.nome_emitente)) {
      // Atualizar a nfe na tabela fiscal_notes
      const { data: fiscalNote } = await supabase
        .from('fiscal_notes')
        .select('id')
        .eq('focus_reference', payload.referencia || chave_nfe)
        .single()
        
      if (fiscalNote) {
        await supabase.from('fiscal_notes').update({
          status: status || payload.status,
          xml_url: payload.caminho_xml_nota_fiscal,
          pdf_url: payload.caminho_danfe,
          access_key: chave_nfe || payload.chave_nfe
        }).eq('id', fiscalNote.id)
      }
    }

    // Se for NFe Recebida
    if (evento === 'nfes_recebidas' || payload.nome_emitente) {
      // Atualizar a nfe_recebidas
      if (chave_nfe) {
        // Tenta fazer update
        const { data: existingNfe } = await supabase
          .from('nfe_recebidas')
          .select('id')
          .eq('company_id', companyId)
          .eq('chave_nfe', chave_nfe)
          .single()
          
        if (existingNfe) {
          await supabase.from('nfe_recebidas').update({
            situacao: status || payload.situacao,
            versao: versao || payload.versao,
            nfe_completa: payload.nfe_completa,
            manifestacao_destinatario: payload.manifestacao_destinatario
          }).eq('id', existingNfe.id)
        } else {
          // Inserir nova
          await supabase.from('nfe_recebidas').insert([{
            company_id: companyId,
            chave_nfe: chave_nfe,
            nome_emitente: payload.nome_emitente,
            documento_emitente: payload.documento_emitente,
            valor_total: parseFloat(payload.valor_total) || 0,
            data_emissao: payload.data_emissao,
            situacao: payload.situacao,
            manifestacao_destinatario: payload.manifestacao_destinatario,
            nfe_completa: payload.nfe_completa,
            versao: payload.versao
          }])
        }
      }
    }

    return res.status(200).json({ success: true })
  } catch (err: any) {
    console.error('Erro no webhook Focus:', err)
    return res.status(500).json({ error: 'Erro interno', details: err.message })
  }
}
