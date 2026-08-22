// Baseado em referências públicas de terceiros sobre a API de Cobrança Bancária do Sicoob (v2/v3) —
// o portal oficial (developers.sicoob.com.br) é uma SPA que não expõe conteúdo pra leitura automatizada.
// Validar contra uma chamada sandbox real assim que houver certificado/credencial de teste: URL de
// autenticação, scopes e nomes de campos do payload podem precisar de ajuste.
//
// Roda como função Node no Vercel (não Supabase Edge Function) porque a API do Sicoob exige mTLS
// (certificado cliente na própria conexão TLS) e o runtime de Edge Function da Supabase (Deno Deploy)
// não suporta Deno.createHttpClient — mTLS só é viável aqui, com https.Agent do Node.
import { createClient } from '@supabase/supabase-js'
import https from 'node:https'

function httpsRequestJson(url: string, options: https.RequestOptions, body?: string): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let raw = ''
      res.on('data', (chunk) => { raw += chunk })
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 0, data: raw ? JSON.parse(raw) : {} })
        } catch {
          resolve({ status: res.statusCode || 0, data: { raw } })
        }
      })
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ success: false, error: 'Falta configuração do Supabase no backend.' })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const authHeader = req.headers.authorization
    if (!authHeader) return res.status(401).json({ success: false, error: 'Missing Authorization header' })
    const jwt = authHeader.replace('Bearer ', '')

    const { data: { user: callerUser }, error: userError } = await supabase.auth.getUser(jwt)
    if (userError || !callerUser) return res.status(401).json({ success: false, error: 'Unauthorized' })

    const { data: callerProfile } = await supabase
      .from('users')
      .select('company_id')
      .eq('auth_user_id', callerUser.id)
      .single()

    if (!callerProfile) return res.status(401).json({ success: false, error: 'Caller profile not found' })

    const { accountIds } = req.body
    if (!Array.isArray(accountIds) || accountIds.length === 0) {
      return res.status(400).json({ success: false, error: 'accountIds is required and must be a non-empty array' })
    }

    const { data: accounts, error: accountsError } = await supabase
      .from('accounts_receivable')
      .select('*, customer:customers(*), sales_order:sales_orders(order_number), receipt_method:receipt_methods(*)')
      .in('id', accountIds)
      .eq('company_id', callerProfile.company_id)

    if (accountsError || !accounts) {
      return res.status(500).json({ success: false, error: 'Erro ao buscar as contas a receber' })
    }

    const results: { accountId: string; success: boolean; bankSlipUrl?: string; error?: string }[] = []
    const tokenCache = new Map<string, string>()

    for (const account of accounts) {
      try {
        if (account.status === 'pago' || account.status === 'cancelado') {
          results.push({ accountId: account.id, success: false, error: `Parcela já está com status '${account.status}'` })
          continue
        }

        const rm = account.receipt_method
        if (!rm) {
          results.push({ accountId: account.id, success: false, error: 'Parcela sem forma de cobrança vinculada' })
          continue
        }
        if (!rm.sicoob_client_id || !rm.sicoob_certificate_pfx_base64) {
          results.push({ accountId: account.id, success: false, error: 'Forma de cobrança sem credenciais do Sicoob configuradas' })
          continue
        }
        if (!rm.agreement_code || !rm.portfolio || !rm.account_number) {
          results.push({ accountId: account.id, success: false, error: 'Forma de cobrança sem convênio/carteira/conta preenchidos' })
          continue
        }

        const customer = account.customer
        if (!customer) {
          results.push({ accountId: account.id, success: false, error: 'Cliente não encontrado' })
          continue
        }
        if (!customer.document || !customer.document_type) {
          results.push({ accountId: account.id, success: false, error: 'Cliente sem CPF/CNPJ cadastrado' })
          continue
        }

        const pfxBuffer = Buffer.from(rm.sicoob_certificate_pfx_base64, 'base64')
        const agent = new https.Agent({
          pfx: pfxBuffer,
          passphrase: rm.sicoob_certificate_password || undefined,
        })

        const isProducao = rm.remittance_environment === 'Produção'
        const authHost = isProducao ? 'auth.sicoob.com.br' : 'auth.sandbox.sicoob.com.br'
        const apiHost = isProducao ? 'api.sicoob.com.br' : 'api.sandbox.sicoob.com.br'

        let accessToken = tokenCache.get(rm.id)
        if (!accessToken) {
          const tokenBody = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: rm.sicoob_client_id,
            scope: 'boletos_inclusao boletos_consulta webhooks_boletos',
          }).toString()

          const tokenRes = await httpsRequestJson(
            `https://${authHost}/auth/realms/cooperado/protocol/openid-connect/token`,
            {
              method: 'POST',
              agent,
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(tokenBody),
              },
            },
            tokenBody
          )

          if (tokenRes.status !== 200 || !tokenRes.data.access_token) {
            results.push({ accountId: account.id, success: false, error: tokenRes.data.error_description || 'Erro ao autenticar com o Sicoob' })
            continue
          }
          accessToken = tokenRes.data.access_token
          tokenCache.set(rm.id, accessToken!)
        }

        const orderNumber = account.sales_order?.order_number || account.sales_order_id
        const nossoNumero = Number(account.id.replace(/\D/g, '').slice(0, 10) || '1')

        const payload = {
          numeroCliente: Number(rm.agreement_code),
          codigoModalidade: Number(rm.portfolio),
          numeroContaCorrente: Number(rm.account_number.replace(/\D/g, '')),
          codigoEspecieDocumento: 'DM',
          dataEmissao: new Date().toISOString().split('T')[0],
          nossoNumero,
          seuNumero: `${orderNumber}-${account.installment_number}`,
          identificacaoBoletoEmpresa: account.id,
          identificacaoEmissaoBoleto: 1,
          identificacaoDistribuicaoBoleto: 1,
          valor: Number(account.amount),
          dataVencimento: account.due_date,
          pagador: {
            numeroCpfCnpj: customer.document.replace(/\D/g, ''),
            nome: customer.legal_name || customer.fantasy_name || customer.nickname,
            endereco: customer.address || '',
            bairro: customer.neighborhood || '',
            cidade: customer.city || '',
            cep: (customer.cep || '').replace(/\D/g, ''),
            uf: customer.state || '',
          },
        }

        const boletoRes = await httpsRequestJson(
          `https://${apiHost}/cobranca-bancaria/v2/boletos`,
          {
            method: 'POST',
            agent,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
              'client_id': rm.sicoob_client_id,
            },
          },
          JSON.stringify(payload)
        )

        if (boletoRes.status < 200 || boletoRes.status >= 300) {
          const msg = boletoRes.data.mensagens?.[0]?.mensagem || boletoRes.data.message || 'Erro ao registrar boleto no Sicoob'
          results.push({ accountId: account.id, success: false, error: msg })
          continue
        }

        const resultado = boletoRes.data.resultado || boletoRes.data

        await supabase.from('accounts_receivable').update({
          status: 'boleto_emitido',
          bank_slip_url: resultado.linkImpressaoBoleto,
          bank_slip_digitable_line: resultado.linhaDigitavel,
          bank_slip_barcode: resultado.codigoBarras,
          gateway_provider: 'sicoob',
          updated_at: new Date().toISOString(),
        }).eq('id', account.id)

        results.push({ accountId: account.id, success: true, bankSlipUrl: resultado.linkImpressaoBoleto })
      } catch (itemError: any) {
        results.push({
          accountId: account.id,
          success: false,
          error: itemError instanceof Error ? itemError.message : 'Erro desconhecido ao emitir boleto',
        })
      }
    }

    return res.status(200).json({ success: true, results })
  } catch (error: any) {
    return res.status(200).json({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' })
  }
}
