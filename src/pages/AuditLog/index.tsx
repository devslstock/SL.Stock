import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { History, ClipboardList } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Pagination } from '@/components/ui/Pagination'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { auditApi } from '@/api/auditLog'
import { AUDITED_TABLES, type AuditedTable, type AuditLog } from '@/types/database'
import { formatDate } from '@/utils/formatters'
import { summarizeAuditChange } from '@/utils/auditLog'

const TABLE_LABELS: Record<AuditedTable, string> = {
  products: 'Produtos',
  customers: 'Clientes',
  sales_orders: 'Pedidos de Venda',
  sales_order_items: 'Itens de Pedido',
  price_tables: 'Tabelas de Preço',
  price_table_items: 'Itens de Tabela de Preço',
  receipt_methods: 'Formas de Cobrança',
  accounts_receivable: 'Contas a Receber',
  users: 'Usuários',
  companies: 'Empresas',
}

const ACTION_BADGE: Record<AuditLog['action'], { label: string; className: string }> = {
  INSERT: { label: 'Criação', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  UPDATE: { label: 'Alteração', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  DELETE: { label: 'Exclusão', className: 'bg-red-500/10 text-red-600 dark:text-red-400' },
}

export default function AuditLogPage() {
  const [tableFilter, setTableFilter] = useState<AuditedTable | ''>('')
  const [periodoInicio, setPeriodoInicio] = useState('')
  const [periodoFim, setPeriodoFim] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 30

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit_log', tableFilter, periodoInicio, periodoFim],
    queryFn: () => auditApi.getLogs({
      table_name: tableFilter || undefined,
      periodo_inicio: periodoInicio ? new Date(periodoInicio).toISOString() : undefined,
      periodo_fim: periodoFim ? new Date(periodoFim + 'T23:59:59').toISOString() : undefined,
    }),
  })

  const totalPages = Math.max(1, Math.ceil(logs.length / itemsPerPage))
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return logs.slice(start, start + itemsPerPage)
  }, [logs, currentPage])

  return (
    <div className="container mx-auto py-6 max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <History className="w-8 h-8 text-primary" />
          Histórico de Modificações
        </h1>
        <p className="text-muted-foreground mt-2">
          Registro de quem criou, alterou ou excluiu dados no sistema.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Tabela</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={tableFilter}
              onChange={(e) => { setTableFilter(e.target.value as AuditedTable | ''); setCurrentPage(1) }}
            >
              <option value="">Todas</option>
              {AUDITED_TABLES.map((t) => (
                <option key={t} value={t}>{TABLE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>De</Label>
            <Input type="date" value={periodoInicio} onChange={(e) => { setPeriodoInicio(e.target.value); setCurrentPage(1) }} />
          </div>
          <div className="space-y-1.5">
            <Label>Até</Label>
            <Input type="date" value={periodoFim} onChange={(e) => { setPeriodoFim(e.target.value); setCurrentPage(1) }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
              <ClipboardList className="w-8 h-8 opacity-40" />
              Nenhuma modificação registrada para os filtros selecionados.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tabela</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>O que mudou</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Data / Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log) => (
                  <TableRow key={log.id} className="cursor-pointer" onClick={() => setSelectedLog(log)}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{TABLE_LABELS[log.table_name] || log.table_name}</TableCell>
                    <TableCell>
                      <Badge className={ACTION_BADGE[log.action].className}>{ACTION_BADGE[log.action].label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{summarizeAuditChange(log)}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{log.changed_by_name || 'Sistema'}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatDate(log.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={logs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da modificação</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {TABLE_LABELS[selectedLog.table_name]} · {selectedLog.changed_by_name || 'Sistema'} · {formatDate(selectedLog.created_at)}
              </div>
              {selectedLog.old_data && (
                <div>
                  <Label>Antes</Label>
                  <pre className="mt-1 bg-gray-900 text-gray-100 text-xs p-3 rounded-md overflow-auto max-h-64">
                    <code>{JSON.stringify(selectedLog.old_data, null, 2)}</code>
                  </pre>
                </div>
              )}
              {selectedLog.new_data && (
                <div>
                  <Label>Depois</Label>
                  <pre className="mt-1 bg-gray-900 text-gray-100 text-xs p-3 rounded-md overflow-auto max-h-64">
                    <code>{JSON.stringify(selectedLog.new_data, null, 2)}</code>
                  </pre>
                </div>
              )}
              <Button variant="outline" onClick={() => setSelectedLog(null)}>Fechar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
