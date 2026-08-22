import type { TestBattery } from '../types';
import { supabase } from '@/lib/supabase';

// Bateria de ponta a ponta: percorre a cadeia real Venda -> Separação -> Carga -> Rota -> Entrega,
// encadeando os IDs de cada etapa na seguinte (não são testes isolados por tabela).
export const e2eTests: TestBattery[] = [
  {
    id: 'E2E-001',
    name: 'Fluxo Completo — Venda até Entrega',
    module: 'Fluxo Completo',
    type: 'E2E',
    priority: 'Crítica',
    description: 'Cria cliente, produto, pedido, carga de separação, rota e confirma a entrega (POD), validando a integridade da cadeia ponta a ponta.',
    tags: ['e2e', 'venda', 'pedido', 'carga', 'separacao', 'rota', 'entrega', 'pod'],
    tests: [
      {
        name: 'Criar Cliente de Teste',
        run: async (ctx) => {
          const { data, error } = await supabase.from('customers').insert({
            company_id: ctx.companyId,
            legal_name: 'Cliente E2E QA',
            document: `00${Date.now()}`.substring(0, 14),
            document_type: 'CNPJ',
            address: 'ROTA_E2E_TESTE',
            city: 'São Paulo',
            state: 'SP',
            active: true
          }).select('id').single();

          if (error) throw new Error(`Falha ao criar cliente: ${error.message}`);
          (globalThis as any).__TEST_E2E_CUSTOMER_ID = data.id;
          ctx.log(`Cliente ${data.id} criado.`);
        }
      },
      {
        name: 'Criar Produto de Teste',
        run: async (ctx) => {
          const { data, error } = await supabase.from('products').insert({
            company_id: ctx.companyId,
            code: `TEST_E2E_${Date.now()}`,
            description: 'Produto E2E QA',
            sales_price: 50,
            stock: 20,
            active: true
          }).select('id').single();

          if (error) throw new Error(`Falha ao criar produto: ${error.message}`);
          (globalThis as any).__TEST_E2E_PRODUCT_ID = data.id;
          ctx.log(`Produto ${data.id} criado com 20 unidades em estoque.`);
        }
      },
      {
        name: 'Criar Pedido de Venda',
        run: async (ctx) => {
          const customerId = (globalThis as any).__TEST_E2E_CUSTOMER_ID;
          const { data, error } = await supabase.from('sales_orders').insert({
            company_id: ctx.companyId,
            customer_id: customerId,
            status: 'Digitação',
            total_amount: 250,
            net_amount: 250,
            total_discount: 0,
            notes: 'TESTE AUTOMATIZADO E2E'
          }).select('id').single();

          if (error) throw new Error(`Falha ao criar pedido: ${error.message}`);
          (globalThis as any).__TEST_E2E_ORDER_ID = data.id;
          ctx.log(`Pedido ${data.id} criado em Digitação.`);
        }
      },
      {
        name: 'Adicionar Item ao Pedido',
        run: async (ctx) => {
          const orderId = (globalThis as any).__TEST_E2E_ORDER_ID;
          const productId = (globalThis as any).__TEST_E2E_PRODUCT_ID;

          const { data, error } = await supabase.from('sales_order_items').insert({
            sales_order_id: orderId,
            product_id: productId,
            quantity: 5,
            unit_price: 50,
            discount_percent: 0,
            net_price: 50,
            total_price: 250
          }).select('id').single();

          if (error) throw new Error(`Falha ao adicionar item: ${error.message}`);
          (globalThis as any).__TEST_E2E_ITEM_ID = data.id;
          ctx.log('Item de 5un x R$50 adicionado ao pedido.');
        }
      },
      {
        name: 'Aprovar Pedido',
        run: async (ctx) => {
          const orderId = (globalThis as any).__TEST_E2E_ORDER_ID;
          const { error } = await supabase.from('sales_orders').update({ status: 'Aprovado' }).eq('id', orderId);
          if (error) throw new Error(`Falha ao aprovar pedido: ${error.message}`);
          ctx.log('Pedido aprovado, liberado para separação.');
        }
      },
      {
        name: 'Criar Carga de Separação',
        run: async (ctx) => {
          const { data, error } = await supabase.from('operations').insert({
            company_id: ctx.companyId,
            type: 'LOAD',
            status: 'pending',
            load_number: `E2E-${Date.now()}`,
            client_name: 'Cliente E2E QA'
          }).select('id').single();

          if (error) throw new Error(`Falha ao criar carga: ${error.message}`);
          (globalThis as any).__TEST_E2E_OPERATION_ID = data.id;
          ctx.log(`Carga ${data.id} criada para separação.`);
        }
      },
      {
        name: 'Adicionar Item à Carga',
        run: async (ctx) => {
          const operationId = (globalThis as any).__TEST_E2E_OPERATION_ID;
          const productId = (globalThis as any).__TEST_E2E_PRODUCT_ID;

          const { data, error } = await supabase.from('operation_items').insert({
            company_id: ctx.companyId,
            operation_id: operationId,
            product_id: productId,
            product_code: `TEST_E2E_${productId}`,
            description: 'Produto E2E QA',
            quantity_expected: 5,
            quantity_scanned: 0,
            status: 'pending'
          }).select('id').single();

          if (error) throw new Error(`Falha ao adicionar item à carga: ${error.message}`);
          (globalThis as any).__TEST_E2E_OP_ITEM_ID = data.id;
          ctx.log('Item de separação vinculado à carga.');
        }
      },
      {
        name: 'Bipar e Fechar Carga',
        run: async (ctx) => {
          const opItemId = (globalThis as any).__TEST_E2E_OP_ITEM_ID;
          const operationId = (globalThis as any).__TEST_E2E_OPERATION_ID;

          const { error: itemErr } = await supabase.from('operation_items')
            .update({ quantity_scanned: 5, status: 'ok' })
            .eq('id', opItemId);
          if (itemErr) throw new Error(`Falha ao bipar item: ${itemErr.message}`);

          const { error: opErr } = await supabase.from('operations')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', operationId);
          if (opErr) throw new Error(`Falha ao fechar carga: ${opErr.message}`);

          ctx.log('Carga bipada (5/5) e fechada.');
        }
      },
      {
        name: 'Criar Motorista de Teste',
        run: async (ctx) => {
          const { data, error } = await supabase.from('drivers').insert({
            company_id: ctx.companyId,
            name: 'Motorista E2E QA',
            cpf: `${Date.now()}`.substring(0, 11),
            active: true
          }).select('id').single();

          if (error) throw new Error(`Falha ao criar motorista: ${error.message}`);
          (globalThis as any).__TEST_E2E_DRIVER_ID = data.id;
          ctx.log(`Motorista ${data.id} criado.`);
        }
      },
      {
        name: 'Criar Rota de Entrega',
        run: async (ctx) => {
          const operationId = (globalThis as any).__TEST_E2E_OPERATION_ID;
          const driverId = (globalThis as any).__TEST_E2E_DRIVER_ID;

          const { data, error } = await supabase.from('delivery_routes').insert({
            company_id: ctx.companyId,
            operation_id: operationId,
            driver_id: driverId,
            title: 'Rota E2E QA',
            status: 'pending'
          }).select('id').single();

          if (error) throw new Error(`Falha ao criar rota: ${error.message}`);
          (globalThis as any).__TEST_E2E_ROUTE_ID = data.id;
          ctx.log(`Rota ${data.id} criada e vinculada à carga.`);
        }
      },
      {
        name: 'Adicionar Cliente à Rota',
        run: async (ctx) => {
          const routeId = (globalThis as any).__TEST_E2E_ROUTE_ID;
          const customerId = (globalThis as any).__TEST_E2E_CUSTOMER_ID;

          const { data, error } = await supabase.from('delivery_clients').insert({
            company_id: ctx.companyId,
            delivery_route_id: routeId,
            customer_id: customerId,
            name: 'Cliente E2E QA',
            status: 'pending'
          }).select('id').single();

          if (error) throw new Error(`Falha ao adicionar cliente à rota: ${error.message}`);
          (globalThis as any).__TEST_E2E_DELIVERY_CLIENT_ID = data.id;
          ctx.log('Cliente adicionado à rota de entrega.');
        }
      },
      {
        name: 'Confirmar Entrega (POD)',
        run: async (ctx) => {
          const deliveryClientId = (globalThis as any).__TEST_E2E_DELIVERY_CLIENT_ID;

          const { data, error } = await supabase.from('delivery_clients')
            .update({
              status: 'delivered',
              receiver_name: 'Recebedor E2E QA',
              signature_data: 'data:image/png;base64,MOCK_E2E_SIGNATURE',
              signed_at: new Date().toISOString()
            })
            .eq('id', deliveryClientId)
            .select('status')
            .single();

          if (error) throw new Error(`Falha ao confirmar entrega: ${error.message}`);
          ctx.assertEqual(data.status, 'delivered', 'Status final deveria ser "delivered"');
          ctx.log('Entrega confirmada com assinatura (POD).');
        }
      }
    ],
    cleanup: async (ctx) => {
      const ids = {
        deliveryClient: (globalThis as any).__TEST_E2E_DELIVERY_CLIENT_ID,
        route: (globalThis as any).__TEST_E2E_ROUTE_ID,
        driver: (globalThis as any).__TEST_E2E_DRIVER_ID,
        opItem: (globalThis as any).__TEST_E2E_OP_ITEM_ID,
        operation: (globalThis as any).__TEST_E2E_OPERATION_ID,
        orderItem: (globalThis as any).__TEST_E2E_ITEM_ID,
        order: (globalThis as any).__TEST_E2E_ORDER_ID,
        product: (globalThis as any).__TEST_E2E_PRODUCT_ID,
        customer: (globalThis as any).__TEST_E2E_CUSTOMER_ID,
      };

      const steps: [string, string | undefined, (id: string) => PromiseLike<{ error: { message: string } | null }>][] = [
        ['delivery_clients', ids.deliveryClient, (id) => supabase.from('delivery_clients').delete().eq('id', id)],
        ['delivery_routes', ids.route, (id) => supabase.from('delivery_routes').delete().eq('id', id)],
        ['drivers', ids.driver, (id) => supabase.from('drivers').delete().eq('id', id)],
        ['operation_items', ids.opItem, (id) => supabase.from('operation_items').delete().eq('id', id)],
        ['operations', ids.operation, (id) => supabase.from('operations').delete().eq('id', id)],
        ['sales_order_items', ids.orderItem, (id) => supabase.from('sales_order_items').delete().eq('id', id)],
        ['sales_orders', ids.order, (id) => supabase.from('sales_orders').delete().eq('id', id)],
        ['products', ids.product, (id) => supabase.from('products').delete().eq('id', id)],
        ['customers', ids.customer, (id) => supabase.from('customers').delete().eq('id', id)],
      ];

      for (const [table, id, run] of steps) {
        if (!id) continue;
        try {
          const { error } = await run(id);
          if (error) ctx.log(`Aviso: falha ao limpar ${table}: ${error.message}`);
        } catch (e) {
          ctx.log(`Aviso: exceção ao limpar ${table}`, e);
        }
      }

      Object.keys(globalThis as any)
        .filter(k => k.startsWith('__TEST_E2E_'))
        .forEach(k => delete (globalThis as any)[k]);

      ctx.log('Cadeia completa de teste E2E removida.');
    }
  }
];
