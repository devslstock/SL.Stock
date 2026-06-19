import db from '@/db/db';
import { deliveriesApi } from '@/api/deliveries';
import { equipmentsApi } from '@/api/equipments';

export const OfflineSyncService = {
  async downloadRouteData(routeId: string) {
    if (!navigator.onLine) return; // Cannot download if offline

    try {
      // 1. Fetch from Supabase
      const route = await deliveriesApi.getDeliveryRoute(routeId);
      const clients = await deliveriesApi.getDeliveryClients(routeId);
      
      // We don't fetch orders yet because we only defined products for clients in DB schema
      // But we can add them to a local cache if needed. Let's stick to clients for now.

      // 2. Clear old data for this route to prevent duplicates
      await db.transaction('rw', db.routes, db.clients, db.products, async () => {
        // Find existing clients for this route
        const existingClients = await db.clients.where('route_id').equals(routeId).toArray();
        const existingClientIds = existingClients.map(c => c.id);
        
        // Delete products of these clients
        if (existingClientIds.length > 0) {
          await db.products.where('client_id').anyOf(existingClientIds).delete();
        }
        
        // Delete the clients
        await db.clients.where('route_id').equals(routeId).delete();

        // 3. Insert fresh data
        if (route) {
          await db.routes.put({
            id: route.id,
            load_number: route.operation?.load_number || '',
            status: route.status,
            operation_id: route.operation_id,
            created_at: route.created_at,
            driver_id: route.driver_id,
            synced_at: Date.now()
          });
        }

        for (const client of clients) {
          await db.clients.put({
            id: client.id,
            route_id: client.delivery_route_id,
            customer_id: client.customer_id || '',
            customer_name: client.customer?.legal_name || client.customer?.nickname || client.name,
            document: client.customer?.document || '',
            address: client.address || '',
            neighborhood: '', // Optional
            city: '', // Optional
            state: '', // Optional
            status: client.status,
            order_number: client.order_number || '',
            sort_order: client.delivery_sequence || 0,
            latitude: client.customer?.latitude || undefined,
            longitude: client.customer?.longitude || undefined
          });

          // Insert items
          const items = client.delivery_items || [];
          for (const item of items) {
            await db.products.put({
              id: item.id,
              client_id: client.id,
              product_id: item.product_id,
              product_code: item.product_code,
              description: item.description,
              quantity_expected: item.quantity_expected,
              quantity_scanned: item.quantity_scanned,
              status: item.status
            });
          }
        }
      });
      console.log(`[OfflineSyncService] Route ${routeId} downloaded to Dexie`);
    } catch (e) {
      console.error('[OfflineSyncService] Failed to download route', e);
    }
  },

  async syncRouteData(route: any, clients: any[], routeOrders: any[] = []) {
    if (!route?.id) return;
    try {
      await db.transaction('rw', db.routes, db.clients, db.products, async () => {
        const routeId = route.id;
        const existingClients = await db.clients.where('route_id').equals(routeId).toArray();
        const existingClientIds = existingClients.map(c => c.id);
        
        if (existingClientIds.length > 0) {
          await db.products.where('client_id').anyOf(existingClientIds).delete();
        }
        await db.clients.where('route_id').equals(routeId).delete();

        await db.routes.put({
          id: route.id,
          load_number: route.operation?.load_number || '',
          status: route.status,
          operation_id: route.operation_id,
          created_at: route.created_at,
          driver_id: route.driver_id,
          synced_at: Date.now(),
          initial_km: route.initial_km,
          final_km: route.final_km
        });

        for (const client of clients) {
          await db.clients.put({
            id: client.id,
            route_id: client.delivery_route_id,
            customer_id: client.customer_id || '',
            customer_name: client.customer?.legal_name || client.customer?.nickname || client.name,
            document: client.customer?.document || '',
            address: client.address || '',
            neighborhood: '',
            city: '',
            state: '',
            status: client.status,
            order_number: client.order_number || '',
            sort_order: client.delivery_sequence || 0,
            latitude: client.customer?.latitude || undefined,
            longitude: client.customer?.longitude || undefined
          });

          const items = client.delivery_items || [];
          for (const item of items) {
            await db.products.put({
              id: item.id,
              client_id: client.id,
              product_id: item.product_id,
              product_code: item.product_code,
              description: item.description,
              quantity_expected: item.quantity_expected,
              quantity_scanned: item.quantity_scanned,
              status: item.status
            });
          }
        }
      });
      console.log(`[OfflineSyncService] Route ${route.id} synced directly to Dexie`);
    } catch (e) {
      console.error('[OfflineSyncService] Failed to sync route data directly', e);
    }
  },

  async getLocalRouteData(routeId: string) {
    const route = await db.routes.get(routeId);
    const clients = await db.clients.where('route_id').equals(routeId).toArray();
    
    // Join with products
    const clientsWithItems = await Promise.all(clients.map(async (client) => {
      const items = await db.products.where('client_id').equals(client.id).toArray();
      return {
        ...client,
        name: client.customer_name,
        delivery_route_id: client.route_id,
        delivery_sequence: client.sort_order,
        delivery_items: items,
        customer: {
          document: client.document,
          latitude: client.latitude,
          longitude: client.longitude
        }
      };
    }));

    return { route, clients: clientsWithItems };
  },
  
  async getLocalClient(clientId: string) {
    const client = await db.clients.get(clientId);
    return client;
  },
  
  async getLocalClientItems(clientId: string) {
    const items = await db.products.where('client_id').equals(clientId).toArray();
    return items;
  }
};
