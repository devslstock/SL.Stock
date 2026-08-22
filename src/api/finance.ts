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
      payment_method: order.forma_pagamento || 'Boleto',
      receipt_method_id: order.receipt_method_id || null
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

  // Excluir permanentemente contas por ID
  excluirContas: async (accountIds: string[]): Promise<void> => {
    const { error } = await supabase
      .from('accounts_receivable')
      .delete()
      .in('id', accountIds)

    if (error) throw error
  },

  // Reverter status do pedido de Faturado para Aprovado
  reverterFaturamentoPedido: async (salesOrderId: string): Promise<void> => {
    const { error } = await supabase
      .from('sales_orders')
      .update({ status: 'Aprovado' })
      .eq('id', salesOrderId)

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

    let query = supabase
      .from('accounts_receivable')
      .select('id')
      .eq('customer_id', customerId)
      .eq('status', 'vencido')
      
    if (userRecord.company_id) {
      query = query.eq('company_id', userRecord.company_id)
    }

    const { data, error } = await query.limit(1)

    if (error) throw error
    return data && data.length > 0
  },

  getCustomerDebt: async (customerId: string): Promise<number> => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return 0

    const { data: userRecord } = await supabase
      .from('users')
      .select('company_id')
      .eq('auth_user_id', userData.user.id)
      .single()

    if (!userRecord) return 0

    let query = supabase
      .from('accounts_receivable')
      .select('installment_value')
      .eq('customer_id', customerId)
      .not('status', 'eq', 'pago')
      .not('status', 'eq', 'cancelado')

    if (userRecord.company_id) {
      query = query.eq('company_id', userRecord.company_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching customer debt:', error)
      return 0
    }
    
    return data ? data.reduce((acc, curr) => acc + (curr.installment_value || 0), 0) : 0
  }
}
