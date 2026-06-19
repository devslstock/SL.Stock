import { supabase } from '@/lib/supabase'
import type { Equipment, EquipmentOrder, EquipmentHistory } from '@/types/database'

export const equipmentsApi = {
  // Equipments
  async getEquipments() {
        const { data, error } = await supabase
      .from('equipments')
      .select('*, customer:customers(legal_name, nickname, fantasy_name, document)')
      
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Equipment[]
  },

  async getEquipment(id: string) {
        const { data, error } = await supabase
      .from('equipments')
      .select('*, customer:customers(legal_name, nickname, fantasy_name, document)')
      .eq('id', id)
      
      .single()
    if (error) throw error
    return data as Equipment
  },

  async createEquipment(equipmentData: Partial<Equipment>) {
        const { data, error } = await supabase
      .from('equipments')
      .insert([{ ...equipmentData}])
      .select()
      .single()
    if (error) throw error

    await this.createHistory(data.id, 'Cadastrado no Sistema', null)

    return data as Equipment
  },

  async updateEquipment(id: string, updates: Partial<Equipment>, historyNote?: string) {
    const { data, error } = await supabase
      .from('equipments')
      .update(updates)
      .eq('id', id)
      
      .select()
      .single()
    if (error) throw error

    if (historyNote) {
      await this.createHistory(id, historyNote, updates.current_customer_id)
    }

    return data as Equipment
  },

  async deleteEquipment(id: string) {
    const { error } = await supabase
      .from('equipments')
      .delete()
      .eq('id', id)
      
    if (error) throw error
    return true
  },

  // Orders (OS)
  async getOrders() {
        const { data, error } = await supabase
      .from('equipment_orders')
      .select('*, customer:customers(legal_name, nickname, fantasy_name, address, number, neighborhood, city, state, document), equipment:equipments(patrimony, type, model), driver:users(name)')
      
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as EquipmentOrder[]
  },

  async getDriverOrders(driverId: string) {
        const { data, error } = await supabase
      .from('equipment_orders')
      .select('*, customer:customers(legal_name, nickname, fantasy_name, address, number, neighborhood, city, state, document), equipment:equipments(patrimony, type, model)')
      
      .eq('driver_id', driverId)
      .in('status', ['pendente', 'em_rota'])
      .order('scheduled_date', { ascending: true })
    if (error) throw error
    return data as EquipmentOrder[]
  },

  async getRouteOrders(routeId: string) {
    const { data, error } = await supabase
      .from('equipment_orders')
      .select('*, customer:customers(legal_name, nickname, fantasy_name, address, number, neighborhood, city, state, document), equipment:equipments(patrimony, type, model)')
      .eq('delivery_route_id', routeId)
      .order('delivery_sequence', { ascending: true })
    if (error) throw error
    return data as EquipmentOrder[]
  },

  async createOrder(orderData: Partial<EquipmentOrder>) {
        const { data, error } = await supabase
      .from('equipment_orders')
      .insert([{ ...orderData}])
      .select()
      .single()
    if (error) throw error
    return data as EquipmentOrder
  },

  async updateOrder(id: string, updates: Partial<EquipmentOrder>) {
    const { data, error } = await supabase
      .from('equipment_orders')
      .update(updates)
      .eq('id', id)
      
      .select()
      .single()
    if (error) throw error

    if (data && data.delivery_route_id && updates.status) {
      const { deliveriesApi } = await import('./deliveries');
      await deliveriesApi.recalculateRouteStatus(data.delivery_route_id);
    }

    return data as EquipmentOrder
  },

  async deleteOrder(id: string) {
    const { error } = await supabase
      .from('equipment_orders')
      .delete()
      .eq('id', id)
      
    if (error) throw error
    return true
  },

  // History
  async createHistory(equipmentId: string, action: string, customerId?: string | null, notes?: string) {
    
    const { error } = await supabase
      .from('equipment_history')
      .insert([{
        equipment_id: equipmentId,
        customer_id: customerId || null,
        action,
        notes,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
    if (error) console.error('Failed to create history', error)
  },

  async getEquipmentHistory(equipmentId: string) {
        const { data, error } = await supabase
      .from('equipment_history')
      .select('*, customer:customers(legal_name, nickname, fantasy_name), user:users(name)')
      .eq('equipment_id', equipmentId)
      
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as EquipmentHistory[]
  },

  async getCustomerEquipmentsHistory(customerId: string) {
    const { data, error } = await supabase
      .from('equipment_history')
      .select('*, equipment:equipments(patrimony, type, model), user:users(name)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as EquipmentHistory[]
  },

  async getCustomerOrders(customerId: string) {
    const { data, error } = await supabase
      .from('equipment_orders')
      .select('*, equipment:equipments(patrimony, type, model), driver:users(name)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as EquipmentOrder[]
  },

  async getEquipmentOrders(equipmentId: string) {
    const { data, error } = await supabase
      .from('equipment_orders')
      .select('*, customer:customers(legal_name, nickname, fantasy_name), driver:users(name), supplies:equipment_order_supplies(quantity_consumed, supply:supplies(name, unit))')
      .eq('equipment_id', equipmentId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as any[]
  },

  async getOrderSupplies(orderId: string) {
    const { data, error } = await supabase
      .from('equipment_order_supplies')
      .select('*, supply:supplies(name, unit)')
      .eq('order_id', orderId)
    if (error) throw error
    return data as any[]
  },

  async getCustomerEquipments(customerId: string) {
        const { data, error } = await supabase
      .from('equipments')
      .select('*')
      .eq('current_customer_id', customerId)
      
    if (error) throw error
    return data as Equipment[]
  }
}
