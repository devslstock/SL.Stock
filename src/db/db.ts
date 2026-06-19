import Dexie, { type EntityTable } from 'dexie';

export interface LocalRoute {
  id: string;
  load_number: string;
  status: string;
  operation_id: string;
  created_at: string;
  vehicle_id?: string;
  driver_id?: string;
  helper_id?: string;
  synced_at: number;
}

export interface LocalClient {
  id: string;
  route_id: string;
  customer_id: string;
  customer_name: string;
  document: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  status: string; // 'pending', 'completed', 'failed'
  order_number: string;
  sort_order: number;
  latitude?: number;
  longitude?: number;
}

export interface LocalProduct {
  id: string;
  client_id: string; // the delivery_client ID it belongs to
  product_id: string;
  product_code: string;
  description: string;
  quantity_expected: number;
  quantity_scanned: number;
  status: string;
}

// Queue for actions performed while offline
export interface SyncAction {
  id?: number;
  type: 'CONFIRM_DELIVERY' | 'CONFIRM_ROUTE_CHECKLIST_INITIAL' | 'CONFIRM_ROUTE_CHECKLIST_FINAL' | 'UPLOAD_SIGNATURE' | 'UPLOAD_PHOTO' | 'ADD_OCCURRENCE';
  payload: any;
  created_at: number;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
}

export interface OfflineUserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions?: any;
  saved_at: number;
}

const db = new Dexie('ColetorOfflineDB') as Dexie & {
  routes: EntityTable<LocalRoute, 'id'>;
  clients: EntityTable<LocalClient, 'id'>;
  products: EntityTable<LocalProduct, 'id'>;
  sync_queue: EntityTable<SyncAction, 'id'>;
  offline_user: EntityTable<OfflineUserProfile, 'id'>;
};

// Schema version 1
db.version(1).stores({
  routes: 'id, status, operation_id',
  clients: 'id, route_id, status, sort_order',
  products: 'id, client_id, product_code',
  sync_queue: '++id, type, status, created_at',
  offline_user: 'id'
});

export default db;
