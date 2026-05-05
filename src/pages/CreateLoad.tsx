import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { operationsApi } from '@/api/operations'
import { productsApi } from '@/api/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, Plus, Trash2, ClipboardList, Truck, User, Search } from 'lucide-react'

interface NewItem {
  tempId: string
  product_id: string
  product_code: string
  description: string
  quantity_expected: number
}

export default function CreateLoad() {
  const navigate = useNavigate()
  const [loadNumber, setLoadNumber] = useState('')
  const [clientName, setClientName] = useState('')
  const [driverName, setDriverName] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<NewItem[]>([])
  const [codeSearch, setCodeSearch] = useState('')

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts,
  })

  const createMutation = useMutation({
    mutationFn: (data: { op: any, items: any }) => operationsApi.createOperation(data.op, data.items),
    onSuccess: () => {
      toast.success('Carga criada com sucesso!')
      navigate('/cargas')
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar carga: ${error.message}`)
    }
  })

  const addItem = () => {
    const product = products.find(p => p.code === codeSearch || p.external_code === codeSearch)
    if (!product) { toast.error('Produto não encontrado'); return }
    if (items.find(i => i.product_code === product.code)) { toast.warning('Produto já adicionado'); return }
    setItems(prev => [...prev, { tempId: `t${Date.now()}`, product_id: product.id, product_code: product.code, description: product.description, quantity_expected: 1 }])
    setCodeSearch('')
    toast.success(`${product.description} adicionado`)
  }

  const updateQty = (tempId: string, qty: number) => {
    setItems(prev => prev.map(i => i.tempId === tempId ? { ...i, quantity_expected: Math.max(1, qty) } : i))
  }

  const removeItem = (tempId: string) => {
    setItems(prev => prev.filter(i => i.tempId !== tempId))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!loadNumber || !clientName || items.length === 0) {
      toast.error('Preencha todos os campos obrigatórios e adicione itens')
      return
    }

    const opData = {
      type: 'LOAD' as const,
      status: 'pending' as const,
      load_number: loadNumber,
      client_name: clientName,
      driver_name: driverName,
      vehicle_plate: vehiclePlate,
      notes,
    }

    const itemsData = items.map(i => ({
      product_id: i.product_id,
      product_code: i.product_code,
      description: i.description,
      quantity_expected: i.quantity_expected,
      quantity_scanned: 0,
      status: 'pending' as const
    }))

    createMutation.mutate({ op: opData, items: itemsData })
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold gradient-text">Nova Carga</h1>
          <p className="text-sm text-muted-foreground">Criar operação de expedição</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="h-4 w-4 text-primary" />Dados da Carga</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Número da Carga *</Label><Input value={loadNumber} onChange={e => setLoadNumber(e.target.value)} placeholder="CG-2024-005" required /></div>
              <div className="space-y-2"><Label>Cliente *</Label><Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nome do cliente" required /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Truck className="h-4 w-4 text-primary" />Transporte</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Motorista</Label><Input value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Nome" /></div>
              <div className="space-y-2"><Label>Placa</Label><Input value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)} placeholder="ABC-1D23" /></div>
            </div>
            <div className="space-y-2"><Label>Observações</Label><Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas adicionais" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4 text-primary" />Itens da Carga</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={codeSearch} onChange={e => setCodeSearch(e.target.value)} placeholder="Código do produto..." className="pl-10" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem() }}} />
              </div>
              <Button type="button" onClick={addItem}><Plus className="h-4 w-4" /></Button>
            </div>

            {items.length === 0 ? (
              <div className="glass-card text-center py-8"><p className="text-muted-foreground text-sm">Nenhum item adicionado</p></div>
            ) : (
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.tempId} className="glass-card p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.description}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.product_code}</p>
                    </div>
                    <Input type="number" className="w-20 text-center" value={item.quantity_expected} onChange={e => updateQty(item.tempId, Number(e.target.value))} min={1} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.tempId)}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-12 text-lg" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Criando...' : 'Criar Carga'}
        </Button>
      </form>
    </div>
  )
}
