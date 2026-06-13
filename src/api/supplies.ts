import { supabase } from '@/lib/supabase'
import type { Supply, SupplyRequest, EquipmentOrderSupply } from '@/types/database'
import { currentCompanyId } from '@/contexts/AuthContext'

export const suppliesApi = {
  // Supplies (Estoque Geral)
  async getSupplies() {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('supplies')
      .select('*')
      .eq('company_id', currentCompanyId)
      .order('name')
    if (error) throw error
    return data as Supply[]
  },

  async createSupply(supply: Omit<Supply, 'id' | 'created_at' | 'updated_at' | 'company_id'>) {
    if (!currentCompanyId) throw new Error('No company context')
    const { data, error } = await supabase
      .from('supplies')
      .insert([{ ...supply, company_id: currentCompanyId }])
      .select()
      .single()
    if (error) throw error
    return data as Supply
  },

  async updateSupply(id: string, updates: Partial<Supply>) {
    const { data, error } = await supabase
      .from('supplies')
      .update(updates)
      .eq('id', id)
      .eq('company_id', currentCompanyId)
      .select()
      .single()
    if (error) throw error
    return data as Supply
  },

  async deleteSupply(id: string) {
    const { error } = await supabase
      .from('supplies')
      .delete()
      .eq('id', id)
      .eq('company_id', currentCompanyId)
    if (error) throw error
    return true
  },

  // Supply Requests (Solicitações do Mecânico)
  async getSupplyRequests() {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('supply_requests')
      .select('*, mechanic:users!mechanic_id(name), supply:supplies(name, unit)')
      .eq('company_id', currentCompanyId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as SupplyRequest[]
  },

  async getMechanicSupplyRequests(mechanicId: string) {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('supply_requests')
      .select('*, supply:supplies(name, unit)')
      .eq('company_id', currentCompanyId)
      .eq('mechanic_id', mechanicId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as SupplyRequest[]
  },

  async createSupplyRequest(request: Omit<SupplyRequest, 'id' | 'created_at' | 'updated_at' | 'company_id' | 'status'>) {
    if (!currentCompanyId) throw new Error('No company context')
    const { data, error } = await supabase
      .from('supply_requests')
      .insert([{ ...request, company_id: currentCompanyId, status: 'pendente' }])
      .select()
      .single()
    if (error) throw error
    return data as SupplyRequest
  },

  async updateSupplyRequestStatus(id: string, status: 'aprovado' | 'rejeitado') {
    // Busca a request primeiro
    const { data: request, error: fetchError } = await supabase
      .from('supply_requests')
      .select('*')
      .eq('id', id)
      .eq('company_id', currentCompanyId)
      .single()
    
    if (fetchError) throw fetchError

    // Se for aprovado, abate do estoque principal
    if (status === 'aprovado' && request.status !== 'aprovado') {
      const { data: supply } = await supabase
        .from('supplies')
        .select('stock_quantity')
        .eq('id', request.supply_id)
        .single()
        
      if (supply) {
        await supabase
          .from('supplies')
          .update({ stock_quantity: supply.stock_quantity - request.quantity_requested })
          .eq('id', request.supply_id)
      }
    }

    const { data, error } = await supabase
      .from('supply_requests')
      .update({ status })
      .eq('id', id)
      .eq('company_id', currentCompanyId)
      .select()
      .single()
      
    if (error) throw error
    return data as SupplyRequest
  },

  // Consumo em OS
  async getOrderSupplies(orderId: string) {
    const { data, error } = await supabase
      .from('equipment_order_supplies')
      .select('*, supply:supplies(name, unit)')
      .eq('order_id', orderId)
    if (error) throw error
    return data as EquipmentOrderSupply[]
  },

  async consumeSupplyInOrder(orderId: string, supplyId: string, quantity: number) {
    // 1. Abater do estoque principal (assumindo que o mecânico pega do estoque geral na hora)
    const { data: supply } = await supabase
      .from('supplies')
      .select('stock_quantity')
      .eq('id', supplyId)
      .single()
      
    if (supply) {
      await supabase
        .from('supplies')
        .update({ stock_quantity: supply.stock_quantity - quantity })
        .eq('id', supplyId)
    }

    // 2. Registrar na OS
    const { data, error } = await supabase
      .from('equipment_order_supplies')
      .insert([{ order_id: orderId, supply_id: supplyId, quantity_consumed: quantity }])
      .select()
      .single()
      
    if (error) throw error
    return data as EquipmentOrderSupply
  }
}
