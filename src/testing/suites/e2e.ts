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
          // delivery_routes.driver_id referencia public.users (usuário com role 'motorista'),
          // não a tabela public.drivers (que é o cadastro fiscal de condutor pra MDF-e/CT-e).
          const { data, error } = await supabase.from('users').insert({
            company_id: ctx.companyId,
            name: 'Motorista E2E QA',
            username: `motorista_e2e_${Date.now()}`,
            password_hash: 'TEST_E2E_NAO_UTILIZAVEL',
            role: 'motorista',
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
        ['users', ids.driver, (id) => supabase.from('users').delete().eq('id', id)],
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
  },

  {
    id: 'E2E-002',
    name: 'Separação com Falta de Mercadoria',
    module: 'Fluxo Completo',
    type: 'E2E',
    priority: 'Crítica',
    description: 'Bipa menos do que o esperado na carga (mesma lógica de Conference.tsx: desconta o que foi bipado, gera alerta de falta) e valida a resolução do alerta.',
    tags: ['e2e', 'carga', 'separacao', 'falta', 'divergencia', 'alerta'],
    tests: [
      {
        name: 'Criar Produto de Teste (20un em estoque)',
        run: async (ctx) => {
          const { data, error } = await supabase.from('products').insert({
            company_id: ctx.companyId,
            code: `TEST_E2E_FALTA_${Date.now()}`,
            description: 'Produto E2E QA Falta',
            sales_price: 50,
            stock: 20,
            active: true
          }).select('id, code').single();

          if (error) throw new Error(`Falha ao criar produto: ${error.message}`);
          (globalThis as any).__TEST_E2E2_PRODUCT_ID = data.id;
          (globalThis as any).__TEST_E2E2_PRODUCT_CODE = data.code;
          ctx.log(`Produto ${data.id} criado com 20 unidades.`);
        }
      },
      {
        name: 'Criar Carga de Separação',
        run: async (ctx) => {
          const { data, error } = await supabase.from('operations').insert({
            company_id: ctx.companyId,
            type: 'LOAD',
            status: 'pending',
            load_number: `E2E-FALTA-${Date.now()}`,
            client_name: 'Cliente E2E QA Falta'
          }).select('id').single();

          if (error) throw new Error(`Falha ao criar carga: ${error.message}`);
          (globalThis as any).__TEST_E2E2_OPERATION_ID = data.id;
          ctx.log(`Carga ${data.id} criada, esperando 5 unidades.`);
        }
      },
      {
        name: 'Adicionar Item à Carga (esperado: 5un)',
        run: async (ctx) => {
          const operationId = (globalThis as any).__TEST_E2E2_OPERATION_ID;
          const productId = (globalThis as any).__TEST_E2E2_PRODUCT_ID;
          const productCode = (globalThis as any).__TEST_E2E2_PRODUCT_CODE;

          const { data, error } = await supabase.from('operation_items').insert({
            company_id: ctx.companyId,
            operation_id: operationId,
            product_id: productId,
            product_code: productCode,
            description: 'Produto E2E QA Falta',
            quantity_expected: 5,
            quantity_scanned: 0,
            status: 'pending'
          }).select('id').single();

          if (error) throw new Error(`Falha ao adicionar item à carga: ${error.message}`);
          (globalThis as any).__TEST_E2E2_OP_ITEM_ID = data.id;
          ctx.log('Item de separação vinculado (esperado: 5un).');
        }
      },
      {
        name: 'Bipar Apenas 3 de 5 Unidades (Falta Parcial)',
        run: async (ctx) => {
          const opItemId = (globalThis as any).__TEST_E2E2_OP_ITEM_ID;

          const { error } = await supabase.from('operation_items')
            .update({ quantity_scanned: 3, status: 'divergent' })
            .eq('id', opItemId);
          if (error) throw new Error(`Falha ao bipar item: ${error.message}`);
          ctx.log('Bipadas 3 de 5 unidades esperadas (faltam 2).');
        }
      },
      {
        name: 'Despachar Carga: Descontar Estoque e Gerar Alerta de Falta',
        run: async (ctx) => {
          const operationId = (globalThis as any).__TEST_E2E2_OPERATION_ID;
          const productId = (globalThis as any).__TEST_E2E2_PRODUCT_ID;
          const productCode = (globalThis as any).__TEST_E2E2_PRODUCT_CODE;

          // Mesma lógica de Conference.tsx (dispatchMutation): desconta só o que foi
          // efetivamente bipado, e gera um alerta pra diferença (quantity_missing).
          const { error: stockErr } = await supabase.rpc('increment_stock_by_code', {
            p_code: productCode,
            p_delta: -3
          });
          if (stockErr) throw new Error(`Falha ao descontar estoque: ${stockErr.message}`);

          const { data: alertData, error: alertErr } = await supabase.from('operation_alerts').insert({
            company_id: ctx.companyId,
            operation_id: operationId,
            product_id: productId,
            product_code: productCode,
            description: 'Produto E2E QA Falta',
            quantity_expected: 5,
            quantity_scanned: 3,
            quantity_missing: 2
          }).select('id, resolved, quantity_missing').single();
          if (alertErr) throw new Error(`Falha ao gerar alerta de falta: ${alertErr.message}`);

          ctx.assertEqual(alertData.quantity_missing, 2, 'quantity_missing deveria ser 2');
          ctx.assert(alertData.resolved === false, 'Alerta deveria nascer como não resolvido');
          (globalThis as any).__TEST_E2E2_ALERT_ID = alertData.id;

          const { error: opErr } = await supabase.from('operations')
            .update({ status: 'dispatched' })
            .eq('id', operationId);
          if (opErr) throw new Error(`Falha ao despachar carga: ${opErr.message}`);

          ctx.log('Estoque descontado em 3un e alerta de falta (2un) gerado.');
        }
      },
      {
        name: 'Validar Estoque Final (17un = 20 - 3)',
        run: async (ctx) => {
          const productId = (globalThis as any).__TEST_E2E2_PRODUCT_ID;
          const { data, error } = await supabase.from('products').select('stock').eq('id', productId).single();
          if (error) throw new Error(`Falha ao consultar estoque: ${error.message}`);
          ctx.assertEqual(data.stock, 17, 'Estoque deveria ter sido descontado em 3 unidades (20 -> 17), não nas 5 esperadas.');
          ctx.log('Estoque final validado: 17 unidades (apenas o bipado foi descontado).');
        }
      },
      {
        name: 'Resolver Alerta de Falta (Reposição Simulada)',
        run: async (ctx) => {
          const alertId = (globalThis as any).__TEST_E2E2_ALERT_ID;
          const { data, error } = await supabase.from('operation_alerts')
            .update({ resolved: true })
            .eq('id', alertId)
            .select('resolved')
            .single();
          if (error) throw new Error(`Falha ao resolver alerta: ${error.message}`);
          ctx.assertEqual(data.resolved, true, 'Alerta deveria estar resolvido');
          ctx.log('Alerta de falta resolvido.');
        }
      }
    ],
    cleanup: async (ctx) => {
      const alertId = (globalThis as any).__TEST_E2E2_ALERT_ID;
      const opItemId = (globalThis as any).__TEST_E2E2_OP_ITEM_ID;
      const operationId = (globalThis as any).__TEST_E2E2_OPERATION_ID;
      const productId = (globalThis as any).__TEST_E2E2_PRODUCT_ID;

      const steps: [string, string | undefined, (id: string) => PromiseLike<{ error: { message: string } | null }>][] = [
        ['operation_alerts', alertId, (id) => supabase.from('operation_alerts').delete().eq('id', id)],
        ['operation_items', opItemId, (id) => supabase.from('operation_items').delete().eq('id', id)],
        ['operations', operationId, (id) => supabase.from('operations').delete().eq('id', id)],
        ['products', productId, (id) => supabase.from('products').delete().eq('id', id)],
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
        .filter(k => k.startsWith('__TEST_E2E2_'))
        .forEach(k => delete (globalThis as any)[k]);

      ctx.log('Cadeia de teste de falta removida.');
    }
  },

  {
    id: 'E2E-003',
    name: 'Entrega com Devolução Parcial',
    module: 'Fluxo Completo',
    type: 'E2E',
    priority: 'Crítica',
    description: 'Entrega parcial ao cliente (item volta), marcando a rota como divergente e devolvendo a quantidade não entregue ao estoque (mesma lógica de ReturnConference.tsx: returned_to_stock).',
    tags: ['e2e', 'entrega', 'devolucao', 'divergencia', 'retorno', 'estoque'],
    tests: [
      {
        name: 'Criar Cliente de Teste',
        run: async (ctx) => {
          const { data, error } = await supabase.from('customers').insert({
            company_id: ctx.companyId,
            legal_name: 'Cliente E2E QA Devolução',
            document: `00${Date.now()}`.substring(0, 14),
            document_type: 'CNPJ',
            city: 'São Paulo',
            state: 'SP',
            active: true
          }).select('id').single();

          if (error) throw new Error(`Falha ao criar cliente: ${error.message}`);
          (globalThis as any).__TEST_E2E3_CUSTOMER_ID = data.id;
          ctx.log(`Cliente ${data.id} criado.`);
        }
      },
      {
        name: 'Criar Produto de Teste (20un em estoque)',
        run: async (ctx) => {
          const { data, error } = await supabase.from('products').insert({
            company_id: ctx.companyId,
            code: `TEST_E2E_DEV_${Date.now()}`,
            description: 'Produto E2E QA Devolução',
            sales_price: 50,
            stock: 20,
            active: true
          }).select('id, code').single();

          if (error) throw new Error(`Falha ao criar produto: ${error.message}`);
          (globalThis as any).__TEST_E2E3_PRODUCT_ID = data.id;
          (globalThis as any).__TEST_E2E3_PRODUCT_CODE = data.code;
          ctx.log(`Produto ${data.id} criado com 20 unidades.`);
        }
      },
      {
        name: 'Criar Carga já Fechada (Simula Separação Concluída)',
        run: async (ctx) => {
          const { data, error } = await supabase.from('operations').insert({
            company_id: ctx.companyId,
            type: 'LOAD',
            status: 'dispatched',
            load_number: `E2E-DEV-${Date.now()}`,
            client_name: 'Cliente E2E QA Devolução'
          }).select('id').single();

          if (error) throw new Error(`Falha ao criar carga: ${error.message}`);
          (globalThis as any).__TEST_E2E3_OPERATION_ID = data.id;

          // Desconta o estoque como se as 5un tivessem sido carregadas corretamente na separação.
          const productCode = (globalThis as any).__TEST_E2E3_PRODUCT_CODE;
          const { error: stockErr } = await supabase.rpc('increment_stock_by_code', {
            p_code: productCode,
            p_delta: -5
          });
          if (stockErr) throw new Error(`Falha ao descontar estoque na separação: ${stockErr.message}`);

          ctx.log('Carga criada e despachada com 5un carregadas (estoque 20 -> 15).');
        }
      },
      {
        name: 'Criar Motorista de Teste',
        run: async (ctx) => {
          const { data, error } = await supabase.from('users').insert({
            company_id: ctx.companyId,
            name: 'Motorista E2E QA Devolução',
            username: `motorista_e2e3_${Date.now()}`,
            password_hash: 'TEST_E2E_NAO_UTILIZAVEL',
            role: 'motorista',
            active: true
          }).select('id').single();

          if (error) throw new Error(`Falha ao criar motorista: ${error.message}`);
          (globalThis as any).__TEST_E2E3_DRIVER_ID = data.id;
          ctx.log(`Motorista ${data.id} criado.`);
        }
      },
      {
        name: 'Criar Rota e Cliente de Entrega',
        run: async (ctx) => {
          const operationId = (globalThis as any).__TEST_E2E3_OPERATION_ID;
          const driverId = (globalThis as any).__TEST_E2E3_DRIVER_ID;
          const customerId = (globalThis as any).__TEST_E2E3_CUSTOMER_ID;

          const { data: route, error: routeErr } = await supabase.from('delivery_routes').insert({
            company_id: ctx.companyId,
            operation_id: operationId,
            driver_id: driverId,
            title: 'Rota E2E QA Devolução',
            status: 'in_progress'
          }).select('id').single();
          if (routeErr) throw new Error(`Falha ao criar rota: ${routeErr.message}`);
          (globalThis as any).__TEST_E2E3_ROUTE_ID = route.id;

          const { data: client, error: clientErr } = await supabase.from('delivery_clients').insert({
            company_id: ctx.companyId,
            delivery_route_id: route.id,
            customer_id: customerId,
            name: 'Cliente E2E QA Devolução',
            status: 'pending'
          }).select('id').single();
          if (clientErr) throw new Error(`Falha ao criar cliente na rota: ${clientErr.message}`);
          (globalThis as any).__TEST_E2E3_DELIVERY_CLIENT_ID = client.id;

          ctx.log('Rota e cliente de entrega criados.');
        }
      },
      {
        name: 'Registrar Item de Entrega (esperado: 5un)',
        run: async (ctx) => {
          const deliveryClientId = (globalThis as any).__TEST_E2E3_DELIVERY_CLIENT_ID;
          const productId = (globalThis as any).__TEST_E2E3_PRODUCT_ID;
          const productCode = (globalThis as any).__TEST_E2E3_PRODUCT_CODE;

          const { data, error } = await supabase.from('delivery_items').insert({
            company_id: ctx.companyId,
            delivery_client_id: deliveryClientId,
            product_id: productId,
            product_code: productCode,
            description: 'Produto E2E QA Devolução',
            quantity_expected: 5,
            quantity_scanned: 0,
            status: 'pending'
          }).select('id').single();

          if (error) throw new Error(`Falha ao criar item de entrega: ${error.message}`);
          (globalThis as any).__TEST_E2E3_DELIVERY_ITEM_ID = data.id;
          ctx.log('Item de entrega registrado (esperado: 5un).');
        }
      },
      {
        name: 'Cliente Recebe Apenas 3un (Devolução Parcial)',
        run: async (ctx) => {
          const deliveryItemId = (globalThis as any).__TEST_E2E3_DELIVERY_ITEM_ID;
          const deliveryClientId = (globalThis as any).__TEST_E2E3_DELIVERY_CLIENT_ID;

          const { error: itemErr } = await supabase.from('delivery_items')
            .update({
              quantity_scanned: 3,
              status: 'divergent',
              return_reason: 'Avaria parcial constatada na entrega (teste E2E)'
            })
            .eq('id', deliveryItemId);
          if (itemErr) throw new Error(`Falha ao registrar recebimento parcial: ${itemErr.message}`);

          const { data: clientData, error: clientErr } = await supabase.from('delivery_clients')
            .update({
              status: 'delivered_with_divergence',
              receiver_name: 'Recebedor E2E QA',
              signature_data: 'data:image/png;base64,MOCK_E2E_SIGNATURE',
              signed_at: new Date().toISOString()
            })
            .eq('id', deliveryClientId)
            .select('status')
            .single();
          if (clientErr) throw new Error(`Falha ao confirmar entrega com divergência: ${clientErr.message}`);

          ctx.assertEqual(clientData.status, 'delivered_with_divergence', 'Status deveria ser "delivered_with_divergence"');
          ctx.log('Cliente recebeu 3 de 5un — 2un voltam pro caminhão (divergência registrada).');
        }
      },
      {
        name: 'Devolver 2un ao Estoque (ReturnConference)',
        run: async (ctx) => {
          const deliveryItemId = (globalThis as any).__TEST_E2E3_DELIVERY_ITEM_ID;
          const productCode = (globalThis as any).__TEST_E2E3_PRODUCT_CODE;
          const productId = (globalThis as any).__TEST_E2E3_PRODUCT_ID;

          // Mesma lógica de ReturnConference.tsx: a diferença (expected - scanned) que não
          // foi entregue volta fisicamente pro estoque, e o item é marcado returned_to_stock.
          const { error: stockErr } = await supabase.rpc('increment_stock_by_code', {
            p_code: productCode,
            p_delta: 2
          });
          if (stockErr) throw new Error(`Falha ao devolver estoque: ${stockErr.message}`);

          const { error: itemErr } = await supabase.from('delivery_items')
            .update({ returned_to_stock: true })
            .eq('id', deliveryItemId);
          if (itemErr) throw new Error(`Falha ao marcar item como devolvido: ${itemErr.message}`);

          const { data, error } = await supabase.from('products').select('stock').eq('id', productId).single();
          if (error) throw new Error(`Falha ao consultar estoque final: ${error.message}`);
          ctx.assertEqual(data.stock, 17, 'Estoque deveria ser 17 (20 - 5 na separação + 2 devolvidos).');
          ctx.log('2un devolvidas ao estoque. Estoque final: 17 unidades.');
        }
      }
    ],
    cleanup: async (ctx) => {
      const ids = {
        deliveryItem: (globalThis as any).__TEST_E2E3_DELIVERY_ITEM_ID,
        deliveryClient: (globalThis as any).__TEST_E2E3_DELIVERY_CLIENT_ID,
        route: (globalThis as any).__TEST_E2E3_ROUTE_ID,
        driver: (globalThis as any).__TEST_E2E3_DRIVER_ID,
        operation: (globalThis as any).__TEST_E2E3_OPERATION_ID,
        product: (globalThis as any).__TEST_E2E3_PRODUCT_ID,
        customer: (globalThis as any).__TEST_E2E3_CUSTOMER_ID,
      };

      const steps: [string, string | undefined, (id: string) => PromiseLike<{ error: { message: string } | null }>][] = [
        ['delivery_items', ids.deliveryItem, (id) => supabase.from('delivery_items').delete().eq('id', id)],
        ['delivery_clients', ids.deliveryClient, (id) => supabase.from('delivery_clients').delete().eq('id', id)],
        ['delivery_routes', ids.route, (id) => supabase.from('delivery_routes').delete().eq('id', id)],
        ['users', ids.driver, (id) => supabase.from('users').delete().eq('id', id)],
        ['operations', ids.operation, (id) => supabase.from('operations').delete().eq('id', id)],
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
        .filter(k => k.startsWith('__TEST_E2E3_'))
        .forEach(k => delete (globalThis as any)[k]);

      ctx.log('Cadeia de teste de devolução removida.');
    }
  }
];
