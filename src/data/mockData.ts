import type { Operation, OperationItem, Product } from '@/types/database'

// ============================================
// Mock Data for Demo / Development
// ============================================

export const mockProducts: Product[] = [
  { id: '1', code: '7891000100103', external_code: 'EXT001', description: 'Arroz Integral Orgânico 1kg', group: 'Grãos', stock: 150, batch: 'L2024-001', created_at: '2024-01-15' },
  { id: '2', code: '7891000100110', external_code: 'EXT002', description: 'Feijão Preto Premium 500g', group: 'Grãos', stock: 200, batch: 'L2024-002', created_at: '2024-01-15' },
  { id: '3', code: '7891000100127', external_code: 'EXT003', description: 'Macarrão Spaghetti 500g', group: 'Massas', stock: 80, batch: 'L2024-003', created_at: '2024-01-16' },
  { id: '4', code: '7891000100134', external_code: 'EXT004', description: 'Óleo de Soja 900ml', group: 'Óleos', stock: 45, batch: 'L2024-004', created_at: '2024-01-16' },
  { id: '5', code: '7891000100141', external_code: 'EXT005', description: 'Açúcar Cristal 5kg', group: 'Básicos', stock: 320, batch: 'L2024-005', created_at: '2024-01-17' },
  { id: '6', code: '7891000100158', external_code: 'EXT006', description: 'Café Torrado Moído 500g', group: 'Bebidas', stock: 95, batch: 'L2024-006', created_at: '2024-01-17' },
  { id: '7', code: '7891000100165', external_code: 'EXT007', description: 'Leite Integral UHT 1L', group: 'Laticínios', stock: 500, batch: 'L2024-007', created_at: '2024-01-18' },
  { id: '8', code: '7891000100172', external_code: 'EXT008', description: 'Farinha de Trigo Tipo 1 1kg', group: 'Básicos', stock: 2, batch: 'L2024-008', created_at: '2024-01-18' },
]

export const mockOperations: Operation[] = [
  {
    id: 'op1',
    type: 'LOAD',
    status: 'in_progress',
    load_number: 'CG-2024-001',
    client_name: 'Supermercado Central',
    clients: ['Supermercado Central'],
    driver_name: 'João Silva',
    vehicle_plate: 'ABC-1D23',
    created_at: '2024-01-20T08:00:00',
  },
  {
    id: 'op2',
    type: 'LOAD',
    status: 'pending',
    load_number: 'CG-2024-002',
    client_name: 'Atacadão do Bairro',
    clients: ['Atacadão do Bairro', 'Mini Mercado Boa Vista'],
    driver_name: 'Carlos Souza',
    vehicle_plate: 'XYZ-9H87',
    created_at: '2024-01-20T09:30:00',
  },
  {
    id: 'op3',
    type: 'LOAD',
    status: 'completed',
    load_number: 'CG-2024-003',
    client_name: 'Padaria Estrela',
    clients: ['Padaria Estrela'],
    driver_name: 'Pedro Lima',
    vehicle_plate: 'DEF-5G67',
    created_at: '2024-01-19T14:00:00',
    completed_at: '2024-01-19T16:45:00',
  },
  {
    id: 'op4',
    type: 'INVENTORY',
    status: 'pending',
    load_number: 'INV-2024-001',
    client_name: 'Inventário Geral - Setor A',
    created_at: '2024-01-20T07:00:00',
  },
  {
    id: 'op5',
    type: 'LOAD',
    status: 'completed',
    load_number: 'CG-2024-004',
    client_name: 'Restaurante Sabor & Arte',
    clients: ['Restaurante Sabor & Arte'],
    driver_name: 'Maria Oliveira',
    vehicle_plate: 'GHI-2J34',
    created_at: '2024-01-18T10:00:00',
    completed_at: '2024-01-18T13:20:00',
  },
]

export const mockOperationItems: OperationItem[] = [
  { id: 'item1', operation_id: 'op1', product_id: '1', product_code: '7891000100103', description: 'Arroz Integral Orgânico 1kg', quantity_expected: 50, quantity_scanned: 32, status: 'pending' },
  { id: 'item2', operation_id: 'op1', product_id: '2', product_code: '7891000100110', description: 'Feijão Preto Premium 500g', quantity_expected: 30, quantity_scanned: 30, status: 'ok' },
  { id: 'item3', operation_id: 'op1', product_id: '3', product_code: '7891000100127', description: 'Macarrão Spaghetti 500g', quantity_expected: 20, quantity_scanned: 0, status: 'pending' },
  { id: 'item4', operation_id: 'op1', product_id: '6', product_code: '7891000100158', description: 'Café Torrado Moído 500g', quantity_expected: 15, quantity_scanned: 15, status: 'ok' },
  { id: 'item5', operation_id: 'op2', product_id: '4', product_code: '7891000100134', description: 'Óleo de Soja 900ml', quantity_expected: 40, quantity_scanned: 0, status: 'pending' },
  { id: 'item6', operation_id: 'op2', product_id: '5', product_code: '7891000100141', description: 'Açúcar Cristal 5kg', quantity_expected: 60, quantity_scanned: 0, status: 'pending' },
  { id: 'item7', operation_id: 'op2', product_id: '7', product_code: '7891000100165', description: 'Leite Integral UHT 1L', quantity_expected: 100, quantity_scanned: 0, status: 'pending' },
]
