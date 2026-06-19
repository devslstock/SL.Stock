import { supabase } from '@/lib/supabase'
import type { Customer } from '@/types/database'

export const customersApi = {
  async getCustomers() {
        const { data, error } = await supabase
      .from('customers')
      .select('*, region:region_id(*), sales_rep_obj:sales_rep_id(*), price_table:price_table_id(*)')
      
      .order('nickname', { ascending: true })
    if (error) throw error
    return data as Customer[]
  },

  async getCustomer(id: string) {
        const { data, error } = await supabase
      .from('customers')
      .select('*, equipments:customer_equipments(*), region:region_id(*), sales_rep_obj:sales_rep_id(*), price_table:price_table_id(*)')
      .eq('id', id)
      
      .single()
    if (error) throw error
    return data as Customer
  },

  async checkDocumentExists(document: string, excludeId?: string) {
    let query = supabase.from('customers').select('id').eq('document', document)
    if (excludeId) {
      query = query.neq('id', excludeId)
    }
    const { data, error } = await query.limit(1)
    if (error) throw error
    return data && data.length > 0
  },

  async createCustomer(customer: Partial<Customer>) {
        const { equipments, ...customerData } = customer
    
    // Sanitize empty strings to null for UUID foreign keys
    if (customerData.region_id === '') customerData.region_id = null
    if (customerData.price_table_id === '') customerData.price_table_id = null
    if (customerData.sales_rep_id === '') customerData.sales_rep_id = null

    const { data, error } = await supabase
      .from('customers')
      .insert([{ ...customerData}])
      .select()
      .single()
    if (error) throw error

    if (equipments && equipments.length > 0) {
      await supabase.from('customer_equipments').insert(
        equipments.map(eq => ({ ...eq, customer_id: data.id}))
      )
    }

    return data as Customer
  },

  async bulkCreateCustomers(customers: Partial<Customer>[]) {
    // We only insert/update customers, equipments are too complex for bulk right now
    const payload = customers.map(c => {
      const { equipments, ...rest } = c
      return { ...rest }
    })

    const { data: existingData, error: fetchError } = await supabase
      .from('customers')
      .select('id, document')
    if (fetchError) throw fetchError

    const existingMap = new Map(existingData.filter(c => c.document).map(c => [c.document, c.id]))

    const toInsert = []
    let updatedCount = 0

    for (const c of payload) {
      if (c.document && existingMap.has(c.document)) {
        // update
        const id = existingMap.get(c.document)
        await supabase.from('customers').update({ ...c, updated_at: new Date().toISOString() }).eq('id', id)
        updatedCount++
      } else {
        // insert
        toInsert.push(c)
      }
    }

    if (toInsert.length > 0) {
      const { error } = await supabase.from('customers').insert(toInsert)
      if (error) throw error
    }

    return [] as Customer[]
  },

  async updateCustomer(id: string, updates: Partial<Customer>) {
        const { equipments, ...customerData } = updates

    // Sanitize empty strings to null for UUID foreign keys
    if (customerData.region_id === '') customerData.region_id = null
    if (customerData.price_table_id === '') customerData.price_table_id = null
    if (customerData.sales_rep_id === '') customerData.sales_rep_id = null

    const { data, error } = await supabase
      .from('customers')
      .update({ ...customerData, updated_at: new Date().toISOString() })
      .eq('id', id)
      
      .select()
      .single()
    if (error) throw error

    if (equipments) {
      // Very simple sync: delete all and re-insert
      await supabase.from('customer_equipments').delete().eq('customer_id', id)
      if (equipments.length > 0) {
        await supabase.from('customer_equipments').insert(
          equipments.map(({ id: _id, created_at, updated_at, ...eq }) => ({ 
            ...eq, 
            customer_id: id}))
        )
      }
    }

    return data as Customer
  },

  async deleteCustomer(id: string) {
        const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
      
    if (error) throw error
    return true
  }
}
