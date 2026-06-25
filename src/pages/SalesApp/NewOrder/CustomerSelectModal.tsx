import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, ChevronLeft, MapPin, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { customersApi } from '@/api/customers'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface CustomerSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectCustomer: (customerId: string) => void
}

export function CustomerSelectModal({ isOpen, onClose, onSelectCustomer }: CustomerSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getCustomers,
    enabled: isOpen
  })

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers.slice(0, 50)
    const term = searchTerm.toLowerCase()
    return customers.filter((c: any) => 
      c.legal_name?.toLowerCase().includes(term) ||
      c.fantasy_name?.toLowerCase().includes(term) ||
      c.document?.includes(term)
    ).slice(0, 50)
  }, [customers, searchTerm])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 flex flex-col gap-0 w-full h-[100dvh] max-w-full sm:max-w-xl sm:h-[85vh] sm:rounded-xl overflow-hidden bg-background">
        
        {/* HEADER */}
        <div className="bg-card border-b border-border z-10 flex flex-col pt-2">
          <div className="flex items-center justify-between p-2">
            <Button variant="ghost" className="text-foreground gap-1 p-2 h-9" onClick={onClose}>
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">Orçamento</span>
            </Button>
            <div className="font-bold text-sm">Clientes</div>
            <div className="w-20"></div> {/* Placeholder for balance */}
          </div>
          
          <div className="p-3 bg-muted/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar clientes" 
                className="pl-9 bg-background border-border rounded-full h-10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando clientes...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhum cliente encontrado.</div>
          ) : (
            <div className="flex flex-col relative pb-10">
              <div className="px-4 py-2 bg-muted/30 text-muted-foreground font-semibold text-xs border-b border-border">
                #
              </div>
              {filteredCustomers.map((customer: any) => (
                <div 
                  key={customer.id} 
                  className="flex flex-col border-b border-border bg-card p-4 gap-1 hover:bg-muted/50 cursor-pointer"
                  onClick={() => onSelectCustomer(customer.id)}
                >
                  <div className="font-bold text-sm uppercase text-foreground leading-tight">
                    + {customer.fantasy_name || customer.legal_name}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase mt-1 line-clamp-1">
                    {customer.legal_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {customer.document}
                  </div>
                  
                  {customer.city && customer.state && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      {customer.city}, {customer.state}
                    </div>
                  )}

                  {!customer.active && (
                    <div className="mt-2 flex flex-col gap-1">
                      <div>
                        <Badge variant="outline" className="border-red-500 text-red-600 bg-red-50 hover:bg-red-50">Bloqueado</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                        <Ban className="h-3 w-3" />
                        Motivo: Desativado
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Side Alphabet (Mock) */}
              <div className="fixed right-1 top-[200px] bottom-[100px] flex flex-col justify-between items-center text-[9px] text-[#1a1530] font-bold z-20 pointer-events-none opacity-50">
                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => (
                  <span key={letter}>{letter}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM NAV BAR (Mock) */}
        <div className="bg-card border-t border-border flex items-center justify-around h-[60px] pb-safe z-10">
           <div className="flex flex-col items-center justify-center text-[#1a1530] flex-1 cursor-pointer">
             <div className="relative">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
               <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">3</span>
             </div>
             <span className="text-[10px] mt-1 font-bold">Pedidos</span>
           </div>
           <div className="flex flex-col items-center justify-center text-muted-foreground flex-1 cursor-pointer">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
             <span className="text-[10px] mt-1 font-medium">Clientes</span>
           </div>
           <div className="flex flex-col items-center justify-center text-muted-foreground flex-1 cursor-pointer">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
             <span className="text-[10px] mt-1 font-medium">Produtos</span>
           </div>
           <div className="flex flex-col items-center justify-center text-muted-foreground flex-1 cursor-pointer">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
             <span className="text-[10px] mt-1 font-medium">Tarefas</span>
           </div>
           <div className="flex flex-col items-center justify-center text-muted-foreground flex-1 cursor-pointer">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
             <span className="text-[10px] mt-1 font-medium">Mais</span>
           </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}
