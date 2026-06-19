import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { customersApi } from '@/api/customers'
import { useSalesCart } from '@/stores/salesCart'
import { Search, ArrowLeft, Building2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SelectCustomer() {
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()
  const setCustomer = useSalesCart((state: any) => state.setCustomer)

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getCustomers,
  })

  const filteredCustomers = customers.filter(c => {
    if (!c.active) return false // Só pode vender para cliente ativo
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return c.fantasy_name?.toLowerCase().includes(term) ||
             c.legal_name?.toLowerCase().includes(term) ||
             c.document?.includes(term)
    }
    return true
  })

  const handleSelectCustomer = (customerId: string, priceTableId: string | null) => {
    setCustomer(customerId, priceTableId)
    navigate('/vendas/novo-pedido/produtos')
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 -ml-2 text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="font-bold text-lg text-foreground">Selecionar Cliente</h1>
      </header>

      <div className="bg-card p-4 shadow-sm z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou CNPJ" 
            className="pl-10 h-12 bg-muted border-none text-base rounded-xl"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando clientes...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
            <Building2 className="h-12 w-12 mb-3 opacity-20" />
            <p>Nenhum cliente ativo encontrado.</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden divide-y divide-border">
            {filteredCustomers.map(customer => (
              <button 
                key={customer.id} 
                onClick={() => handleSelectCustomer(customer.id, customer.price_table_id)}
                className="w-full text-left p-4 hover:bg-muted active:bg-muted/80 transition-colors flex items-center gap-3"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-foreground truncate">
                    {customer.legal_name || customer.fantasy_name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">{customer.city}/{customer.state}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
