import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { salesApi } from '@/api/sales'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '@/utils/formatters'
import { FileText, ArrowRight, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PendingBilling() {
  const navigate = useNavigate()

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['sales_orders_pending_billing'],
    queryFn: async () => {
      // In a real app we might want to query specifically for 'Aprovado' status
      const data = await salesApi.getSalesOrders()
      return data.filter(order => order.status === 'Aprovado')
    }
  })

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando pedidos aprovados...</div>
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-amber-500" />
            Pedidos Aguardando Faturamento
          </h1>
          <p className="text-muted-foreground mt-1">Estes pedidos foram aprovados e aguardam a ação de faturamento para gerar as cobranças financeiras.</p>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex gap-3 text-amber-700 dark:text-amber-400">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-bold mb-1">Regra Crítica: Pedido ≠ Cobrança</p>
          <p>As contas a receber só nascem quando o usuário autoriza o faturamento através do botão "FATURAR". Pedidos aqui listados ainda NÃO constam no financeiro.</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center p-12 glass-card rounded-xl border-dashed">
          <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground">Nenhum pedido aguardando</h3>
          <p className="text-muted-foreground mt-1">Todos os pedidos aprovados já foram faturados.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map(order => (
            <div key={order.id} className="glass-card p-4 rounded-xl flex items-center justify-between hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {order.customer?.legal_name || order.customer?.fantasy_name || 'Cliente Removido'}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="bg-muted px-2 py-0.5 rounded text-xs font-mono">
                      Nº {order.order_number || order.id.slice(0, 5).toUpperCase()}
                    </span>
                    <span>•</span>
                    <span>Vendedor: {order.sales_rep?.nickname || '-'}</span>
                    <span>•</span>
                    <span className="font-medium text-foreground">{formatCurrency(order.net_amount || order.total_amount)}</span>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => navigate(`/vendas/gestao/editar/${order.id}`)}
                className="shrink-0"
              >
                Abrir para Faturar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
