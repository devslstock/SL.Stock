import { supabase } from '@/lib/supabase'
import type { Operation, OperationItem, OperationAlert } from '@/types/database'
import { currentCompanyId } from '@/contexts/AuthContext'

export const operationsApi = {
  async getOperations() {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('operations')
      .select('*')
      .eq('company_id', currentCompanyId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Operation[]
  },

  async getOperation(id: string) {
    if (!currentCompanyId) return null
    const { data, error } = await supabase
      .from('operations')
      .select('*')
      .eq('id', id)
      .eq('company_id', currentCompanyId)
      .single()
    if (error) throw error
    return data as Operation
  },

  async getOperationItems(operationId: string) {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('operation_items')
      .select('*')
      .eq('operation_id', operationId)
      .eq('company_id', currentCompanyId)
      .order('description')
    if (error) throw error
    return data as OperationItem[]
  },

  async updateOperationStatus(id: string, status: Operation['status'], completed_at?: string) {
    const updates: Partial<Operation> = { status }
    if (completed_at) updates.completed_at = completed_at

    const { data, error } = await supabase
      .from('operations')
      .update(updates)
      .eq('id', id)
      .eq('company_id', currentCompanyId)
      .select()
      .single()
    if (error) throw error
    return data as Operation
  },

  async updateItemQuantity(
    itemId: string, 
    quantity_scanned: number, 
    status: OperationItem['status'],
    extraUpdates?: Partial<Pick<OperationItem, 'physical_verification' | 'physical_divergence_found' | 'divergence_resolved'>>
  ) {
    const { data, error } = await supabase
      .from('operation_items')
      .update({ 
        quantity_scanned, 
        status,
        ...extraUpdates
      })
      .eq('id', itemId)
      .eq('company_id', currentCompanyId)
      .select()
      .single()
    if (error) throw error
    return data as OperationItem
  },

  async updateItemExpectedQty(itemId: string, quantity_expected: number) {
    const { data, error } = await supabase
      .from('operation_items')
      .update({ quantity_expected })
      .eq('id', itemId)
      .eq('company_id', currentCompanyId)
      .select()
      .single()
    if (error) throw error
    return data as OperationItem
  },

  async deleteOperationItem(itemId: string) {
    const { error } = await supabase
      .from('operation_items')
      .delete()
      .eq('id', itemId)
      .eq('company_id', currentCompanyId)
    if (error) throw error
    return true
  },

  async addOperationItem(operationId: string, item: Omit<OperationItem, 'id' | 'operation_id' | 'company_id'>) {
    const { data, error } = await supabase
      .from('operation_items')
      .insert([{ ...item, operation_id: operationId, company_id: currentCompanyId }])
      .select()
      .single()
    if (error) throw error
    return data as OperationItem
  },

  async createOperation(operation: Omit<Operation, 'id' | 'created_at' | 'company_id'>, items: Omit<OperationItem, 'id' | 'operation_id' | 'company_id'>[]) {
    if (!currentCompanyId) throw new Error('No company context')
    const { data: opData, error: opError } = await supabase
      .from('operations')
      .insert([{ ...operation, company_id: currentCompanyId }])
      .select()
      .single()
    
    if (opError) throw opError

    if (items.length > 0) {
      const itemsToInsert = items.map(item => ({
        ...item,
        operation_id: opData.id,
        company_id: currentCompanyId
      }))

      const { error: itemsError } = await supabase
        .from('operation_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError
    }

    return opData as Operation
  },

  async updateOperationFull(id: string, opData: Partial<Operation>, itemsData: Omit<OperationItem, 'id' | 'operation_id' | 'company_id'>[]) {
    const { error: opError } = await supabase
      .from('operations')
      .update(opData)
      .eq('id', id)
      .eq('company_id', currentCompanyId)
    if (opError) throw opError

    const { data: existingItems, error: existingError } = await supabase
      .from('operation_items')
      .select('*')
      .eq('operation_id', id)
      .eq('company_id', currentCompanyId)
    if (existingError) throw existingError

    const existingMap = new Map(existingItems.map(i => [i.product_code, i]))
    const newMap = new Map(itemsData.map(i => [i.product_code, i]))

    // Items to delete
    const toDelete = existingItems.filter(i => !newMap.has(i.product_code)).map(i => i.id)
    if (toDelete.length > 0) {
      await supabase.from('operation_items').delete().in('id', toDelete).eq('company_id', currentCompanyId)
    }

    // Items to update and insert
    const toInsert = []
    for (const newItem of itemsData) {
      const existing = existingMap.get(newItem.product_code)
      if (existing) {
        // Update expected quantity if changed
        if (existing.quantity_expected !== newItem.quantity_expected) {
          await supabase.from('operation_items').update({ quantity_expected: newItem.quantity_expected }).eq('id', existing.id).eq('company_id', currentCompanyId)
        }
      } else {
        toInsert.push({ ...newItem, operation_id: id, company_id: currentCompanyId })
      }
    }

    if (toInsert.length > 0) {
      await supabase.from('operation_items').insert(toInsert)
    }

    return true
  },

  async deleteOperation(id: string) {
    // 1. Obter a operação para verificar status e tipo
    const { data: op } = await supabase
      .from('operations')
      .select('*')
      .eq('id', id)
      .single()

    if (op && op.type === 'LOAD' && (op.status === 'dispatched' || op.status === 'completed')) {
      // 2. Obter os itens da rota
      const { data: items } = await supabase
        .from('operation_items')
        .select('*')
        .eq('operation_id', id)

      if (items) {
        // 3. Devolver os itens despachados ao estoque
        for (const item of items) {
          if (item.quantity_scanned > 0 && item.product_id) {
            const { data: product } = await supabase
              .from('products')
              .select('stock')
              .eq('id', item.product_id)
              .single()

            if (product) {
              const newStock = (product.stock || 0) + item.quantity_scanned
              await supabase
                .from('products')
                .update({ stock: newStock })
                .eq('id', item.product_id)
            }
          }
        }
      }
    }

    // 4. Excluir os itens primeiro para evitar problemas de constraint de chave estrangeira
    await supabase.from('operation_items').delete().eq('operation_id', id)
    
    // 5. Depois exclui a rota
    const { error } = await supabase
      .from('operations')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  async finalizeReceiptAndUpdateStock(operationId: string) {
    // 1. Mark as completed
    const now = new Date().toISOString()
    await this.updateOperationStatus(operationId, 'completed', now)

    // 2. Get all items in the operation
    const items = await this.getOperationItems(operationId)
    
    // 3. For each item with quantity_scanned > 0, update product stock
    for (const item of items) {
      if (item.quantity_scanned > 0 && item.product_id) {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single()
          
        if (product) {
          const newStock = (product.stock || 0) + item.quantity_scanned
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.product_id)
        }
      }
    }
    
    return true
  },

  async getPendingStockAdjustments() {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('operation_items')
      .select(`
        *,
        operation:operations (
          load_number,
          driver_name,
          status
        )
      `)
      .eq('physical_divergence_found', true)
      .eq('divergence_resolved', false)
      .eq('company_id', currentCompanyId)
      .order('description')
    if (error) throw error
    return data
  },

  async createOperationAlerts(alerts: Omit<OperationAlert, 'id' | 'created_at' | 'resolved' | 'company_id'>[]) {
    if (!currentCompanyId) throw new Error('No company context')
    const alertsToInsert = alerts.map(a => ({
      ...a,
      company_id: currentCompanyId,
      resolved: false
    }))
    const { data, error } = await supabase
      .from('operation_alerts')
      .insert(alertsToInsert)
      .select()
    if (error) throw error
    return data
  },

  async getPendingOperationAlerts() {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('operation_alerts')
      .select(`
        *,
        operation:operations (
          load_number,
          driver_name
        )
      `)
      .eq('resolved', false)
      .eq('company_id', currentCompanyId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async resolveOperationAlert(alertId: string) {
    if (!currentCompanyId) throw new Error('No company context')
    const { data, error } = await supabase
      .from('operation_alerts')
      .update({ resolved: true })
      .eq('id', alertId)
      .eq('company_id', currentCompanyId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async resolveAllOperationAlerts() {
    if (!currentCompanyId) throw new Error('No company context')
    const { data, error } = await supabase
      .from('operation_alerts')
      .update({ resolved: true })
      .eq('resolved', false)
      .eq('company_id', currentCompanyId)
      .select()
    if (error) throw error
    return data
  }
}
