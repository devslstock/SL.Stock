import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Image as ImageIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/utils/formatters'
import { productsApi } from '@/api/products'
import { toast } from '@/components/ui/toaster'

interface ProductSearchInlineProps {
  priceTableId?: string | null
  currentItems: any[]
  onUpdateQuantity: (productId: string, quantity: number, price: number) => void
}

export function ProductSearchInline({ priceTableId, currentItems, onUpdateQuantity }: ProductSearchInlineProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'repositions' | 'promotions' | 'highlights'>('all')

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts,
  })

  const { data: priceTableData } = useQuery({
    queryKey: ['price_table', priceTableId],
    queryFn: async () => {
      if (!priceTableId) return null
      const { priceTablesApi } = await import('@/api/priceTables')
      return priceTablesApi.getPriceTable(priceTableId)
    },
    enabled: !!priceTableId
  })
  const priceTableItems = priceTableData?.price_table_items || []

  const productsWithPrices = useMemo(() => {
    return products.map((product: any) => {
      let finalPrice = 0
      if (priceTableId) {
        const tableItem = priceTableItems.find((pti: any) => pti.product_id === product.id)
        if (tableItem) {
          finalPrice = tableItem.price
        }
      }
      return {
        ...product,
        finalPrice
      }
    })
  }, [products, priceTableItems, priceTableId])

  const filteredProducts = useMemo(() => {
    let filtered = productsWithPrices
    
    // Filtro por abas
    if (activeTab === 'promotions') {
      filtered = []
    } else if (activeTab === 'highlights') {
      filtered = []
    } else if (activeTab === 'repositions') {
      filtered = []
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((p: any) => 
        p.description?.toLowerCase().includes(term) ||
        p.code?.toLowerCase().includes(term) ||
        p.ean?.includes(term)
      )
    }
    
    return filtered.slice(0, 50)
  }, [productsWithPrices, searchTerm, activeTab])

  const handleUpdate = (productId: string, delta: number) => {
    const product = productsWithPrices.find(p => p.id === productId)
    if (!product) return

    const currentItem = currentItems.find(i => i.product_id === productId)
    const currentQty = currentItem?.quantity || 0
    const nextQty = Math.max(0, currentQty + delta)
    
    if (delta > 0) {
      const availableStock = (product.stock || 0) - (product.reserved_stock || 0)
      const realAvailable = availableStock + currentQty
      
      if (nextQty > realAvailable) {
        toast({ title: "Erro", description: `Quantidade indisponível. Saldo máximo: ${realAvailable}`, variant: "destructive" })
        return
      }
    }

    onUpdateQuantity(productId, nextQty, product.finalPrice)
  }

  return (
                          <span className="text-xs text-muted-foreground">un</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center flex-1 w-full gap-1 text-primary">
                          <span className="text-2xl font-black">{qty}</span>
                          <span className="text-xs">un</span>
                        </div>
                      )}

                      <div className="flex w-full overflow-hidden rounded shadow-sm border border-border mt-1">
                        <button 
                          className="flex-1 bg-muted hover:bg-muted/80 h-9 flex items-center justify-center border-r border-border transition-colors disabled:opacity-50"
                          onClick={() => handleUpdateQuantity(product.id, -1)}
                          disabled={qty === 0}
                        >
                          <span className="text-lg font-bold">-</span>
                        </button>
                        <button 
                          className="flex-1 bg-[#1a1530] hover:bg-[#2a2540] text-white h-9 flex items-center justify-center transition-colors"
                          onClick={() => handleUpdateQuantity(product.id, 1)}
                        >
                          <span className="text-lg font-bold">+</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* FOOTER FIXO (Resumo) */}
        <div className="bg-card border-t border-border p-4 flex items-center justify-between z-10">
          <div className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{totalItems}</span> itens adicionados
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Total:</span>
            <span className="font-bold text-emerald-600 text-lg">{formatCurrency(totalValue)}</span>
            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center ml-1">
              <span className="text-[10px] text-muted-foreground font-bold">$</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
