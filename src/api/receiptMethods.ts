import { supabase } from '../lib/supabase'
import type { ReceiptMethod } from '../types/database'

export const receiptMethodsApi = {
  getReceiptMethods: async (companyId: string) => {
    const { data, error } = await supabase
      .from('receipt_methods')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as ReceiptMethod[]
  },

  getReceiptMethod: async (id: string) => {
    const { data, error } = await supabase
      .from('receipt_methods')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as ReceiptMethod
  },

  createReceiptMethod: async (method: Omit<ReceiptMethod, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('receipt_methods')
      .insert([method])
      .select()
      .single()

    if (error) throw error
    return data as ReceiptMethod
  },

  updateReceiptMethod: async (id: string, updates: Partial<ReceiptMethod>) => {
    const { data, error } = await supabase
      .from('receipt_methods')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as ReceiptMethod
  },

  deleteReceiptMethod: async (id: string) => {
    const { error } = await supabase
      .from('receipt_methods')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
