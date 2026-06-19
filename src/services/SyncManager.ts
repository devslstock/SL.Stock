import db from '@/db/db';
import { deliveriesApi } from '@/api/deliveries';

class SyncManager {
  private isSyncing = false;

  constructor() {
    window.addEventListener('online', () => {
      console.log('[SyncManager] Back online. Starting sync...');
      this.syncAll();
    });
    
    // Attempt sync on startup if online
    if (navigator.onLine) {
      setTimeout(() => this.syncAll(), 2000);
    }
  }

  async syncAll() {
    if (!navigator.onLine || this.isSyncing) return;
    this.isSyncing = true;

    try {
      const pendingActions = await db.sync_queue.where('status').equals('pending').toArray();
      
      if (pendingActions.length === 0) {
        this.isSyncing = false;
        return;
      }

      console.log(`[SyncManager] Found ${pendingActions.length} pending actions`);

      for (const action of pendingActions) {
        // Mark as syncing
        if (action.id) {
          await db.sync_queue.update(action.id, { status: 'syncing' });
        }

        try {
          if (action.type === 'CONFIRM_DELIVERY') {
             const payload = action.payload;
             if (payload.action === 'updateDeliveryClient') {
                // To avoid recursive interceptors calling offline DB again, we temporarily override navigator check or 
                // we can just call supabase directly here.
                const { supabase } = await import('@/lib/supabase');
                await supabase.from('delivery_clients').update(payload.updates).eq('id', payload.id);
             } 
             else if (payload.action === 'updateDeliveryItemQuantity') {
                const { supabase } = await import('@/lib/supabase');
                await supabase.from('delivery_items').update(payload.updates).eq('id', payload.itemId);
             }
          } else if (action.type === 'CONFIRM_ROUTE_CHECKLIST_INITIAL') {
             const payload = action.payload;
             const { supabase } = await import('@/lib/supabase');
             await supabase.from('vehicle_checklists').insert({
                route_id: payload.route_id,
                driver_id: payload.driver_id,
                initial_km: payload.km,
                initial_temp: payload.temp || null,
             });
          } else if (action.type === 'CONFIRM_ROUTE_CHECKLIST_FINAL') {
             const payload = action.payload;
             const { supabase } = await import('@/lib/supabase');
             await supabase.from('vehicle_checklists').update({
                final_km: payload.km,
                final_temp: payload.temp || null,
                final_checked_at: new Date().toISOString()
             }).eq('route_id', payload.route_id);
          }

          // Remove successful action from queue
          if (action.id) {
            await db.sync_queue.delete(action.id);
          }
        } catch (error: any) {
          console.error(`[SyncManager] Failed to sync action ${action.id}`, error);
          if (action.id) {
            await db.sync_queue.update(action.id, { status: 'failed', error: error.message });
          }
        }
      }
      
      console.log('[SyncManager] Sync completed.');
    } catch (e) {
      console.error('[SyncManager] Sync loop error', e);
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncManager = new SyncManager();
