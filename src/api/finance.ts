import { supabase } from '../lib/supabase'
import type { AccountReceivable, BankIntegration } from '../types/database'
import { parsePaymentCondition } from '../utils/paymentParser'

export const financeApi = {
  // Buscar todas as contas a receber
  getAccountsReceivable: async (): Promise<AccountReceivable[]> => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('Not authenticated')

    const { data: userRecord } = await supabase
      .from('users')
      .select('company_id')
      .eq('auth_user_id', userData.user.id)
      .single()

    if (!userRecord) throw new Error('User not found')

    const { data, error } = await supabase
      .from('accounts_receivable')
      .select(`
        *,
        customer:customers(*),
        sales_order:sales_orders(*, nfe:nfe_records(*))
      `)
      .eq('company_id', userRecord.company_id)
      .order('due_date', { ascending: true })

    if (error) throw error
    return data
  },

  // Buscar contas a receber vinculadas a um pedido específico
  getContasPorPedido: async (salesOrderId: string): Promise<AccountReceivable[]> => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('Not authenticated')

    const { data: userRecord } = await supabase
      .from('users')
      .select('company_id')
      .eq('auth_user_id', userData.user.id)
      .single()

    if (!userRecord) throw new Error('User not found')

    const { data, error } = await supabase
      .from('accounts_receivable')
      .select('*')
      .eq('company_id', userRecord.company_id)
      .eq('sales_order_id', salesOrderId)
      .order('installment_number', { ascending: true })

    if (error) throw error
    return data
  },

  // Faturar um pedido e gerar parcelas (Idempotente)
  faturarPedido: async (salesOrderId: string): Promise<AccountReceivable[]> => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('Not authenticated')

    const { data: userRecord } = await supabase
      .from('users')
      .select('company_id')
      .eq('auth_user_id', userData.user.id)
      .single()

    if (!userRecord) throw new Error('User not found')
    
    // 1. Validar pedido e recuperar NF
    const { data: order, error: orderError } = await supabase
      .from('sales_orders')
      .select('*, payment_condition:payment_conditions(*), nfe:nfe_records(*)')
      .eq('id', salesOrderId)
      .single()

    if (orderError || !order) {
      throw new Error('Pedido não encontrado')
    }

    const nfeList = order.nfe as any[]
    const isNfeEmitida = nfeList && nfeList.length > 0 && nfeList[0].status === 'Emitida'

    if (!isNfeEmitida) {
      throw new Error('Pedido não pode ser faturado. É necessário emitir e autorizar a Nota Fiscal primeiro.')
    }
    if (order.status === 'Faturado') throw new Error('Este pedido já foi faturado')
    
    // 2. Checar se já existem contas a receber (proteção extra de idempotência)
    const { data: existingAccounts } = await supabase
      .from('accounts_receivable')
      .select('id')
      .eq('sales_order_id', salesOrderId)
      
    if (existingAccounts && existingAccounts.length > 0) {
      throw new Error('Já existem cobranças vinculadas a este pedido')
    }

    // 3. Preparar parcelas com base na condição de pagamento editada ou original
    const conditionStr = order.custom_payment_condition || order.payment_condition?.name || ''
    const intervalDays = order.payment_condition?.interval_days || 30
    const totalAmount = Number(order.total_amount)
    const baseDate = order.created_at ? new Date(order.created_at) : new Date()
    
    const parsed = parsePaymentCondition(conditionStr, intervalDays, baseDate, totalAmount)

    if (!parsed.isValid) {
      throw new Error(`Condição de pagamento inválida: ${parsed.error}`)
    }
    
    const newAccounts = parsed.installments.map(inst => ({
      id: crypto.randomUUID(),
      company_id: userRecord.company_id,
      customer_id: order.customer_id,
      sales_order_id: order.id,
      installment_number: inst.installmentNumber,
      amount: inst.amount,
      due_date: inst.dueDate.toISOString().split('T')[0],
      status: 'pendente',
      payment_method: 'boleto' // Mock, no futuro buscar da order
    }))
    
    // 4. Inserir contas a receber
    const { data: createdAccounts, error: insertError } = await supabase
      .from('accounts_receivable')
      .insert(newAccounts)
      .select()
      
    if (insertError) throw insertError
    
    // 5. Atualizar status do pedido para Faturado
    const { error: updateOrderError } = await supabase
      .from('sales_orders')
      .update({ status: 'Faturado' })
      .eq('id', salesOrderId)
      
    if (updateOrderError) throw updateOrderError
    
    return createdAccounts as AccountReceivable[]
  },

  // Dar baixa manual
  baixarConta: async (accountId: string, paidAmount: number): Promise<void> => {
    const { error } = await supabase
      .from('accounts_receivable')
      .update({ 
        status: 'pago', 
        paid_amount: paidAmount, 
        paid_at: new Date().toISOString() 
      })
      .eq('id', accountId)

    if (error) throw error
  },

  // Cancelar conta
  cancelarConta: async (accountId: string): Promise<void> => {
    const { error } = await supabase
      .from('accounts_receivable')
      .update({ status: 'cancelado' })
      .eq('id', accountId)

    if (error) throw error
  },

  // Dar baixa em massa (assume valor integral)
  batchBaixarContas: async (accountIds: string[]): Promise<void> => {
    // Como precisamos do amount para salvar o paid_amount de cada um,
    // faremos a baixa iterando sobre cada conta
    const { data: accounts } = await supabase
      .from('accounts_receivable')
      .select('id, amount')
      .in('id', accountIds)
      
    if (!accounts) return

    const promises = accounts.map(acc => 
      supabase.from('accounts_receivable').update({
        status: 'pago',
        paid_amount: acc.amount,
        paid_at: new Date().toISOString()
      }).eq('id', acc.id)
    )
    
    await Promise.all(promises)
  },

  // Cancelar em massa
  batchCancelarContas: async (accountIds: string[]): Promise<void> => {
    const { error } = await supabase
      .from('accounts_receivable')
      .update({ status: 'cancelado' })
      .in('id', accountIds)

    if (error) throw error
  },

  // Excluir permanentemente contas de um pedido
  excluirContasDoPedido: async (salesOrderId: string): Promise<void> => {
    const { error } = await supabase
      .from('accounts_receivable')
      .delete()
      .eq('sales_order_id', salesOrderId)
      
    if (error) throw error
  },

  // Checar inadimplência
  hasOverduePayments: async (customerId: string): Promise<boolean> => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('Not authenticated')

    const { data: userRecord } = await supabase
      .from('users')
      .select('company_id')
      .eq('auth_user_id', userData.user.id)
      .single()

    if (!userRecord) throw new Error('User not found')

    const { data, error } = await supabase
      .from('accounts_receivable')
      .select('id')
      .eq('company_id', userRecord.company_id)
      .eq('customer_id', customerId)
      .eq('status', 'vencido')
      .limit(1)

    if (error) throw error
    return data && data.length > 0
  }
}
